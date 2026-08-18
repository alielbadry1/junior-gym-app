import Link from "next/link";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getCashAccountBalance } from "@/lib/accounting";

export default async function CashReportPage({
  searchParams,
}: PageProps<"/reports/cash">) {
  const params = await searchParams;
  const selectedId = typeof params.account === "string" ? params.account : "";

  const supabase = await createClient();
  const { data: cashAccounts } = await supabase
    .from("cash_accounts")
    .select("id, name")
    .order("name");

  const balances = await Promise.all(
    (cashAccounts ?? []).map(async (c) => ({
      ...c,
      balance: await getCashAccountBalance(supabase, c.id),
    }))
  );

  const totalBalance = balances.reduce((sum, c) => sum + c.balance, 0);

  let movements: {
    id: string;
    date: string;
    typeName: string;
    amount: number;
    notes: string | null;
  }[] = [];

  if (selectedId) {
    const { data } = await supabase
      .from("daily_transactions")
      .select("id, transaction_date, amount, notes, transaction_types(name)")
      .eq("cash_account_id", selectedId)
      .order("transaction_date", { ascending: false });

    movements = (data ?? []).map((d) => ({
      id: d.id,
      date: d.transaction_date,
      typeName: d.transaction_types?.name ?? "",
      amount: Number(d.amount),
      notes: d.notes,
    }));
  }

  return (
    <AppShell>
      <div className="max-w-3xl">
        <Link
          href="/reports"
          className="text-sm text-brand-teal-700 hover:text-brand-teal-900 font-medium"
        >
          ← رجوع للتقارير
        </Link>
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mt-2 mb-1">
          النقدية والخزينة
        </h1>
        <p className="text-sm text-brand-teal-700 mb-6">
          إجمالي كل الحسابات النقدية:{" "}
          <span className="font-bold text-brand-teal-950">
            {totalBalance.toLocaleString("ar-EG")} ج.م
          </span>
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {balances.map((c) => (
            <Link
              key={c.id}
              href={`/reports/cash?account=${c.id}`}
              className={`rounded-2xl border p-4 transition-colors ${
                selectedId === c.id
                  ? "border-brand-teal-600 bg-brand-teal-600/5"
                  : "border-border bg-surface hover:border-brand-teal-600/40"
              }`}
            >
              <div className="text-xs font-bold text-brand-teal-700/70">
                {c.name}
              </div>
              <div
                className={`mt-1 text-lg font-extrabold ${
                  c.balance < 0 ? "text-brand-coral-600" : "text-brand-teal-950"
                }`}
              >
                {c.balance.toLocaleString("ar-EG")} ج.م
              </div>
            </Link>
          ))}
          {balances.length === 0 && (
            <p className="text-sm text-brand-teal-700/60 col-span-full">
              لسه محتاج تهيئة الحسابات النقدية من إعدادات الحسابات
            </p>
          )}
        </div>

        {selectedId && (
          <>
            <h2 className="font-bold text-brand-teal-900 mb-3">
              حركة {balances.find((c) => c.id === selectedId)?.name}
            </h2>
            <div className="rounded-2xl border border-border bg-surface overflow-hidden overflow-x-auto">
              <table className="w-full text-sm text-right min-w-[500px]">
                <thead className="bg-surface-muted text-brand-teal-900">
                  <tr>
                    <th className="px-4 py-3 font-bold">التاريخ</th>
                    <th className="px-4 py-3 font-bold">العملية</th>
                    <th className="px-4 py-3 font-bold">ملاحظات</th>
                    <th className="px-4 py-3 font-bold">القيمة</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length > 0 ? (
                    movements.map((m) => (
                      <tr key={m.id} className="border-t border-border">
                        <td className="px-4 py-3 text-brand-teal-800/80">{m.date}</td>
                        <td className="px-4 py-3 text-brand-teal-800/80">{m.typeName}</td>
                        <td className="px-4 py-3 text-brand-teal-800/80">{m.notes ?? "—"}</td>
                        <td className="px-4 py-3 font-medium text-brand-teal-950">
                          {m.amount.toLocaleString("ar-EG")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-brand-teal-700/60">
                        مفيش حركة على الحساب ده بعد
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
