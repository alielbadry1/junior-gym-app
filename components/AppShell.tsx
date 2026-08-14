import Link from "next/link";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/", label: "الرئيسية" },
  { href: "/students", label: "الطلاب" },
  { href: "/programs", label: "الأنشطة والبرامج" },
  { href: "/subscriptions", label: "الاشتراكات" },
  { href: "/attendance", label: "الحضور اليومي" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden md:flex md:w-64 md:flex-col bg-brand-teal-900 text-white">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="text-lg font-extrabold tracking-tight">
            Junior Gym
          </div>
          <div className="text-sm text-white/70 mt-0.5">مكتب أصول</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-white/10 text-xs text-white/50">
          النظام المالي والمحاسبي والإداري
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-brand-teal-900 text-white px-4 py-4 flex items-center justify-between">
          <div className="font-extrabold">Junior Gym — مكتب أصول</div>
        </header>
        <main className="flex-1 bg-background px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
