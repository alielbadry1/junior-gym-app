"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// TODO(confirm-enum): party_roles.role is a DB enum. "customer" is our best guess
// based on the requirements doc — confirm the exact allowed value against the
// live enum (select enum_range(null::party_role_enum_name)) and update if different.
const STUDENT_ROLE = "customer";

export async function createStudent(formData: FormData) {
  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone_1 = String(formData.get("phone_1") ?? "").trim() || null;
  const phone_2 = String(formData.get("phone_2") ?? "").trim() || null;
  const referral_source =
    String(formData.get("referral_source") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!full_name) {
    throw new Error("اسم الطالب مطلوب");
  }

  const supabase = await createClient();

  const { data: party, error: partyError } = await supabase
    .from("parties")
    .insert({ full_name, phone_1, phone_2, referral_source, notes })
    .select("id")
    .single();

  if (partyError || !party) {
    throw new Error(partyError?.message ?? "فشل إنشاء سجل الطالب");
  }

  const { error: roleError } = await supabase.from("party_roles").insert({
    party_id: party.id,
    role: STUDENT_ROLE,
    status: "active",
    started_at: new Date().toISOString().slice(0, 10),
  });

  if (roleError) {
    throw new Error(roleError.message);
  }

  revalidatePath("/students");
  redirect("/students");
}

export async function updateStudent(id: string, formData: FormData) {
  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone_1 = String(formData.get("phone_1") ?? "").trim() || null;
  const phone_2 = String(formData.get("phone_2") ?? "").trim() || null;
  const referral_source =
    String(formData.get("referral_source") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!full_name) {
    throw new Error("اسم الطالب مطلوب");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("parties")
    .update({ full_name, phone_1, phone_2, referral_source, notes })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/students");
  redirect("/students");
}
