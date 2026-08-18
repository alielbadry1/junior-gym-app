import Link from "next/link";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { seedCostCenters, createDepartment, createActivity } from "./actions";

export default async function ProgramsSetupPage() {
  const supabase = await createClient();

  const [costCentersRes, departmentsRes, activitiesRes] = await Promise.all([
    supabase.from("cost_centers").select("id, name").order("name"),
    supabase.from("departments").select("id, name").order("name"),
    supabase
      .from("activities")
      .select("id, name, department_id")
      .order("name"),
  ]);

  const costCenters = costCentersRes.data ?? [];
  const departments = departmentsRes.data ?? [];
  const activities = activitiesRes.data ?? [];

  return (
    <AppShell>
      <div className="max-w-3xl space-y-8">
        <div>
          <Link
            href="/programs"
            className="text-sm text-brand-teal-700 hover:text-brand-teal-900 font-medium"
          >
            ← رجوع للبرامج
          </Link>
          <h1 className="text-2xl font-extrabold text-brand-teal-900 mt-2">
            إعدادات البرامج والأنشطة
          </h1>
          <p className="text-sm text-brand-teal-700 mt-1">
            مراكز التكلفة والأقسام والأنشطة اللي هتتبنى عليها البرامج
          </p>
        </div>

        {/* مراكز التكلفة */}
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-bold text-brand-teal-900 mb-1">
            مراكز التكلفة
          </h2>
          <p className="text-xs text-brand-teal-700/70 mb-4">
            الجيم ولاند — ثابتان حسب تصميم النظام
          </p>
          {costCenters.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {costCenters.map((c) => (
                <span
                  key={c.id}
                  className="inline-block rounded-full bg-brand-teal-700/10 px-3 py-1 text-sm font-medium text-brand-teal-800"
                >
                  {c.name}
                </span>
              ))}
            </div>
          ) : (
            <form action={seedCostCenters}>
              <button
                type="submit"
                className="inline-flex items-center rounded-xl bg-brand-coral-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-coral-600 transition-colors"
              >
                تهيئة مراكز التكلفة (الجيم / لاند)
              </button>
            </form>
          )}
        </section>

        {/* الأقسام الرئيسية */}
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-bold text-brand-teal-900 mb-4">
            الأقسام الرئيسية
          </h2>
          {departments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {departments.map((d) => (
                <span
                  key={d.id}
                  className="inline-block rounded-full bg-brand-teal-700/10 px-3 py-1 text-sm font-medium text-brand-teal-800"
                >
                  {d.name}
                </span>
              ))}
            </div>
          )}
          <form action={createDepartment} className="flex gap-2">
            <input
              type="text"
              name="name"
              required
              placeholder="اسم القسم الجديد (مثال: الرياضات التخصصية)"
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
            />
            <button
              type="submit"
              className="inline-flex items-center rounded-xl bg-brand-teal-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-teal-800 transition-colors"
            >
              إضافة
            </button>
          </form>
        </section>

        {/* الأنشطة */}
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-bold text-brand-teal-900 mb-4">الأنشطة</h2>
          {activities.length > 0 && (
            <div className="space-y-2 mb-4">
              {departments.map((d) => {
                const deptActivities = activities.filter(
                  (a) => a.department_id === d.id
                );
                if (deptActivities.length === 0) return null;
                return (
                  <div key={d.id} className="text-sm">
                    <span className="font-bold text-brand-teal-900">
                      {d.name}:{" "}
                    </span>
                    <span className="text-brand-teal-800/80">
                      {deptActivities.map((a) => a.name).join("، ")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {departments.length === 0 ? (
            <p className="text-sm text-brand-teal-700/70">
              لازم تضيف قسم رئيسي واحد على الأقل الأول
            </p>
          ) : (
            <form action={createActivity} className="flex flex-wrap gap-2">
              <select
                name="department_id"
                required
                className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
              >
                <option value="">اختر القسم</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="name"
                required
                placeholder="اسم النشاط الجديد (مثال: العلاج الوظيفي)"
                className="flex-1 min-w-[200px] rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
              />
              <button
                type="submit"
                className="inline-flex items-center rounded-xl bg-brand-teal-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-teal-800 transition-colors"
              >
                إضافة
              </button>
            </form>
          )}
        </section>
      </div>
    </AppShell>
  );
}
