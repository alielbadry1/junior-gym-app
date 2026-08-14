import Link from "next/link";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

const ROLE_LABELS: Record<string, string> = {
  customer: "عميل",
  trainer: "مدرب",
  employee: "موظف",
  owner: "مالك",
  accounts_manager: "مدير حسابات",
  office_accountant: "محاسب مكتب",
  secretary: "سكرتارية",
};

function roleLabel(role: string) {
  return ROLE_LABELS[role] ?? role;
}

export default async function StudentsPage({
  searchParams,
}: PageProps<"/students">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  const supabase = await createClient();

  let query = supabase
    .from("parties")
    .select("id, full_name, phone_1, phone_2, created_at, party_roles(role, status)")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,phone_1.ilike.%${q}%,phone_2.ilike.%${q}%`);
  }

  const { data: parties, error } = await query;

  return (
    <AppShell>
      <div className="max-w-4xl">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-teal-900">
              الطلاب
            </h1>
            <p className="text-sm text-brand-teal-700 mt-1">
              إدارة بيانات الطلاب وأولياء الأمور والأدوار المرتبطة بهم
            </p>
          </div>
          <Link
            href="/students/new"
            className="inline-flex items-center rounded-xl bg-brand-coral-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-coral-600 transition-colors"
          >
            + إضافة طالب
          </Link>
        </div>

        <form className="mb-5">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="ابحث بالاسم أو رقم الهاتف..."
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
                <th className="px-4 py-3 font-bold">الاسم</th>
                <th className="px-4 py-3 font-bold">الهاتف</th>
                <th className="px-4 py-3 font-bold">الأدوار</th>
                <th className="px-4 py-3 font-bold"></th>
              </tr>
            </thead>
            <tbody>
              {parties && parties.length > 0 ? (
                parties.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-brand-teal-950">
                      {p.full_name}
                    </td>
                    <td className="px-4 py-3 text-brand-teal-800/80">
                      {p.phone_1 || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {(p.party_roles ?? []).map((r, i) => (
                          <span
                            key={i}
                            className="inline-block rounded-full bg-brand-teal-700/10 px-2.5 py-0.5 text-xs font-medium text-brand-teal-800"
                          >
                            {roleLabel(r.role)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <Link
                        href={`/students/${p.id}/edit`}
                        className="text-brand-teal-700 hover:text-brand-teal-900 font-medium"
                      >
                        تعديل
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-brand-teal-700/60"
                  >
                    لا يوجد طلاب مسجّلون بعد
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
