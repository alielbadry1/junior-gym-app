import Link from "next/link";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

export default async function CustomerStatementsPage({
  searchParams,
}: PageProps<"/reports/customers">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  const supabase = await createClient();
  let query = supabase
    .from("party_roles")
    .select("parties(id, full_name, phone_1)")
    .eq("role", "customer");

  if (q) {
    query = query.ilike("parties.full_name", `%${q}%`);
  }

  const { data } = await query;
  const customers = (data ?? [])
    .filter((r) => r.parties)
    .map((r) => r.parties!);

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
          كشف حساب العملاء
        </h1>

        <form className="mb-5">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="ابحث بالاسم..."
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
          />
        </form>

        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          {customers.length > 0 ? (
            customers.map((c) => (
              <Link
                key={c.id}
                href={`/reports/customers/${c.id}`}
                className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0 hover:bg-surface-muted transition-colors"
              >
                <span className="font-medium text-brand-teal-950">
                  {c.full_name}
                </span>
                <span className="text-xs text-brand-teal-700/60">
                  {c.phone_1 ?? ""}
                </span>
              </Link>
            ))
          ) : (
            <div className="px-4 py-10 text-center text-brand-teal-700/60">
              لا يوجد عملاء
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
