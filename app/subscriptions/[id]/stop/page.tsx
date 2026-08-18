import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import StopSubscriptionForm from "@/components/StopSubscriptionForm";
import { createClient } from "@/lib/supabase/server";
import { stopAndRefundSubscription, recordSettlementEntry } from "../../actions";

export default async function StopSubscriptionPage({
  params,
}: PageProps<"/subscriptions/[id]/stop">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(
      "id, code, session_count, price, price_per_session_after_discount, status, customer_party_id, parties(full_name), programs(name)"
    )
    .eq("id", id)
    .single();

  if (!subscription) {
    notFound();
  }

  const { count: pendingCount } = await supabase
    .from("subscription_sessions")
    .select("id", { count: "exact", head: true })
    .eq("subscription_id", id)
    .eq("status", "pending");

  const pending = pendingCount ?? 0;
  const grossPerSession = subscription.price / subscription.session_count;
  const netPerSession =
    subscription.price_per_session_after_discount ?? grossPerSession;
  const grossUnconsumed = Number((pending * grossPerSession).toFixed(2));
  const netUnconsumed = Number((pending * netPerSession).toFixed(2));
  const settlementGap = Number((grossUnconsumed - netUnconsumed).toFixed(2));

  const [cashAccountsRes, subAccountsRes] = await Promise.all([
    supabase.from("cash_accounts").select("id, name").order("name"),
    supabase.from("sub_accounts").select("id, name").order("name"),
  ]);

  return (
    <AppShell>
      <div className="max-w-2xl">
        <Link
          href={`/subscriptions/${id}`}
          className="text-sm text-brand-teal-700 hover:text-brand-teal-900 font-medium"
        >
          ← رجوع لتفاصيل الاشتراك
        </Link>

        <h1 className="text-2xl font-extrabold text-brand-teal-900 mt-2 mb-1">
          إيقاف / استرداد اشتراك #{subscription.code}
        </h1>
        <p className="text-sm text-brand-teal-700 mb-6">
          {subscription.parties?.full_name} — {subscription.programs?.name}
        </p>

        {subscription.status !== "active" ? (
          <div className="rounded-xl border border-brand-coral-500/30 bg-brand-coral-100/40 p-4 text-sm text-brand-coral-600">
            الاشتراك ده مش نشط حاليًا (الحالة: {subscription.status})
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="text-xs font-bold text-brand-teal-700/70">
                  سيشنات غير مستهلكة
                </div>
                <div className="mt-1 text-lg font-extrabold text-brand-teal-950">
                  {pending}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="text-xs font-bold text-brand-teal-700/70">
                  القيمة الإجمالية (قبل الخصم)
                </div>
                <div className="mt-1 text-lg font-extrabold text-brand-teal-950">
                  {grossUnconsumed.toLocaleString("ar-EG")} ج.م
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="text-xs font-bold text-brand-teal-700/70">
                  القيمة الصافية (بعد الخصم)
                </div>
                <div className="mt-1 text-lg font-extrabold text-brand-teal-950">
                  {netUnconsumed.toLocaleString("ar-EG")} ج.م
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="font-bold text-brand-teal-900 mb-3">
                تنفيذ الإيقاف
              </h2>
              <StopSubscriptionForm
                action={stopAndRefundSubscription}
                subscriptionId={id}
                netUnconsumedValue={netUnconsumed}
                cashAccounts={cashAccountsRes.data ?? []}
              />
            </div>

            {settlementGap > 0.01 && (
              <div className="rounded-2xl border border-brand-amber-500/40 bg-brand-amber-100/40 p-5">
                <h2 className="font-bold text-amber-900 mb-2">
                  فيه فرق تسوية قدره {settlementGap.toLocaleString("ar-EG")} ج.م
                </h2>
                <p className="text-xs text-amber-900/80 mb-4 leading-relaxed">
                  ده ناتج عن توزيع خصم سابق على الاشتراك — إيقاف الاشتراك
                  بالقيمة الصافية + قيد تسوية حساب بالفرق ده = يساوي القيمة
                  الإجمالية للسيشنات غير المستهلكة (البند 4.1 في البريف).
                  آلية ترحيل الفرق ده تلقائيًا لحسابات محددة **لسه بند مؤجل
                  محتاج قرار من صاحب المشروع** (قسم 9) — استخدم الفورم ده
                  لتسجيله يدويًا لحد ما تتحدد الآلية بدقة.
                </p>
                <form action={recordSettlementEntry} className="space-y-3">
                  <input type="hidden" name="subscription_id" value={id} />
                  <input
                    type="hidden"
                    name="customer_party_id"
                    value={subscription.customer_party_id ?? ""}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1">
                        الحساب المدين
                      </label>
                      <select
                        name="debit_sub_account_id"
                        required
                        className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none"
                      >
                        <option value="">اختر</option>
                        {(subAccountsRes.data ?? []).map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1">
                        الحساب الدائن
                      </label>
                      <select
                        name="credit_sub_account_id"
                        required
                        className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none"
                      >
                        <option value="">اختر</option>
                        {(subAccountsRes.data ?? []).map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">
                      القيمة (ج.م)
                    </label>
                    <input
                      type="number"
                      name="amount"
                      min={0}
                      step="0.01"
                      defaultValue={settlementGap}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-amber-700 transition-colors"
                  >
                    تسجيل قيد التسوية
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
