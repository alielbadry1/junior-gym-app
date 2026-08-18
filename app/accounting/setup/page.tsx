import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import {
  seedChartOfAccounts,
  seedCashAccounts,
  seedTransactionTypes,
} from "./actions";

export default async function AccountingSetupPage() {
  const supabase = await createClient();

  const [statementsRes, mainAccountsRes, subAccountsRes, cashAccountsRes, transactionTypesRes] =
    await Promise.all([
      supabase.from("financial_statements").select("id, name").order("name"),
      supabase
        .from("main_accounts")
        .select("id, name, nature, financial_statement_id")
        .order("name"),
      supabase
        .from("sub_accounts")
        .select("id, name, main_account_id")
        .order("name"),
      supabase.from("cash_accounts").select("id, name").order("name"),
      supabase
        .from("transaction_types")
        .select("id, name, generates_entry, triggers_cogs")
        .order("name"),
    ]);

  const statements = statementsRes.data ?? [];
  const mainAccounts = mainAccountsRes.data ?? [];
  const subAccounts = subAccountsRes.data ?? [];
  const cashAccounts = cashAccountsRes.data ?? [];
  const transactionTypes = transactionTypesRes.data ?? [];

  return (
    <AppShell>
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-teal-900">
            إعدادات الحسابات والقيود
          </h1>
          <p className="text-sm text-brand-teal-700 mt-1">
            شجرة الحسابات، الحسابات النقدية، وأنواع العمليات — أساس محرك
            القيود المحاسبية
          </p>
        </div>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-brand-teal-900">شجرة الحسابات</h2>
            <form action={seedChartOfAccounts}>
              <button
                type="submit"
                className="inline-flex items-center rounded-xl bg-brand-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-teal-800 transition-colors"
              >
                تهيئة / تحديث شجرة الحسابات
              </button>
            </form>
          </div>
          <p className="text-xs text-brand-teal-700/70 mb-4">
            شجرة أولية مبنية على القرارات المذكورة في CLAUDE_PROJECT_BRIEF.md
            — لسه محتاجة مراجعة نهائية من صاحب المشروع قبل الترحيل.
          </p>

          {statements.length === 0 ? (
            <p className="text-sm text-brand-teal-700/60">
              لسه ماتهيّئتش — دوس الزرار فوق
            </p>
          ) : (
            <div className="space-y-4">
              {statements.map((st) => (
                <div key={st.id}>
                  <div className="font-bold text-sm text-brand-teal-900 mb-1.5">
                    {st.name}
                  </div>
                  <div className="space-y-1.5 ps-3">
                    {mainAccounts
                      .filter((m) => m.financial_statement_id === st.id)
                      .map((m) => (
                        <div key={m.id} className="text-xs">
                          <span className="font-bold text-brand-teal-800">
                            {m.name}{" "}
                          </span>
                          <span className="text-brand-teal-700/50">
                            ({m.nature})
                          </span>
                          <span className="text-brand-teal-700/70">
                            {" — "}
                            {subAccounts
                              .filter((s) => s.main_account_id === m.id)
                              .map((s) => s.name)
                              .join("، ")}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-brand-teal-900">
              الحسابات النقدية
            </h2>
            <form action={seedCashAccounts}>
              <button
                type="submit"
                className="inline-flex items-center rounded-xl bg-brand-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-teal-800 transition-colors"
              >
                تهيئة الحسابات النقدية
              </button>
            </form>
          </div>
          {cashAccounts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {cashAccounts.map((c) => (
                <span
                  key={c.id}
                  className="inline-block rounded-full bg-brand-teal-700/10 px-3 py-1 text-sm font-medium text-brand-teal-800"
                >
                  {c.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brand-teal-700/60">
              لسه ماتهيّئتش — دوس الزرار فوق
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-brand-teal-900">أنواع العمليات</h2>
            <form action={seedTransactionTypes}>
              <button
                type="submit"
                className="inline-flex items-center rounded-xl bg-brand-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-teal-800 transition-colors"
              >
                تهيئة أنواع العمليات
              </button>
            </form>
          </div>
          <p className="text-xs text-brand-teal-700/70 mb-3">
            محتاجة شجرة الحسابات متهيّئة الأول
          </p>
          {transactionTypes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {transactionTypes.map((t) => (
                <span
                  key={t.id}
                  className="inline-block rounded-full bg-surface-muted border border-border px-2.5 py-1 text-xs font-medium text-brand-teal-800"
                >
                  {t.name}
                  {t.triggers_cogs && (
                    <span className="text-brand-amber-500"> •COGS</span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brand-teal-700/60">
              لسه ماتهيّئتش — {transactionTypes.length}/~45 نوع
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
