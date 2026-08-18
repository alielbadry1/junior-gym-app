import Link from "next/link";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getSubAccountBalances } from "@/lib/accounting";

export default async function LiabilitiesPage() {
  const supabase = await createClient();
  const all = await getSubAccountBalances(supabase);

  const liabilities = all
    .filter((b) => b.mainAccountName === "الالتزامات المتداولة")
    .map((b) => ({ ...b, amount: Number((-b.balance).toFixed(2)) }))
    .filter((b) => Math.abs(b.amount) > 0.009)
    .sort((a, b) => b.amount - a.amount);

  const total = liabilities.reduce((s, l) => s + l.amount, 0);

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
          الالتزامات المستحقة
        </h1>
        <p className="text-sm text-brand-teal-700 mb-6">
          كل الأرصدة المستحقة على الجيم حاليًا
        </p>

        <div className="rounded-2xl border border-brand-coral-500/30 bg-brand-coral-100/40 p-5 mb-8">
          <div className="text-xs font-bold text-brand-coral-600/80">
            إجمالي الالتزامات المستحقة
          </div>
          <div className="mt-1 text-2xl font-extrabold text-brand-coral-600">
            {total.toLocaleString("ar-EG")} ج.م
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          {liabilities.length > 0 ? (
            liabilities.map((l) => (
              <div
                key={l.subAccountId}
                className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0"
              >
                <span className="font-medium text-brand-teal-950">
                  {l.subAccountName}
                </span>
                <span className="font-bold text-brand-teal-950">
                  {l.amount.toLocaleString("ar-EG")} ج.م
                </span>
              </div>
            ))
          ) : (
            <div className="px-4 py-10 text-center text-brand-teal-700/60">
              مفيش التزامات مستحقة حاليًا
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
