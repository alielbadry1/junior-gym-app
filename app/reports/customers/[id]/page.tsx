import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

const TX_TYPE_LABELS: Record<string, string> = {
  "حضور نشاط": "حضور",
  "غياب (بدون تعويض/محتسب)": "غياب محتسب",
  "استلام نقدي": "استلام نقدي",
  "خصم مسموح به": "خصم",
  "استرداد الاشتراك": "استرداد",
  "اشتراك بالحضانة": "اشتراك حضانة",
  "اشتراك بالرحلات": "اشتراك رحلة",
};

export default async function CustomerStatementPage({
  params,
}: PageProps<"/reports/customers/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("parties")
    .select("id, full_name, phone_1")
    .eq("id", id)
    .single();

  if (!customer) {
    notFound();
  }

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id, code, price, discount_amount, status, programs(name)")
    .eq("customer_party_id", id);

  const { data: customerSubAccount } = await supabase
    .from("sub_accounts")
    .select("id")
    .eq("name", "العملاء")
    .maybeSingle();

  const { data: entries } = await supabase
    .from("journal_entries")
    .select(
      "id, amount, debit_sub_account_id, credit_sub_account_id, daily_transactions!inner(transaction_date, notes, customer_party_id, transaction_types(name), programs(name, activities(name)))"
    )
    .eq("daily_transactions.customer_party_id", id)
    .order("id");

  const customerSubId = customerSubAccount?.id;
  const ledger = (entries ?? [])
    .filter(
      (e) =>
        e.debit_sub_account_id === customerSubId ||
        e.credit_sub_account_id === customerSubId
    )
    .map((e) => ({
      date: e.daily_transactions.transaction_date,
      typeName: e.daily_transactions.transaction_types?.name ?? "",
      programName: e.daily_transactions.programs?.name ?? null,
      activityName: e.daily_transactions.programs?.activities?.name ?? null,
      notes: e.daily_transactions.notes,
      effect: e.debit_sub_account_id === customerSubId ? Number(e.amount) : -Number(e.amount),
    }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  const ledgerWithBalance = ledger.reduce<
    Array<(typeof ledger)[number] & { balance: number }>
  >((acc, l) => {
    const prevBalance = acc.length > 0 ? acc[acc.length - 1].balance : 0;
    return [...acc, { ...l, balance: Number((prevBalance + l.effect).toFixed(2)) }];
  }, []);

  const accountingBalance = ledgerWithBalance.length > 0
    ? ledgerWithBalance[ledgerWithBalance.length - 1].balance
    : 0;

  const totalCommitted = (subscriptions ?? []).reduce(
    (sum, s) => sum + (Number(s.price) - Number(s.discount_amount ?? 0)),
    0
  );
  const totalReceived = ledger
    .filter((l) => l.typeName === "استلام نقدي")
    .reduce((sum, l) => sum - l.effect, 0); // استلام نقدي بيقلل رصيد العملاء (effect سالب)، فبنعكسها لرقم موجب
  const commercialBalance = Number((totalCommitted - totalReceived).toFixed(2));

  const byActivity = ledger.reduce<Map<string, number>>((acc, l) => {
    const key = l.activityName ?? "بدون نشاط محدد";
    return new Map(acc).set(key, Number(((acc.get(key) ?? 0) + l.effect).toFixed(2)));
  }, new Map());

  return (
    <AppShell>
      <div className="max-w-3xl">
        <Link
          href="/reports/customers"
          className="text-sm text-brand-teal-700 hover:text-brand-teal-900 font-medium"
        >
          ← رجوع لكشوف العملاء
        </Link>
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mt-2 mb-1">
          {customer.full_name}
        </h1>
        <p className="text-sm text-brand-teal-700 mb-6">
          {customer.phone_1 ?? ""}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs font-bold text-brand-teal-700/70">
              الرصيد التجاري (تقريبي)
            </div>
            <div className="mt-1 text-lg font-extrabold text-brand-teal-950">
              {commercialBalance.toLocaleString("ar-EG")} ج.م
            </div>
            <div className="text-[11px] text-brand-teal-700/60 mt-1">
              إجمالي الاشتراكات المسجّلة ناقص المحصّل نقدًا — لسه محتاج معالجة
              أدق للاشتراكات الموقوفة/المستردة
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs font-bold text-brand-teal-700/70">
              الرصيد المحاسبي
            </div>
            <div className="mt-1 text-lg font-extrabold text-brand-teal-950">
              {accountingBalance.toLocaleString("ar-EG")} ج.م
            </div>
            <div className="text-[11px] text-brand-teal-700/60 mt-1">
              بناءً على الحضور والتحصيل الفعلي فقط
            </div>
          </div>
        </div>

        {byActivity.size > 0 && (
          <div className="mb-8">
            <h2 className="font-bold text-brand-teal-900 mb-2">
              تفصيلي بالنشاط (محاسبي)
            </h2>
            <div className="flex flex-wrap gap-2">
              {Array.from(byActivity.entries()).map(([name, amount]) => (
                <span
                  key={name}
                  className="inline-block rounded-full bg-brand-teal-700/10 px-3 py-1 text-xs font-medium text-brand-teal-800"
                >
                  {name}: {amount.toLocaleString("ar-EG")} ج.م
                </span>
              ))}
            </div>
          </div>
        )}

        <h2 className="font-bold text-brand-teal-900 mb-3">كشف الحركة</h2>
        <div className="rounded-2xl border border-border bg-surface overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-right min-w-[500px]">
            <thead className="bg-surface-muted text-brand-teal-900">
              <tr>
                <th className="px-4 py-3 font-bold">التاريخ</th>
                <th className="px-4 py-3 font-bold">العملية</th>
                <th className="px-4 py-3 font-bold">البرنامج</th>
                <th className="px-4 py-3 font-bold">القيمة</th>
                <th className="px-4 py-3 font-bold">الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {ledgerWithBalance.length > 0 ? (
                ledgerWithBalance.map((l, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-3 text-brand-teal-800/80">
                      {l.date}
                    </td>
                    <td className="px-4 py-3 text-brand-teal-800/80">
                      {TX_TYPE_LABELS[l.typeName] ?? l.typeName}
                    </td>
                    <td className="px-4 py-3 text-brand-teal-800/80">
                      {l.programName ?? "—"}
                    </td>
                    <td
                      className={`px-4 py-3 font-medium ${
                        l.effect >= 0 ? "text-brand-coral-600" : "text-brand-teal-700"
                      }`}
                    >
                      {l.effect >= 0 ? "+" : ""}
                      {l.effect.toLocaleString("ar-EG")}
                    </td>
                    <td className="px-4 py-3 font-bold text-brand-teal-950">
                      {l.balance.toLocaleString("ar-EG")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-brand-teal-700/60">
                    مفيش حركة مسجّلة بعد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
