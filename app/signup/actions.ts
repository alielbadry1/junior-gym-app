"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignupResult = {
  status: "idle" | "needs_confirmation" | "error";
  message?: string;
};

export async function signUp(
  _prev: SignupResult,
  formData: FormData
): Promise<SignupResult> {
  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!full_name || !email || !password) {
    return { status: "error", message: "كل الحقول مطلوبة" };
  }
  if (password.length < 6) {
    return { status: "error", message: "كلمة السر لازم تكون 6 حروف/أرقام على الأقل" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data.user) {
    return { status: "error", message: error?.message ?? "فشل إنشاء الحساب" };
  }

  // لو تأكيد الإيميل مطفي في إعدادات Supabase، بترجع سيشن جاهزة على طول —
  // في الحالة دي نكمّل التسجيل في app_users فورًا بدل ما نستنى أول لوجين.
  if (data.session) {
    const { count } = await supabase
      .from("app_users")
      .select("id", { count: "exact", head: true });
    const isFirstUser = (count ?? 0) === 0;

    await supabase.from("app_users").insert({
      id: data.user.id,
      full_name,
      role: isFirstUser ? "owner" : "secretary",
      active: isFirstUser,
    });

    redirect(isFirstUser ? "/" : "/pending");
  }

  return {
    status: "needs_confirmation",
    message:
      "اتبعتلك رابط تأكيد على بريدك الإلكتروني — افتحه، وبعدين ارجع سجّل دخول من هنا.",
  };
}
