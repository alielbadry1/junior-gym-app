import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProgramForm from "@/components/ProgramForm";
import { createClient } from "@/lib/supabase/server";
import { updateProgram } from "../../actions";

export default async function EditProgramPage({
  params,
}: PageProps<"/programs/[id]/edit">) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    programRes,
    activitiesRes,
    departmentsRes,
    costCentersRes,
    trainersRes,
    assignmentsRes,
  ] = await Promise.all([
    supabase
      .from("programs")
      .select(
        "id, activity_id, cost_center_id, name, session_count, duration_type, session_days, session_time, location, price, active"
      )
      .eq("id", id)
      .single(),
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
    supabase
      .from("program_trainer_assignments")
      .select("trainer_party_id, commission_percent")
      .eq("program_id", id)
      .is("ends_at", null),
  ]);

  if (!programRes.data) {
    notFound();
  }

  const program = programRes.data;
  const trainers = (trainersRes.data ?? [])
    .filter((r) => r.parties)
    .map((r) => ({ id: r.parties!.id, name: r.parties!.full_name }));

  const updateWithId = updateProgram.bind(null, id);

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mb-6">
          تعديل برنامج: {program.name}
        </h1>
        <ProgramForm
          action={updateWithId}
          activities={activitiesRes.data ?? []}
          departments={departmentsRes.data ?? []}
          costCenters={costCentersRes.data ?? []}
          trainers={trainers}
          submitLabel="حفظ التعديلات"
          defaultValues={{
            activity_id: program.activity_id,
            cost_center_id: program.cost_center_id,
            duration_type: program.duration_type,
            session_count: program.session_count,
            session_days: program.session_days,
            session_time: program.session_time
              ? program.session_time.slice(0, 5)
              : null,
            location: program.location,
            price: program.price,
            active: program.active,
            assignments: (assignmentsRes.data ?? []).map((a) => ({
              trainer_party_id: a.trainer_party_id as string,
              commission_percent: Number(a.commission_percent),
            })),
          }}
        />
      </div>
    </AppShell>
  );
}
