"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function assertOwner(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("لازم تسجّل دخول");

  const { data: appUser } = await supabase
    .from("app_users")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (!appUser || appUser.role !== "owner" || !appUser.active) {
    throw new Error("الشاشة دي للـ Owner بس");
  }
}

export async function updateUserAccess(formData: FormData) {
  const supabase = await createClient();
  await assertOwner(supabase);

  const user_id = String(formData.get("user_id") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!user_id || !role) {
    throw new Error("بيانات ناقصة");
  }

  const { error } = await supabase
    .from("app_users")
    .update({ role, active })
    .eq("id", user_id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/users");
}
