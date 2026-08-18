import Link from "next/link";
import AppShell from "@/components/AppShell";
import AttendanceMarkForm from "@/components/AttendanceMarkForm";
import { createClient } from "@/lib/supabase/server";
import { markSession } from "./actions";

export default async function AttendancePage({
  searchParams,
}: PageProps<"/attendance">) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : "";

  const supabase = await createClient();

  let subscription: {
    id: string;
    code: number;
    status: string | null;
    customer_party_id: string | null;
    price_per_session_after_discount: number | null;
    parties: { full_name: string } | null;
    programs: { id: string; name: string } | null;
  } | null = null;
  let pendingSessions: {
    id: string;
    session_number: number;
    expected_date: string | null;
    status: string | null;
  }[] = [];
  let notFoundMessage = "";
  let cashAccounts: { id: string; name: string }[] = [];

  if (code) {
    const codeNum = Number(code);
    if (!Number.isNaN(codeNum)) {
      const { data } = await supabase
        .from("subscriptions")
        .select(
          "id, code, status, customer_party_id, price_per_session_after_discount, parties(full_name), programs(id, name)"
        )
        .eq("code", codeNum)
        .maybeSingle();
      subscription = data;
    }

    if (!subscription) {
      notFoundMessage = `مفيش اشتراك بالكود #${code}`;
    } else {
      const { data: sessions } = await supabase
        .from("subscription_sessions")
        .select("id, session_number, expected_date, status")
        .eq("subscription_id", subscription.id)
        .eq("status", "pending")
        .order("session_number")
        .limit(5);
      pendingSessions = sessions ?? [];

      const { data: cash } = await supabase
        .from("cash_accounts")
        .select("id, name")
        .order("name");
      cashAccounts = cash ?? [];
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mb-1">
          تسجيل الحضور والدفع اليومي
        </h1>
        <p className="text-sm text-brand-teal-700 mb-6">
          دوّر بكود الاشتراك وسجّل الحضور/الغياب مع التحصيل النقدي لو حصل
        </p>

        <form className="mb-8 flex gap-2">
          <input
            type="text"
            name="code"
            defaultValue={code}
            placeholder="اكتب كود الاشتراك (مثال: 1887)"
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
          />
          <button
            type="submit"
            className="inline-flex items-center rounded-xl bg-brand-teal-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-teal-800 transition-colors"
          >
            بحث
          </button>
        </form>

        {notFoundMessage && (
          <div className="rounded-xl border border-brand-coral-500/30 bg-brand-coral-100/40 p-4 text-sm text-brand-coral-600">
            {notFoundMessage}
          </div>
        )}

        {subscription && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-extrabold text-brand-teal-950">
                    كود #{subscription.code} — {subscription.parties?.full_name}
                  </div>
                  <div className="text-sm text-brand-teal-700/80 mt-0.5">
                    {subscription.programs?.name}
                  </div>
                </div>
                <Link
                  href={`/subscriptions/${subscription.id}`}
                  className="text-sm text-brand-teal-700 hover:text-brand-teal-900 font-medium"
                >
                  عرض متتبع السيشنات الكامل
                </Link>
              </div>
            </div>

            {pendingSessions.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface p-6 text-center text-brand-teal-700/60 text-sm">
                مفيش سيشنات معلّقة على الكود ده
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-surface p-5">
                <AttendanceMarkForm
                  action={markSession}
                  code={code}
                  sessionId={pendingSessions[0].id}
                  sessionNumber={pendingSessions[0].session_number}
                  subscriptionId={subscription.id}
                  customerPartyId={subscription.customer_party_id}
                  programId={subscription.programs?.id ?? null}
                  defaultAmount={
                    Number(subscription.price_per_session_after_discount) || 0
                  }
                  cashAccounts={cashAccounts}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
