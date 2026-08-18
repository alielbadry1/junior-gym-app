"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { excelBufferToRows, readCell, type ImportState } from "@/lib/excel";

const TRAINER_ROLE = "trainer";

export async function createTrainer(formData: FormData) {
  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone_1 = String(formData.get("phone_1") ?? "").trim() || null;
  const phone_2 = String(formData.get("phone_2") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const redirectTo = String(formData.get("redirect_to") ?? "/trainers");

  if (!full_name) {
    throw new Error("اسم المدرب مطلوب");
  }

  const supabase = await createClient();

  const { data: party, error: partyError } = await supabase
    .from("parties")
    .insert({ full_name, phone_1, phone_2, notes })
    .select("id")
    .single();

  if (partyError || !party) {
    throw new Error(partyError?.message ?? "فشل إنشاء سجل المدرب");
  }

  const { error: roleError } = await supabase.from("party_roles").insert({
    party_id: party.id,
    role: TRAINER_ROLE,
    status: "active",
    started_at: new Date().toISOString().slice(0, 10),
  });

  if (roleError) {
    throw new Error(roleError.message);
  }

  revalidatePath("/trainers");
  revalidatePath("/programs");
  redirect(redirectTo);
}

export async function importTrainers(
  _prevState: ImportState,
  formData: FormData
): Promise<ImportState> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { status: "done", successCount: 0, errorCount: 1, errors: ["لازم تختار ملف إكسيل"] };
  }

  const rows = await excelBufferToRows(await file.arrayBuffer());
  const supabase = await createClient();

  let successCount = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;
    const full_name = readCell(row, "الاسم", "full_name");
    if (!full_name) {
      errors.push(`صف ${rowNum}: الاسم مطلوب`);
      continue;
    }
    const phone_1 = readCell(row, "الهاتف 1", "phone_1") || null;
    const phone_2 = readCell(row, "الهاتف 2", "phone_2") || null;
    const notes = readCell(row, "ملاحظات", "notes") || null;

    const { data: party, error: partyError } = await supabase
      .from("parties")
      .insert({ full_name, phone_1, phone_2, notes })
      .select("id")
      .single();

    if (partyError || !party) {
      errors.push(`صف ${rowNum}: ${partyError?.message ?? "فشل إنشاء المدرب"}`);
      continue;
    }

    const { error: roleError } = await supabase.from("party_roles").insert({
      party_id: party.id,
      role: TRAINER_ROLE,
      status: "active",
      started_at: new Date().toISOString().slice(0, 10),
    });

    if (roleError) {
      errors.push(`صف ${rowNum}: ${roleError.message}`);
      continue;
    }

    successCount++;
  }

  revalidatePath("/trainers");
  return { status: "done", successCount, errorCount: errors.length, errors };
}
