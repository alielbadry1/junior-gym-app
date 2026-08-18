import { signOut } from "../login/actions";

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm text-center">
        <div className="text-xl font-extrabold text-brand-teal-900 mb-2">
          حسابك في انتظار الاعتماد
        </div>
        <p className="text-sm text-brand-teal-700/80 leading-relaxed mb-6">
          حسابك اتعمل بنجاح، بس لسه محتاج مالك النظام يفعّله ويحدد صلاحياتك
          قبل ما تقدر تدخل. كلّم كابتن أحمد وقوله يعتمد حسابك من شاشة
          &quot;المستخدمون&quot;.
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex items-center rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-bold text-brand-teal-800 hover:bg-surface-muted transition-colors"
          >
            تسجيل الخروج
          </button>
        </form>
      </div>
    </div>
  );
}
