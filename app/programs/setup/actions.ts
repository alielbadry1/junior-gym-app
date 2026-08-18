"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function seedCostCenters() {
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("cost_centers")
    .select("name");

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingNames = new Set((existing ?? []).map((c) => c.name));
  const missing = ["الجيم", "لاند"].filter((name) => !existingNames.has(name));

  if (missing.length > 0) {
    const { error } = await supabase
      .from("cost_centers")
      .insert(missing.map((name) => ({ name })));

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/programs/setup");
  revalidatePath("/programs/new");
}

export async function createDepartment(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("اسم القسم مطلوب");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("departments").insert({ name });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/programs/setup");
  revalidatePath("/programs/new");
}

export async function createActivity(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const department_id = String(formData.get("department_id") ?? "").trim();

  if (!name) {
    throw new Error("اسم النشاط مطلوب");
  }
  if (!department_id) {
    throw new Error("لازم تختار القسم الرئيسي");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("activities")
    .insert({ name, department_id });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/programs/setup");
  revalidatePath("/programs/new");
}
