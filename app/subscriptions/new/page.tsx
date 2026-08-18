import AppShell from "@/components/AppShell";
import SubscriptionForm from "@/components/SubscriptionForm";
import { createClient } from "@/lib/supabase/server";
import { createSubscription } from "../actions";

export default async function NewSubscriptionPage() {
  const supabase = await createClient();

  const [customersRes, departmentsRes, activitiesRes, programsRes] =
    await Promise.all([
      supabase
        .from("party_roles")
        .select("party_id, parties(id, full_name, phone_1)")
        .eq("role", "customer"),
      supabase.from("departments").select("id, name").order("name"),
      supabase
        .from("activities")
        .select("id, name, department_id")
        .order("name"),
      supabase
        .from("programs")
        .select("id, name, activity_id, price, session_count, duration_type")
        .eq("active", true)
        .order("name"),
    ]);

  const customers = (customersRes.data ?? [])
    .filter((r) => r.parties)
    .map((r) => ({
      id: r.parties!.id,
      name: r.parties!.full_name,
      phone: r.parties!.phone_1,
    }));

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mb-6">
          إنشاء اشتراك جديد
        </h1>
        <SubscriptionForm
          action={createSubscription}
          customers={customers}
          departments={departmentsRes.data ?? []}
          activities={activitiesRes.data ?? []}
          programs={programsRes.data ?? []}
          submitLabel="إنشاء الاشتراك"
        />
      </div>
    </AppShell>
  );
}
