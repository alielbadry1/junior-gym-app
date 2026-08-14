import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import StudentForm from "@/components/StudentForm";
import { createClient } from "@/lib/supabase/server";
import { updateStudent } from "../../actions";

export default async function EditStudentPage({
  params,
}: PageProps<"/students/[id]/edit">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: party } = await supabase
    .from("parties")
    .select("id, full_name, phone_1, phone_2, referral_source, notes")
    .eq("id", id)
    .single();

  if (!party) {
    notFound();
  }

  const updateWithId = updateStudent.bind(null, id);

  return (
    <AppShell>
      <div className="max-w-lg">
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mb-6">
          تعديل بيانات {party.full_name}
        </h1>
        <StudentForm
          action={updateWithId}
          defaultValues={party}
          submitLabel="حفظ التعديلات"
        />
      </div>
    </AppShell>
  );
}
