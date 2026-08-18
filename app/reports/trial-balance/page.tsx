import Link from "next/link";
import { Fragment } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getSubAccountBalances } from "@/lib/accounting";

export default async function TrialBalancePage({
  searchParams,
}: PageProps<"/reports/trial-balance">) {
  const params = await searchParams;
  const asOf = typeof params.as_of === "string" ? params.as_of : "";

  const supabase = await createClient();
  const balances = await getSubAccountBalances(
    supabase,
    asOf ? { toDate: asOf } : undefined
  );

  const grouped = new Map<string, typeof balances>();
  for (const b of balances) {
    const key = `${b.financialStatementName}::${b.mainAccountName}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(b);
  }

  const totalDebit = balances.reduce((s, b) => s + Math.max(b.balance, 0), 0);
  const totalCredit = balances.reduce((s, b) => s + Math.max(-b.balance, 0), 0);

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
          ميزان المراجعة
        </h1>
        <p className="text-sm text-brand-teal-700 mb-6">
          رصيد كل حساب فرعي حتى تاريخ معيّن
        </p>

        <form className="mb-6 flex items-end gap-3">
          <div>
            <label className="block text-xs font-bold text-brand-teal-900 mb-1">
              حتى تاريخ (اختياري)
            </label>
            <input
              type="date"
              name="as_of"
              defaultValue={asOf}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center rounded-xl bg-brand-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-teal-800 transition-colors"
          >
            تطبيق
          </button>
        </form>

        <div className="rounded-2xl border border-border bg-surface overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-right min-w-[500px]">
            <thead className="bg-surface-muted text-brand-teal-900">
              <tr>
                <th className="px-4 py-3 font-bold">الحساب</th>
                <th className="px-4 py-3 font-bold">مدين</th>
                <th className="px-4 py-3 font-bold">دائن</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(grouped.entries()).map(([key, rows]) => {
                const [statement, mainAccount] = key.split("::");
                return (
                  <Fragment key={key}>
                    <tr className="border-t border-border bg-surface-muted/50">
                      <td colSpan={3} className="px-4 py-2 text-xs font-bold text-brand-teal-800">
                        {statement} ← {mainAccount}
                      </td>
                    </tr>
                    {rows.map((r) => (
                      <tr key={r.subAccountId} className="border-t border-border">
                        <td className="px-4 py-2.5 text-brand-teal-800/90 ps-8">
                          {r.subAccountName}
                        </td>
                        <td className="px-4 py-2.5 text-brand-teal-950">
                          {r.balance > 0 ? r.balance.toLocaleString("ar-EG") : ""}
                        </td>
                        <td className="px-4 py-2.5 text-brand-teal-950">
                          {r.balance < 0 ? (-r.balance).toLocaleString("ar-EG") : ""}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-brand-teal-700/30 font-bold">
                <td className="px-4 py-3 text-brand-teal-900">الإجمالي</td>
                <td className="px-4 py-3 text-brand-teal-950">
                  {totalDebit.toLocaleString("ar-EG")}
                </td>
                <td className="px-4 py-3 text-brand-teal-950">
                  {totalCredit.toLocaleString("ar-EG")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
