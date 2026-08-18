import Link from "next/link";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

type ProgramRow = {
  id: string;
  name: string;
  session_count: number | null;
  duration_type: string | null;
  price: number;
  price_per_session: number | null;
  active: boolean | null;
  activities: { name: string; departments: { name: string } | null } | null;
  program_trainer_assignments: {
    commission_percent: number;
    ends_at: string | null;
    parties: { full_name: string } | null;
  }[];
};

export default async function ProgramsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("programs")
    .select(
      "id, name, session_count, duration_type, price, price_per_session, active, activities(name, departments(name)), program_trainer_assignments(commission_percent, ends_at, parties(full_name))"
    )
    .order("created_at", { ascending: false });

  const programs = (data ?? []) as unknown as ProgramRow[];

  const grouped = new Map<string, ProgramRow[]>();
  for (const p of programs) {
    const deptName = p.activities?.departments?.name ?? "بدون قسم";
    if (!grouped.has(deptName)) grouped.set(deptName, []);
    grouped.get(deptName)!.push(p);
  }

  return (
    <AppShell>
      <div className="max-w-5xl">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-teal-900">
              الأنشطة والبرامج
            </h1>
            <p className="text-sm text-brand-teal-700 mt-1">
              شجرة الأقسام والأنشطة والبرامج، مع تكليف المدربين ونسبهم
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/programs/setup"
              className="inline-flex items-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-brand-teal-800 hover:bg-surface-muted transition-colors"
            >
              الإعدادات (الأقسام والأنشطة)
            </Link>
            <a
              href="/programs/export"
              className="inline-flex items-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-brand-teal-800 hover:bg-surface-muted transition-colors"
            >
              تصدير إكسيل
            </a>
            <Link
              href="/programs/import"
              className="inline-flex items-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-brand-teal-800 hover:bg-surface-muted transition-colors"
            >
              استيراد إكسيل
            </Link>
            <Link
              href="/programs/new"
              className="inline-flex items-center rounded-xl bg-brand-coral-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-coral-600 transition-colors"
            >
              + إضافة برنامج
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-brand-coral-500/30 bg-brand-coral-100/40 p-4 text-sm text-brand-coral-600">
            تعذّر تحميل البيانات: {error.message}
          </div>
        )}

        {programs.length === 0 && !error && (
          <div className="rounded-2xl border border-border bg-surface p-10 text-center text-brand-teal-700/60">
            لا يوجد برامج مسجّلة بعد.{" "}
            <Link href="/programs/new" className="underline">
              أضف أول برنامج
            </Link>
          </div>
        )}

        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([deptName, deptPrograms]) => (
            <div key={deptName}>
              <h2 className="text-lg font-extrabold text-brand-teal-900 mb-3">
                {deptName}
              </h2>
              <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                <table className="w-full text-sm text-right">
                  <thead className="bg-surface-muted text-brand-teal-900">
                    <tr>
                      <th className="px-4 py-3 font-bold">البرنامج</th>
                      <th className="px-4 py-3 font-bold">النشاط</th>
                      <th className="px-4 py-3 font-bold">السيشنات</th>
                      <th className="px-4 py-3 font-bold">القيمة</th>
                      <th className="px-4 py-3 font-bold">المدربون</th>
                      <th className="px-4 py-3 font-bold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptPrograms.map((p) => {
                      const activeAssignments = p.program_trainer_assignments.filter(
                        (a) => a.ends_at === null
                      );
                      const trainerShare = activeAssignments.reduce(
                        (sum, a) => sum + Number(a.commission_percent),
                        0
                      );
                      return (
                        <tr key={p.id} className="border-t border-border">
                          <td className="px-4 py-3 font-medium text-brand-teal-950">
                            {p.name}
                            {p.active === false && (
                              <span className="ms-2 inline-block rounded-full bg-brand-coral-100 px-2 py-0.5 text-xs font-medium text-brand-coral-600">
                                متوقف
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-brand-teal-800/80">
                            {p.activities?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-brand-teal-800/80">
                            {p.session_count ?? p.duration_type ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-brand-teal-800/80">
                            {Number(p.price).toLocaleString("ar-EG")} ج.م
                            {p.price_per_session && (
                              <span className="text-xs text-brand-teal-700/60">
                                {" "}
                                ({Number(p.price_per_session).toLocaleString(
                                  "ar-EG"
                                )}
                                /سيشن)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {activeAssignments.map((a, i) => (
                                <span
                                  key={i}
                                  className="inline-block rounded-full bg-brand-teal-700/10 px-2.5 py-0.5 text-xs font-medium text-brand-teal-800"
                                >
                                  {a.parties?.full_name ?? "—"} (
                                  {a.commission_percent}%)
                                </span>
                              ))}
                              {activeAssignments.length > 0 && (
                                <span className="inline-block rounded-full bg-brand-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                                  الجيم ({Math.max(0, 100 - trainerShare)}%)
                                </span>
                              )}
                              {activeAssignments.length === 0 && (
                                <span className="text-xs text-brand-teal-700/50">
                                  بدون تكليف مدرب
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-left">
                            <Link
                              href={`/programs/${p.id}/edit`}
                              className="text-brand-teal-700 hover:text-brand-teal-900 font-medium"
                            >
                              تعديل
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
