import AppShell from "@/components/AppShell";
import ProgramForm from "@/components/ProgramForm";
import { createClient } from "@/lib/supabase/server";
import { createProgram } from "../actions";

export default async function NewProgramPage() {
  const supabase = await createClient();

  const [activitiesRes, departmentsRes, costCentersRes, trainersRes] =
    await Promise.all([
      supabase
        .from("activities")
        .select("id, name, department_id")
        .order("name"),
      supabase.from("departments").select("id, name").order("name"),
      supabase.from("cost_centers").select("id, name").order("name"),
      supabase
        .from("party_roles")
        .select("party_id, parties(id, full_name)")
        .eq("role", "trainer"),
    ]);

  const trainers = (trainersRes.data ?? [])
    .filter((r) => r.parties)
    .map((r) => ({ id: r.parties!.id, name: r.parties!.full_name }));

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mb-6">
          إضافة برنامج جديد
        </h1>
        <ProgramForm
          action={createProgram}
          activities={activitiesRes.data ?? []}
          departments={departmentsRes.data ?? []}
          costCenters={costCentersRes.data ?? []}
          trainers={trainers}
          submitLabel="حفظ البرنامج"
        />
      </div>
    </AppShell>
  );
}
