import { createClient } from "@/lib/supabase/server";
import { rowsToExcelBuffer, excelHeaders } from "@/lib/excel";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select(
      "name, session_count, duration_type, session_days, session_time, location, price, active, activities(name, departments(name)), cost_centers(name), program_trainer_assignments(commission_percent, ends_at, parties(full_name))"
    )
    .order("created_at", { ascending: false });

  const rows = (data ?? []).map((p) => {
    const trainers = (p.program_trainer_assignments ?? []).filter(
      (a) => a.ends_at === null
    );
    const row: Record<string, string | number> = {
      "القسم الرئيسي": p.activities?.departments?.name ?? "",
      النشاط: p.activities?.name ?? "",
      البرنامج: p.name,
      "عدد السيشن": p.session_count ?? "",
      "نوع المدة": p.duration_type ?? "",
      "مركز التكلفة": p.cost_centers?.name ?? "",
      السعر: p.price,
      الموقع: p.location ?? "",
      "أيام التدريب": (p.session_days ?? []).join("، "),
      "وقت التدريب": p.session_time ?? "",
      نشط: p.active === false ? "لا" : "نعم",
    };
    trainers.forEach((t, i) => {
      row[`المدرب ${i + 1}`] = t.parties?.full_name ?? "";
      row[`نسبة ${i + 1}`] = t.commission_percent;
    });
    return row;
  });

  const buffer = await rowsToExcelBuffer(rows, "البرامج");

  return new Response(new Uint8Array(buffer), {
    headers: {
      ...excelHeaders(),
      "Content-Disposition": 'attachment; filename="programs.xlsx"',
    },
  });
}
