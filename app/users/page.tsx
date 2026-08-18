import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { updateUserAccess } from "./actions";

const ROLE_OPTIONS = [
  { value: "owner", label: "مالك" },
  { value: "accounts_manager", label: "مدير حسابات" },
  { value: "office_accountant", label: "محاسب مكتب" },
  { value: "secretary", label: "سكرتارية" },
];

export default async function UsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AppShell>
        <div className="rounded-xl border border-brand-coral-500/30 bg-brand-coral-100/40 p-4 text-sm text-brand-coral-600 max-w-lg">
          لازم تسجّل دخول عشان تشوف الشاشة دي.
        </div>
      </AppShell>
    );
  }

  const { data: currentAppUser } = await supabase
    .from("app_users")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (!currentAppUser || currentAppUser.role !== "owner" || !currentAppUser.active) {
    return (
      <AppShell>
        <div className="rounded-xl border border-brand-coral-500/30 bg-brand-coral-100/40 p-4 text-sm text-brand-coral-600 max-w-lg">
          شاشة المستخدمين متاحة للـ Owner بس.
        </div>
      </AppShell>
    );
  }

  const { data: users } = await supabase
    .from("app_users")
    .select("id, full_name, role, active, created_at")
    .order("created_at", { ascending: false });

  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mb-1">
          المستخدمون والصلاحيات
        </h1>
        <p className="text-sm text-brand-teal-700 mb-6">
          اعتماد الحسابات الجديدة وتحديد مستوى صلاحية كل واحد. تفعيل صلاحيات
          كل شاشة بالتفصيل (تعديل/حذف) لسه مرحلة جاية.
        </p>

        <div className="space-y-3">
          {(users ?? []).map((u) => (
            <form
              key={u.id}
              action={updateUserAccess}
              className="rounded-2xl border border-border bg-surface p-4 flex flex-wrap items-center gap-3"
            >
              <input type="hidden" name="user_id" value={u.id} />
              <div className="flex-1 min-w-[160px]">
                <div className="font-bold text-brand-teal-950">
                  {u.full_name}
                </div>
                <div className="text-xs text-brand-teal-700/60">
                  {u.active ? "مفعّل" : "معلّق — محتاج اعتماد"}
                </div>
              </div>
              <select
                name="role"
                defaultValue={u.role}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-teal-600"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-sm font-medium text-brand-teal-900">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={u.active}
                  className="h-4 w-4 rounded border-border"
                />
                مفعّل
              </label>
              <button
                type="submit"
                className="inline-flex items-center rounded-xl bg-brand-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-teal-800 transition-colors"
              >
                حفظ
              </button>
            </form>
          ))}
          {(!users || users.length === 0) && (
            <p className="text-sm text-brand-teal-700/60">
              مفيش مستخدمين مسجّلين بعد
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
