import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { recordStaffTransaction } from "../actions";

const TRAINER_TX_TYPES = ["مكافأة (مدرب)", "خصومات إدارية", "تسليم راتب (مدرب)"];
const EMPLOYEE_TX_TYPES = [
  "استحقاق راتب",
  "استحقاق راتب الحضانة",
  "مكافأة (موظف)",
  "تسليم راتب (موظف)",
];
const CASH_OUT_TYPES = ["تسليم راتب (مدرب)", "تسليم راتب (موظف)"];

export default async function StaffStatementPage({
  params,
}: PageProps<"/reports/staff/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: person } = await supabase
    .from("parties")
    .select("id, full_name, phone_1")
    .eq("id", id)
    .single();

  if (!person) {
    notFound();
  }

  const { data: roles } = await supabase
    .from("party_roles")
    .select("role")
    .eq("party_id", id)
    .in("role", ["trainer", "employee"]);
  const roleNames = (roles ?? []).map((r) => r.role);

  const [payableTrainerId, payableEmployeeId, cashAccountsRes] = await Promise.all([
    supabase.from("sub_accounts").select("id").eq("name", "الرواتب المستحقة - المدربين").maybeSingle().then((r) => r.data?.id),
    supabase.from("sub_accounts").select("id").eq("name", "الرواتب المستحقة - الموظفين").maybeSingle().then((r) => r.data?.id),
    supabase.from("cash_accounts").select("id, name").order("name"),
  ]);
  const payableIds = new Set([payableTrainerId, payableEmployeeId].filter(Boolean));

  const [cogsEntriesRes, salaryEntriesRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select(
        "id, amount, debit_sub_account_id, credit_sub_account_id, daily_transactions(transaction_date, notes)"
      )
      .eq("trainer_party_id", id),
    supabase
      .from("journal_entries")
      .select(
        "id, amount, debit_sub_account_id, credit_sub_account_id, daily_transactions!inner(transaction_date, notes, employee_party_id)"
      )
      .eq("daily_transactions.employee_party_id", id),
  ]);

  const rawEntries = [
    ...(cogsEntriesRes.data ?? []).map((e) => ({
      id: e.id,
      amount: Number(e.amount),
      debit: e.debit_sub_account_id,
      credit: e.credit_sub_account_id,
      date: e.daily_transactions?.transaction_date ?? "",
      notes: e.daily_transactions?.notes ?? "",
    })),
    ...(salaryEntriesRes.data ?? []).map((e) => ({
      id: e.id,
      amount: Number(e.amount),
      debit: e.debit_sub_account_id,
      credit: e.credit_sub_account_id,
      date: e.daily_transactions.transaction_date,
      notes: e.daily_transactions.notes ?? "",
    })),
  ]
    .filter(
      (e) =>
        (!!e.debit && payableIds.has(e.debit)) ||
        (!!e.credit && payableIds.has(e.credit))
    )
    .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i)
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  const ledger = rawEntries.reduce<
    Array<(typeof rawEntries)[number] & { effect: number; balance: number }>
  >((acc, e) => {
    const effect = !!e.credit && payableIds.has(e.credit) ? e.amount : -e.amount;
    const prevBalance = acc.length > 0 ? acc[acc.length - 1].balance : 0;
    return [
      ...acc,
      { ...e, effect, balance: Number((prevBalance + effect).toFixed(2)) },
    ];
  }, []);

  const balance = ledger.length > 0 ? ledger[ledger.length - 1].balance : 0;

  const availableTypes = [
    ...(roleNames.includes("trainer") ? TRAINER_TX_TYPES : []),
    ...(roleNames.includes("employee") ? EMPLOYEE_TX_TYPES : []),
  ];

  return (
    <AppShell>
      <div className="max-w-3xl">
        <Link
          href="/reports/staff"
          className="text-sm text-brand-teal-700 hover:text-brand-teal-900 font-medium"
        >
          ← رجوع لكشوف المدربين والموظفين
        </Link>
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mt-2 mb-1">
          {person.full_name}
        </h1>
        <p className="text-sm text-brand-teal-700 mb-6">
          {person.phone_1 ?? ""}
        </p>

        <div className="rounded-2xl border border-border bg-surface p-4 mb-8 max-w-xs">
          <div className="text-xs font-bold text-brand-teal-700/70">
            الرصيد المستحق حاليًا
          </div>
          <div className="mt-1 text-lg font-extrabold text-brand-teal-950">
            {balance.toLocaleString("ar-EG")} ج.م
          </div>
          <div className="text-[11px] text-brand-teal-700/60 mt-1">
            موجب = مستحق له، سالب = عليه سلفة
          </div>
        </div>

        {availableTypes.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface p-5 mb-8">
            <h2 className="font-bold text-brand-teal-900 mb-3">
              تسجيل عملية جديدة
            </h2>
            <form action={recordStaffTransaction} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="party_id" value={id} />
              <div>
                <label className="block text-xs font-bold text-brand-teal-900 mb-1">
                  نوع العملية
                </label>
                <select
                  name="transaction_type_name"
                  required
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none"
                >
                  {availableTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-teal-900 mb-1">
                  القيمة (ج.م)
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  min={0}
                  step="0.01"
                  className="w-32 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-teal-900 mb-1">
                  الحساب النقدي (لو تسليم راتب)
                </label>
                <select
                  name="cash_account_id"
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none"
                >
                  <option value="">— بدون —</option>
                  {(cashAccountsRes.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="inline-flex items-center rounded-xl bg-brand-coral-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-coral-600 transition-colors"
              >
                تسجيل
              </button>
            </form>
            <p className="text-[11px] text-brand-teal-700/60 mt-2">
              أنواع تسليم الراتب ({CASH_OUT_TYPES.join("، ")}) بتتحقق تلقائيًا
              من كفاية رصيد الحساب النقدي المختار قبل التنفيذ.
            </p>
          </div>
        )}

        <h2 className="font-bold text-brand-teal-900 mb-3">كشف الحركة</h2>
        <div className="rounded-2xl border border-border bg-surface overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-right min-w-[500px]">
            <thead className="bg-surface-muted text-brand-teal-900">
              <tr>
                <th className="px-4 py-3 font-bold">التاريخ</th>
                <th className="px-4 py-3 font-bold">ملاحظات</th>
                <th className="px-4 py-3 font-bold">القيمة</th>
                <th className="px-4 py-3 font-bold">الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length > 0 ? (
                ledger.map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="px-4 py-3 text-brand-teal-800/80">{l.date}</td>
                    <td className="px-4 py-3 text-brand-teal-800/80">{l.notes}</td>
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
                  <td colSpan={4} className="px-4 py-10 text-center text-brand-teal-700/60">
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
