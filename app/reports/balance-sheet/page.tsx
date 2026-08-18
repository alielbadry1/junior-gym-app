import Link from "next/link";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getSubAccountBalances } from "@/lib/accounting";

export default async function BalanceSheetPage({
  searchParams,
}: PageProps<"/reports/balance-sheet">) {
  const params = await searchParams;
  const asOf = typeof params.as_of === "string" ? params.as_of : "";

  const supabase = await createClient();
  const all = await getSubAccountBalances(
    supabase,
    asOf ? { toDate: asOf } : undefined
  );
  const balances = all.filter((b) => b.financialStatementName === "المركز المالي");

  const mainAccountOrder = [
    "الأصول المتداولة",
    "الأصول الثابتة",
    "الالتزامات المتداولة",
    "حقوق الملكية",
  ];

  const grouped = new Map<string, typeof balances>();
  for (const b of balances) {
    if (!grouped.has(b.mainAccountName)) grouped.set(b.mainAccountName, []);
    grouped.get(b.mainAccountName)!.push(b);
  }

  const totalAssets = balances
    .filter((b) => b.mainAccountNature === "مدين")
    .reduce((s, b) => s + b.balance, 0);
  const totalLiabilitiesAndEquity = balances
    .filter((b) => b.mainAccountNature === "دائن")
    .reduce((s, b) => s - b.balance, 0);

  return (
    <AppShell>
      <div className="max-w-2xl">
        <Link
          href="/reports"
          className="text-sm text-brand-teal-700 hover:text-brand-teal-900 font-medium"
        >
          ← رجوع للتقارير
        </Link>
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mt-2 mb-1">
          المركز المالي
        </h1>
        <p className="text-sm text-brand-teal-700 mb-6">
          الأصول والالتزامات وحقوق الملكية حتى تاريخ معيّن
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

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs font-bold text-brand-teal-700/70">
              إجمالي الأصول
            </div>
            <div className="mt-1 text-lg font-extrabold text-brand-teal-950">
              {totalAssets.toLocaleString("ar-EG")} ج.م
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs font-bold text-brand-teal-700/70">
              الالتزامات + حقوق الملكية
            </div>
            <div className="mt-1 text-lg font-extrabold text-brand-teal-950">
              {totalLiabilitiesAndEquity.toLocaleString("ar-EG")} ج.م
            </div>
          </div>
        </div>
        {Math.abs(totalAssets - totalLiabilitiesAndEquity) > 0.5 && (
          <div className="rounded-xl border border-brand-amber-500/40 bg-brand-amber-100/40 p-3 text-xs text-amber-900 mb-6">
            الجانبان مش متطابقين حاليًا (فرق{" "}
            {Math.abs(totalAssets - totalLiabilitiesAndEquity).toLocaleString("ar-EG")}{" "}
            ج.م) — متوقع لحد ما تتسجّل الأرصدة الافتتاحية بالكامل عند الترحيل.
          </div>
        )}

        <div className="space-y-6">
          {mainAccountOrder.map((mainName) => {
            const rows = grouped.get(mainName);
            if (!rows || rows.length === 0) return null;
            return (
              <div key={mainName}>
                <h2 className="font-bold text-brand-teal-900 mb-2">{mainName}</h2>
                <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                  {rows.map((r) => {
                    const displayValue =
                      r.mainAccountNature === "مدين" ? r.balance : -r.balance;
                    return (
                      <div
                        key={r.subAccountId}
                        className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0"
                      >
                        <span className="text-sm text-brand-teal-800/90">
                          {r.subAccountName}
                        </span>
                        <span className="text-sm font-bold text-brand-teal-950">
                          {displayValue.toLocaleString("ar-EG")} ج.م
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
