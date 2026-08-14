import AppShell from "@/components/AppShell";
import StudentForm from "@/components/StudentForm";
import { createStudent } from "../actions";

export default function NewStudentPage() {
  return (
    <AppShell>
      <div className="max-w-lg">
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mb-6">
          إضافة طالب جديد
        </h1>
        <StudentForm action={createStudent} submitLabel="حفظ الطالب" />
      </div>
    </AppShell>
  );
}
