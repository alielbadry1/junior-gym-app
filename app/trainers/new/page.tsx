import AppShell from "@/components/AppShell";
import TrainerForm from "@/components/TrainerForm";
import { createTrainer } from "../actions";

export default async function NewTrainerPage({
  searchParams,
}: PageProps<"/trainers/new">) {
  const params = await searchParams;
  const redirectTo =
    typeof params.redirect_to === "string" ? params.redirect_to : "/trainers";

  return (
    <AppShell>
      <div className="max-w-lg">
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mb-6">
          إضافة مدرب جديد
        </h1>
        <TrainerForm
          action={createTrainer}
          submitLabel="حفظ المدرب"
          redirectTo={redirectTo}
        />
      </div>
    </AppShell>
  );
}
