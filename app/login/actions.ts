"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    throw new Error("البريد الإلكتروني وكلمة السر مطلوبين");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new Error("بيانات الدخول غير صحيحة");
  }

  // Auto-provision: أول مرة يدخل بيها المستخدم ده، بننشئله صف app_users.
  // أول حساب في النظام كله بيتعمل Owner ومفعّل تلقائيًا (bootstrap)،
  // أي حساب بعده بيتعمل سكرتارية معلّقة لحد ما الـ Owner يعتمدها.
  const { data: existing } = await supabase
    .from("app_users")
    .select("id, active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!existing) {
    const { count } = await supabase
      .from("app_users")
      .select("id", { count: "exact", head: true });
    const isFirstUser = (count ?? 0) === 0;

    await supabase.from("app_users").insert({
      id: data.user.id,
      full_name: data.user.email ?? "مستخدم جديد",
      role: isFirstUser ? "owner" : "secretary",
      active: isFirstUser,
    });

    if (!isFirstUser) {
      redirect("/pending");
    }
  } else if (!existing.active) {
    redirect("/pending");
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
