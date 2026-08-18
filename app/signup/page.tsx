"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type SignupResult } from "./actions";

const INITIAL_STATE: SignupResult = { status: "idle" };

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signUp, INITIAL_STATE);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="text-xl font-extrabold text-brand-teal-900">
            Junior Gym
          </div>
          <div className="text-sm text-brand-teal-700 mt-0.5">
            إنشاء حساب جديد
          </div>
        </div>

        {state.status === "needs_confirmation" ? (
          <div className="rounded-xl bg-surface-muted p-4 text-sm text-brand-teal-800 text-center">
            {state.message}
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            {state.status === "error" && (
              <div className="rounded-xl border border-brand-coral-500/30 bg-brand-coral-100/40 p-3 text-sm text-brand-coral-600">
                {state.message}
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
                الاسم
              </label>
              <input
                type="text"
                name="full_name"
                required
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
              />
            </div>
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
                minLength={6}
                dir="ltr"
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full inline-flex items-center justify-center rounded-xl bg-brand-coral-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-coral-600 transition-colors disabled:opacity-60"
            >
              {isPending ? "جاري الإنشاء..." : "إنشاء الحساب"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-brand-teal-700/70 mt-5">
          عندك حساب بالفعل؟{" "}
          <Link href="/login" className="underline font-bold">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
