import { createClient } from "@/lib/supabase/server";
import { rowsToExcelBuffer, excelHeaders } from "@/lib/excel";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select(
      "code, session_count, price, discount_amount, discount_type, started_at, ends_at, status, parties(full_name, phone_1), programs(name)"
    )
    .order("created_at", { ascending: false });

  const rows = (data ?? []).map((s) => ({
    الكود: s.code,
    الطالب: s.parties?.full_name ?? "",
    الهاتف: s.parties?.phone_1 ?? "",
    البرنامج: s.programs?.name ?? "",
    "عدد السيشن": s.session_count,
    القيمة: s.price,
    الخصم: s.discount_amount ?? 0,
    "نوع الخصم": s.discount_type ?? "",
    "تاريخ البدء": s.started_at,
    "تاريخ الانتهاء": s.ends_at ?? "",
    الحالة: s.status ?? "",
  }));

  const buffer = await rowsToExcelBuffer(rows, "الاشتراكات");

  return new Response(new Uint8Array(buffer), {
    headers: {
      ...excelHeaders(),
      "Content-Disposition": 'attachment; filename="subscriptions.xlsx"',
    },
  });
}
