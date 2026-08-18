import Link from "next/link";
import { signIn } from "./actions";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="text-xl font-extrabold text-brand-teal-900">
            Junior Gym
          </div>
          <div className="text-sm text-brand-teal-700 mt-0.5">مكتب أصول</div>
        </div>

        <form action={signIn} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              name="email"
              required
              dir="ltr"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
              كلمة السر
            </label>
            <input
              type="password"
              name="password"
              required
              dir="ltr"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
            />
          </div>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center rounded-xl bg-brand-coral-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-coral-600 transition-colors"
          >
            تسجيل الدخول
          </button>
        </form>

        <p className="text-center text-xs text-brand-teal-700/70 mt-5">
          لسه معملتش حساب؟{" "}
          <Link href="/signup" className="underline font-bold">
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </div>
  );
}
