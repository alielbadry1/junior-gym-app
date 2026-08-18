import { createClient } from "@/lib/supabase/server";
import { rowsToExcelBuffer, excelHeaders } from "@/lib/excel";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parties")
    .select("full_name, phone_1, phone_2, phone_3, referral_source, notes, created_at")
    .order("created_at", { ascending: false });

  const rows = (data ?? []).map((p) => ({
    الاسم: p.full_name,
    "الهاتف 1": p.phone_1 ?? "",
    "الهاتف 2": p.phone_2 ?? "",
    "الهاتف 3": p.phone_3 ?? "",
    "مصدر التعريف": p.referral_source ?? "",
    ملاحظات: p.notes ?? "",
    "تاريخ الإنشاء": p.created_at ?? "",
  }));

  const buffer = await rowsToExcelBuffer(rows, "الطلاب");

  return new Response(new Uint8Array(buffer), {
    headers: {
      ...excelHeaders(),
      "Content-Disposition": 'attachment; filename="students.xlsx"',
    },
  });
}
