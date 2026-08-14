import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

type StatCard = {
  label: string;
  value: string;
  hint?: string;
  accent: "teal" | "coral" | "amber";
};

async function getDashboardStats(): Promise<StatCard[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [activeSubs, attendanceToday, receiptsToday] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("customer_party_id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("subscription_sessions")
      .select("id", { count: "exact", head: true })
      .eq("actual_date", today)
      .eq("status", "attended"),
    supabase
      .from("daily_transactions")
      .select("amount, transaction_types!inner(name)")
      .eq("transaction_date", today)
      .ilike("transaction_types.name", "%استلام%"),
  ]);

  const receiptsSum =
    receiptsToday.data?.reduce(
      (sum, row) => sum + Number(row.amount ?? 0),
      0
    ) ?? 0;

  return [
    {
      label: "عملاء نشطون",
      value:
        activeSubs.error || activeSubs.count === null
          ? "—"
          : String(activeSubs.count),
      hint: "عدد الاشتراكات الفعّالة حاليًا",
      accent: "teal",
    },
    {
      label: "تحصيلات اليوم",
      value: receiptsToday.error ? "—" : `${receiptsSum.toLocaleString("ar-EG")} ج.م`,
      hint: "إجمالي الاستلام النقدي اليوم",
      accent: "coral",
    },
    {
      label: "حضور اليوم",
      value:
        attendanceToday.error || attendanceToday.count === null
          ? "—"
          : String(attendanceToday.count),
      hint: "عدد السيشنات المسجّل حضورها اليوم",
      accent: "amber",
    },
    {
      label: "رصيد الخزينة",
      value: "قيد الإعداد",
      hint: "سيُفعَّل مع محرك القيود المحاسبية",
      accent: "teal",
    },
  ];
}

const ACCENT_CLASSES: Record<StatCard["accent"], string> = {
  teal: "border-brand-teal-600/30 bg-brand-teal-700/5",
  coral: "border-brand-coral-500/30 bg-brand-coral-100/40",
  amber: "border-brand-amber-500/30 bg-brand-amber-100/40",
};

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <AppShell>
      <div className="max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-brand-teal-900">
            الرئيسية
          </h1>
          <p className="text-sm text-brand-teal-700 mt-1">مكتب أصول</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl border p-5 bg-surface shadow-sm ${ACCENT_CLASSES[stat.accent]}`}
            >
              <div className="text-sm font-medium text-brand-teal-800/80">
                {stat.label}
              </div>
              <div className="mt-2 text-3xl font-extrabold text-brand-teal-950">
                {stat.value}
              </div>
              {stat.hint && (
                <div className="mt-1 text-xs text-brand-teal-700/70">
                  {stat.hint}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-bold text-brand-teal-900">الخطوات القادمة</h2>
          <p className="text-sm text-brand-teal-700/80 mt-2 leading-relaxed">
            هذه النسخة الأولى من النظام. الشاشات التالية قيد الإنشاء تباعًا:
            الطلاب، البرامج والأنشطة، الاشتراكات، والحضور اليومي.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
