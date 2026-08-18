import Link from "next/link";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

export default async function TrainersPage() {
  const supabase = await createClient();

  const { data: roles, error } = await supabase
    .from("party_roles")
    .select("id, status, parties(id, full_name, phone_1, phone_2)")
    .eq("role", "trainer")
    .order("started_at", { ascending: false });

  return (
    <AppShell>
      <div className="max-w-4xl">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-teal-900">
              المدربون
            </h1>
            <p className="text-sm text-brand-teal-700 mt-1">
              الأشخاص اللي بيشتغلوا كمدربين بنظام النسبة
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/trainers/export"
              className="inline-flex items-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-brand-teal-800 hover:bg-surface-muted transition-colors"
            >
              تصدير إكسيل
            </a>
            <Link
              href="/trainers/import"
              className="inline-flex items-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-brand-teal-800 hover:bg-surface-muted transition-colors"
            >
              استيراد إكسيل
            </Link>
            <Link
              href="/trainers/new"
              className="inline-flex items-center rounded-xl bg-brand-coral-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-coral-600 transition-colors"
            >
              + إضافة مدرب
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-brand-coral-500/30 bg-brand-coral-100/40 p-4 text-sm text-brand-coral-600">
            تعذّر تحميل البيانات: {error.message}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm text-right">
            <thead className="bg-surface-muted text-brand-teal-900">
              <tr>
                <th className="px-4 py-3 font-bold">الاسم</th>
                <th className="px-4 py-3 font-bold">الهاتف</th>
                <th className="px-4 py-3 font-bold">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {roles && roles.length > 0 ? (
                roles.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-brand-teal-950">
                      {r.parties?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-brand-teal-800/80">
                      {r.parties?.phone_1 || "—"}
                    </td>
                    <td className="px-4 py-3 text-brand-teal-800/80">
                      {r.status === "active" ? "نشط" : r.status || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-10 text-center text-brand-teal-700/60"
                  >
                    لا يوجد مدربون مسجّلون بعد
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
