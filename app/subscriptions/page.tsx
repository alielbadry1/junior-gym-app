import Link from "next/link";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  stopped: "متوقف",
  cancelled: "ملغي",
};

export default async function SubscriptionsPage({
  searchParams,
}: PageProps<"/subscriptions">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  const supabase = await createClient();

  const query = supabase
    .from("subscriptions")
    .select(
      "id, code, session_count, price, status, started_at, parties(full_name), programs(name), subscription_sessions(status)"
    )
    .order("created_at", { ascending: false });

  const { data, error } = await query;

  let subscriptions = data ?? [];
  if (q) {
    const qLower = q.trim();
    subscriptions = subscriptions.filter(
      (s) =>
        s.parties?.full_name?.includes(qLower) ||
        String(s.code).includes(qLower)
    );
  }

  return (
    <AppShell>
      <div className="max-w-5xl">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-teal-900">
              الاشتراكات
            </h1>
            <p className="text-sm text-brand-teal-700 mt-1">
              متابعة أكواد الاشتراك ومتتبع السيشنات
            </p>
          </div>
          <div className="flex gap-2">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download endpoint, not a page navigation */}
            <a
              href="/subscriptions/export"
              className="inline-flex items-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-brand-teal-800 hover:bg-surface-muted transition-colors"
            >
              تصدير إكسيل
            </a>
            <Link
              href="/subscriptions/import"
              className="inline-flex items-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-brand-teal-800 hover:bg-surface-muted transition-colors"
            >
              استيراد إكسيل
            </Link>
            <Link
              href="/subscriptions/new"
              className="inline-flex items-center rounded-xl bg-brand-coral-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-coral-600 transition-colors"
            >
              + إنشاء اشتراك
            </Link>
          </div>
        </div>

        <form className="mb-5">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="ابحث بالكود أو اسم الطالب..."
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
          />
        </form>

        {error && (
          <div className="rounded-xl border border-brand-coral-500/30 bg-brand-coral-100/40 p-4 text-sm text-brand-coral-600">
            تعذّر تحميل البيانات: {error.message}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm text-right">
            <thead className="bg-surface-muted text-brand-teal-900">
              <tr>
                <th className="px-4 py-3 font-bold">الكود</th>
                <th className="px-4 py-3 font-bold">الطالب</th>
                <th className="px-4 py-3 font-bold">البرنامج</th>
                <th className="px-4 py-3 font-bold">السيشنات</th>
                <th className="px-4 py-3 font-bold">القيمة</th>
                <th className="px-4 py-3 font-bold">الحالة</th>
                <th className="px-4 py-3 font-bold"></th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length > 0 ? (
                subscriptions.map((s) => {
                  const attended = s.subscription_sessions.filter(
                    (ss) => ss.status === "attended"
                  ).length;
                  return (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-4 py-3 font-bold text-brand-teal-950">
                        #{s.code}
                      </td>
                      <td className="px-4 py-3 text-brand-teal-800/80">
                        {s.parties?.full_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-brand-teal-800/80">
                        {s.programs?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-brand-teal-800/80">
                        {attended}/{s.session_count}
                      </td>
                      <td className="px-4 py-3 text-brand-teal-800/80">
                        {Number(s.price).toLocaleString("ar-EG")} ج.م
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-brand-teal-700/10 px-2.5 py-0.5 text-xs font-medium text-brand-teal-800">
                          {STATUS_LABELS[s.status ?? ""] ?? s.status ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-left">
                        <Link
                          href={`/subscriptions/${s.id}`}
                          className="text-brand-teal-700 hover:text-brand-teal-900 font-medium"
                        >
                          التفاصيل
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-brand-teal-700/60"
                  >
                    لا يوجد اشتراكات مسجّلة بعد
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
