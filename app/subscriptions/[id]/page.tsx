import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

const STATUS_STYLES: Record<string, string> = {
  attended: "bg-brand-teal-600 text-white border-brand-teal-600",
  absent: "bg-brand-coral-500 text-white border-brand-coral-500",
  excused: "bg-brand-amber-400 text-white border-brand-amber-400",
  pending: "bg-surface text-brand-teal-800/60 border-border",
};

const STATUS_LABELS: Record<string, string> = {
  attended: "حضر",
  absent: "غاب",
  excused: "غياب غير محتسب",
  pending: "لسه",
};

type TrainerSnapshot = {
  trainer_party_id: string;
  trainer_name: string | null;
  commission_percent: number;
};

export default async function SubscriptionDetailPage({
  params,
}: PageProps<"/subscriptions/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(
      "id, code, session_count, price, discount_amount, discount_type, price_per_session_after_discount, trainer_assignment_snapshot, started_at, ends_at, status, parties(full_name, phone_1), programs(name)"
    )
    .eq("id", id)
    .single();

  if (!subscription) {
    notFound();
  }

  const { data: sessions } = await supabase
    .from("subscription_sessions")
    .select("id, session_number, expected_date, actual_date, status")
    .eq("subscription_id", id)
    .order("session_number");

  const trainerSnapshot = (subscription.trainer_assignment_snapshot ??
    []) as unknown as TrainerSnapshot[];

  return (
    <AppShell>
      <div className="max-w-3xl">
        <Link
          href="/subscriptions"
          className="text-sm text-brand-teal-700 hover:text-brand-teal-900 font-medium"
        >
          ← رجوع للاشتراكات
        </Link>

        <div className="mt-2 mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-teal-900">
              كود اشتراك #{subscription.code}
            </h1>
            <p className="text-sm text-brand-teal-700 mt-1">
              {subscription.parties?.full_name} — {subscription.programs?.name}
            </p>
          </div>
          {subscription.status === "active" && (
            <Link
              href={`/subscriptions/${subscription.id}/stop`}
              className="inline-flex items-center rounded-xl border border-brand-coral-500/40 px-4 py-2 text-sm font-bold text-brand-coral-600 hover:bg-brand-coral-100/40 transition-colors"
            >
              إيقاف / استرداد الاشتراك
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs font-bold text-brand-teal-700/70">
              قيمة الاشتراك
            </div>
            <div className="mt-1 text-lg font-extrabold text-brand-teal-950">
              {Number(subscription.price).toLocaleString("ar-EG")} ج.م
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs font-bold text-brand-teal-700/70">
              الخصم
            </div>
            <div className="mt-1 text-lg font-extrabold text-brand-teal-950">
              {Number(subscription.discount_amount ?? 0).toLocaleString(
                "ar-EG"
              )}{" "}
              ج.م
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs font-bold text-brand-teal-700/70">
              قيمة السيشن
            </div>
            <div className="mt-1 text-lg font-extrabold text-brand-teal-950">
              {subscription.price_per_session_after_discount
                ? `${Number(
                    subscription.price_per_session_after_discount
                  ).toLocaleString("ar-EG")} ج.م`
                : "—"}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs font-bold text-brand-teal-700/70">
              الحالة
            </div>
            <div className="mt-1 text-lg font-extrabold text-brand-teal-950">
              {subscription.status === "active" ? "نشط" : subscription.status}
            </div>
          </div>
        </div>

        {trainerSnapshot.length > 0 && (
          <div className="mb-8">
            <h2 className="font-bold text-brand-teal-900 mb-2">
              المدربون المكلّفون (وقت إنشاء الاشتراك)
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {trainerSnapshot.map((t, i) => (
                <span
                  key={i}
                  className="inline-block rounded-full bg-brand-teal-700/10 px-2.5 py-0.5 text-xs font-medium text-brand-teal-800"
                >
                  {t.trainer_name ?? "—"} ({t.commission_percent}%)
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="font-bold text-brand-teal-900 mb-3">
            متتبع السيشنات ({subscription.started_at} —{" "}
            {subscription.ends_at ?? "—"})
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {(sessions ?? []).map((s) => (
              <div
                key={s.id}
                className={`rounded-xl border p-2 text-center ${
                  STATUS_STYLES[s.status ?? "pending"] ?? STATUS_STYLES.pending
                }`}
              >
                <div className="text-xs font-bold">#{s.session_number}</div>
                <div className="text-[10px] mt-0.5 opacity-90">
                  {s.actual_date ?? s.expected_date ?? "—"}
                </div>
                <div className="text-[10px] mt-0.5 opacity-90">
                  {STATUS_LABELS[s.status ?? "pending"]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
