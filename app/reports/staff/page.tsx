import Link from "next/link";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

const ROLE_LABELS: Record<string, string> = {
  trainer: "مدرب",
  employee: "موظف",
};

export default async function StaffStatementsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("party_roles")
    .select("role, parties(id, full_name, phone_1)")
    .in("role", ["trainer", "employee"]);

  const byParty = new Map<
    string,
    { id: string; full_name: string; phone_1: string | null; roles: string[] }
  >();
  for (const r of data ?? []) {
    if (!r.parties) continue;
    const existing = byParty.get(r.parties.id);
    if (existing) {
      existing.roles.push(r.role);
    } else {
      byParty.set(r.parties.id, {
        id: r.parties.id,
        full_name: r.parties.full_name,
        phone_1: r.parties.phone_1,
        roles: [r.role],
      });
    }
  }

  const staff = Array.from(byParty.values());

  return (
    <AppShell>
      <div className="max-w-3xl">
        <Link
          href="/reports"
          className="text-sm text-brand-teal-700 hover:text-brand-teal-900 font-medium"
        >
          ← رجوع للتقارير
        </Link>
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mt-2 mb-6">
          كشف حساب المدربين والموظفين
        </h1>

        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          {staff.length > 0 ? (
            staff.map((s) => (
              <Link
                key={s.id}
                href={`/reports/staff/${s.id}`}
                className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0 hover:bg-surface-muted transition-colors"
              >
                <div>
                  <span className="font-medium text-brand-teal-950">
                    {s.full_name}
                  </span>
                  <div className="flex gap-1.5 mt-1">
                    {s.roles.map((r) => (
                      <span
                        key={r}
                        className="inline-block rounded-full bg-brand-teal-700/10 px-2 py-0.5 text-[11px] font-medium text-brand-teal-800"
                      >
                        {ROLE_LABELS[r] ?? r}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-brand-teal-700/60">
                  {s.phone_1 ?? ""}
                </span>
              </Link>
            ))
          ) : (
            <div className="px-4 py-10 text-center text-brand-teal-700/60">
              لا يوجد مدربون أو موظفون
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
