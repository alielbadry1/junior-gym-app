import { createClient } from "@/lib/supabase/server";
import { rowsToExcelBuffer, excelHeaders } from "@/lib/excel";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("party_roles")
    .select("status, started_at, parties(full_name, phone_1, phone_2, notes)")
    .eq("role", "trainer")
    .order("started_at", { ascending: false });

  const rows = (data ?? []).map((r) => ({
    الاسم: r.parties?.full_name ?? "",
    "الهاتف 1": r.parties?.phone_1 ?? "",
    "الهاتف 2": r.parties?.phone_2 ?? "",
    ملاحظات: r.parties?.notes ?? "",
    الحالة: r.status ?? "",
  }));

  const buffer = await rowsToExcelBuffer(rows, "المدربون");

  return new Response(new Uint8Array(buffer), {
    headers: {
      ...excelHeaders(),
      "Content-Disposition": 'attachment; filename="trainers.xlsx"',
    },
  });
}
