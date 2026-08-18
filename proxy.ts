import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// حماية الشاشات مطفية افتراضيًا (AUTH_ENFORCED مش متظبطة) عشان متتقفلش
// على نفسك وأنت لسه بتختبر. لما تكون جاهز فعليًا (حساب Owner شغال +
// باقي الحسابات معتمدة من /users)، ضيف متغيّر بيئة في Vercel:
//   AUTH_ENFORCED=true
// وبعدها كل شاشة هتحتاج تسجيل دخول فعليًا. راجع migrations/ في جذر
// المشروع للتفاصيل الكاملة قبل التفعيل.
const PUBLIC_PATHS = ["/login", "/signup", "/pending"];

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);

  if (process.env.AUTH_ENFORCED !== "true") {
    return supabaseResponse;
  }

  const path = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user) {
    if (isPublicPath) return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (!isPublicPath) {
    const { data: appUser } = await supabase
      .from("app_users")
      .select("active")
      .eq("id", user.id)
      .maybeSingle();

    if (!appUser?.active) {
      const url = request.nextUrl.clone();
      url.pathname = "/pending";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
