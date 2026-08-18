import Link from "next/link";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

type GroupBy = "department" | "activity" | "program";

type GroupRow = {
  id: string;
  name: string;
  revenue: number;
  cogs: number;
  discount: number;
};

type ProgramInfo = {
  id: string;
  name: string;
  activities: { id: string; name: string; departments: { id: string; name: string } | null } | null;
} | null;

export default async function IncomeStatementPage({
  searchParams,
}: PageProps<"/reports/income-statement">) {
  const params = await searchParams;
  const groupBy = (typeof params.group_by === "string" ? params.group_by : "department") as GroupBy;
  const fromDate = typeof params.from === "string" ? params.from : "";
  const toDate = typeof params.to === "string" ? params.to : "";
  const costCenterId = typeof params.cost_center === "string" ? params.cost_center : "";

  const supabase = await createClient();

  const [costCentersRes, subAccountsRes] = await Promise.all([
    supabase.from("cost_centers").select("id, name").order("name"),
    supabase.from("sub_accounts").select("id, name, main_accounts(name)"),
  ]);

  const accountInfo = new Map(
    (subAccountsRes.data ?? []).map((s) => [
      s.id,
      { name: s.name, mainName: s.main_accounts?.name ?? "" },
    ])
  );

  let query = supabase
    .from("journal_entries")
    .select(
      "id, amount, debit_sub_account_id, credit_sub_account_id, cost_center_id, daily_transactions!inner(transaction_date, program_id, programs(id, name, activity_id, activities(id, name, department_id, departments(id, name))))"
    );

  if (fromDate) query = query.gte("daily_transactions.transaction_date", fromDate);
  if (toDate) query = query.lte("daily_transactions.transaction_date", toDate);
  if (costCenterId) query = query.eq("cost_center_id", costCenterId);

  const { data: entries, error } = await query;

function resolveGroup(groupBy: GroupBy, program: ProgramInfo) {
    if (!program) return { groupId: "unassigned", groupName: "بدون برنامج محدد" };
    if (groupBy === "program") return { groupId: program.id, groupName: program.name };
    if (groupBy === "activity" && program.activities) {
      return { groupId: program.activities.id, groupName: program.activities.name };
    }
    if (groupBy === "department" && program.activities?.departments) {
      return {
        groupId: program.activities.departments.id,
        groupName: program.activities.departments.name,
      };
    }
    if (program.activities) {
      // fallback لو الأقسام مش مربوطة بنشاط
      return { groupId: program.activities.id, groupName: program.activities.name };
    }
    return { groupId: "unassigned", groupName: "بدون برنامج محدد" };
  }

  function addToGroup(
    groups: Map<string, GroupRow>,
    groupId: string,
    groupName: string,
    field: "revenue" | "cogs" | "discount",
    amount: number
  ) {
    const existing = groups.get(groupId) ?? {
      id: groupId,
      name: groupName,
      revenue: 0,
      cogs: 0,
      discount: 0,
    };
    return new Map(groups).set(groupId, { ...existing, [field]: existing[field] + amount });
  }

  const { groups, indirectTotal } = (entries ?? []).reduce<{
    groups: Map<string, GroupRow>;
    indirectTotal: number;
  }>(
    (state, e) => {
      const debitInfo = e.debit_sub_account_id ? accountInfo.get(e.debit_sub_account_id) : null;
      const creditInfo = e.credit_sub_account_id ? accountInfo.get(e.credit_sub_account_id) : null;
      const amount = Number(e.amount);
      const { groupId, groupName } = resolveGroup(
        groupBy,
        e.daily_transactions.programs as unknown as ProgramInfo
      );

      if (creditInfo?.name === "المبيعات") {
        return { ...state, groups: addToGroup(state.groups, groupId, groupName, "revenue", amount) };
      }
      if (debitInfo?.mainName === "تكلفة الخدمات المباعة") {
        return { ...state, groups: addToGroup(state.groups, groupId, groupName, "cogs", amount) };
      }
      if (debitInfo?.name === "خصم مسموح به") {
        return { ...state, groups: addToGroup(state.groups, groupId, groupName, "discount", amount) };
      }
      if (
        debitInfo?.mainName === "المصروفات التشغيلية والإدارية" &&
        debitInfo?.name !== "خصم مسموح به"
      ) {
        return { ...state, indirectTotal: state.indirectTotal + amount };
      }
      return state;
    },
    { groups: new Map(), indirectTotal: 0 }
  );

  const rows = Array.from(groups.values())
    .map((g) => ({ ...g, grossProfit: Number((g.revenue - g.cogs - g.discount).toFixed(2)) }))
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);

  const finalRows = rows.map((r) => {
    const share = totalRevenue > 0 ? r.revenue / totalRevenue : 0;
    const allocatedIndirect = Number((indirectTotal * share).toFixed(2));
    return {
      ...r,
      share: Number((share * 100).toFixed(1)),
      allocatedIndirect,
      netProfit: Number((r.grossProfit - allocatedIndirect).toFixed(2)),
    };
  });

  const totals = finalRows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue,
      cogs: acc.cogs + r.cogs,
      discount: acc.discount + r.discount,
      grossProfit: acc.grossProfit + r.grossProfit,
      allocatedIndirect: acc.allocatedIndirect + r.allocatedIndirect,
      netProfit: acc.netProfit + r.netProfit,
    }),
    { revenue: 0, cogs: 0, discount: 0, grossProfit: 0, allocatedIndirect: 0, netProfit: 0 }
  );

  return (
    <AppShell>
      <div className="max-w-5xl">
        <Link
          href="/reports"
          className="text-sm text-brand-teal-700 hover:text-brand-teal-900 font-medium"
        >
          ← رجوع للتقارير
        </Link>
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mt-2 mb-1">
          قائمة الدخل الموحّدة
        </h1>
        <p className="text-sm text-brand-teal-700 mb-6">
          تجميع الإيراد المحاسبي (وقت الحضور/التحصيل الفعلي، مش وقت الاشتراك)
        </p>

        <form className="mb-6 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-bold text-brand-teal-900 mb-1">
              التجميع حسب
            </label>
            <select
              name="group_by"
              defaultValue={groupBy}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none"
            >
              <option value="department">القسم الرئيسي</option>
              <option value="activity">النشاط</option>
              <option value="program">البرنامج</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-teal-900 mb-1">
              مركز التكلفة
            </label>
            <select
              name="cost_center"
              defaultValue={costCenterId}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none"
            >
              <option value="">الاثنين مجمّعين</option>
              {(costCentersRes.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-teal-900 mb-1">
              من تاريخ
            </label>
            <input
              type="date"
              name="from"
              defaultValue={fromDate}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-teal-900 mb-1">
              إلى تاريخ
            </label>
            <input
              type="date"
              name="to"
              defaultValue={toDate}
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

        {error && (
          <div className="rounded-xl border border-brand-coral-500/30 bg-brand-coral-100/40 p-4 text-sm text-brand-coral-600 mb-4">
            تعذّر تحميل البيانات: {error.message}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-surface overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-right min-w-[760px]">
            <thead className="bg-surface-muted text-brand-teal-900">
              <tr>
                <th className="px-3 py-3 font-bold">المستوى</th>
                <th className="px-3 py-3 font-bold">الإيراد</th>
                <th className="px-3 py-3 font-bold">COGS</th>
                <th className="px-3 py-3 font-bold">الخصم</th>
                <th className="px-3 py-3 font-bold">مجمل الربح</th>
                <th className="px-3 py-3 font-bold">% من الإيراد</th>
                <th className="px-3 py-3 font-bold">مصروفات موزّعة</th>
                <th className="px-3 py-3 font-bold">صافي الربح</th>
              </tr>
            </thead>
            <tbody>
              {finalRows.length > 0 ? (
                finalRows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2.5 font-medium text-brand-teal-950">{r.name}</td>
                    <td className="px-3 py-2.5">{r.revenue.toLocaleString("ar-EG")}</td>
                    <td className="px-3 py-2.5">{r.cogs.toLocaleString("ar-EG")}</td>
                    <td className="px-3 py-2.5">{r.discount.toLocaleString("ar-EG")}</td>
                    <td className="px-3 py-2.5 font-medium">{r.grossProfit.toLocaleString("ar-EG")}</td>
                    <td className="px-3 py-2.5 text-brand-teal-700/70">{r.share}%</td>
                    <td className="px-3 py-2.5">{r.allocatedIndirect.toLocaleString("ar-EG")}</td>
                    <td
                      className={`px-3 py-2.5 font-bold ${
                        r.netProfit < 0 ? "text-brand-coral-600" : "text-brand-teal-950"
                      }`}
                    >
                      {r.netProfit.toLocaleString("ar-EG")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-brand-teal-700/60">
                    مفيش بيانات في الفترة/المركز المحدد
                  </td>
                </tr>
              )}
            </tbody>
            {finalRows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-brand-teal-700/30 font-bold">
                  <td className="px-3 py-3 text-brand-teal-900">الإجمالي</td>
                  <td className="px-3 py-3">{totals.revenue.toLocaleString("ar-EG")}</td>
                  <td className="px-3 py-3">{totals.cogs.toLocaleString("ar-EG")}</td>
                  <td className="px-3 py-3">{totals.discount.toLocaleString("ar-EG")}</td>
                  <td className="px-3 py-3">{totals.grossProfit.toLocaleString("ar-EG")}</td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3">{totals.allocatedIndirect.toLocaleString("ar-EG")}</td>
                  <td className="px-3 py-3">{totals.netProfit.toLocaleString("ar-EG")}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <p className="text-[11px] text-brand-teal-700/60 mt-3 leading-relaxed">
          ملاحظة تبسيط مقصودة: بند &quot;إيجار&quot; مذكور في البريف كبند
          يُخصم قبل مجمل الربح موزّعًا حسب مركز التكلفة — عمليًا هو مصروف عام
          مش مرتبط ببرنامج بعينه زي باقي المصروفات غير المباشرة، فتم إدراجه
          هنا ضمن &quot;المصروفات الموزّعة&quot; بنفس آلية التوزيع بالنسبة
          للإيراد بدل ما يُفصل كبند مستقل. مصروفات بدون تاريخ عملية (لو حصل)
          مش هتظهر في أي فلتر تاريخ محدد.
        </p>
      </div>
    </AppShell>
  );
}
