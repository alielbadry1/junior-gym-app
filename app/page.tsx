import Link from "next/link";
import AppShell from "@/components/AppShell";

type Accent = "teal" | "coral" | "amber";

type ModuleTile = {
  href: string;
  icon: string;
  name: string;
  desc: string;
  accent: Accent;
  disabled?: boolean;
};

type ModuleGroup = {
  title: string;
  tiles: ModuleTile[];
};

const MODULE_GROUPS: ModuleGroup[] = [
  {
    title: "العمليات اليومية",
    tiles: [
      { href: "/attendance", icon: "✓", name: "تسجيل الحضور والدفع", desc: "اليومية", accent: "teal" },
      { href: "/subscriptions/new", icon: "＋", name: "إنشاء اشتراك", desc: "كود اشتراك جديد", accent: "coral" },
      { href: "/students", icon: "👤", name: "الطلاب / العملاء", desc: "بيانات وكشوف حساب", accent: "amber" },
      { href: "/subscriptions", icon: "🏋", name: "الاشتراكات", desc: "متابعة ومتتبع السيشنات", accent: "teal" },
    ],
  },
  {
    title: "الإعدادات الأساسية",
    tiles: [
      { href: "/programs", icon: "🗂", name: "البرامج والأنشطة", desc: "شجرة الأقسام والبرامج", accent: "coral" },
      { href: "/trainers", icon: "🎓", name: "المدربون", desc: "التكليفات والنسب", accent: "teal" },
      { href: "#", icon: "🧑‍💼", name: "الموظفون", desc: "قريبًا — شاشة مستقلة", accent: "amber", disabled: true },
      { href: "#", icon: "🤝", name: "شركاء لاند", desc: "قريبًا — بانتظار العقد", accent: "coral", disabled: true },
    ],
  },
  {
    title: "المالية والتقارير",
    tiles: [
      { href: "/reports/cash", icon: "💰", name: "النقدية والخزينة", desc: "الخزينة، فودافون كاش، انستاباي", accent: "teal" },
      { href: "/reports/income-statement", icon: "📈", name: "قائمة الدخل", desc: "بالأقسام / الأنشطة / الشهور", accent: "coral" },
      { href: "/reports/balance-sheet", icon: "⚖️", name: "المركز المالي", desc: "وميزان المراجعة", accent: "amber" },
      { href: "/reports/liabilities", icon: "📋", name: "الالتزامات المستحقة", desc: "سلف وإيجار مستحق", accent: "teal" },
    ],
  },
  {
    title: "الإدارة",
    tiles: [
      { href: "#", icon: "🏢", name: "الأصول الثابتة", desc: "قريبًا — المعدات والاستهلاك", accent: "coral", disabled: true },
      { href: "/users", icon: "🔐", name: "المستخدمون والصلاحيات", desc: "إدارة فريق العمل", accent: "teal" },
    ],
  },
];

const ICON_WRAP_CLASSES: Record<Accent, string> = {
  teal: "bg-brand-teal-600/10 text-brand-teal-700",
  coral: "bg-brand-coral-100 text-brand-coral-600",
  amber: "bg-brand-amber-100 text-amber-800",
};

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-brand-teal-900">
            أهلًا بيك 👋
          </h1>
          <p className="text-sm text-brand-teal-700 mt-1">
            اختار الشاشة اللي عايز تشتغل عليها
          </p>
        </div>

        <div className="space-y-10">
          {MODULE_GROUPS.map((group) => (
            <section key={group.title}>
              <h2 className="flex items-center gap-2 text-base font-bold text-brand-teal-900 mb-4">
                <span className="inline-block h-[18px] w-[6px] rounded-sm bg-brand-coral-500" />
                {group.title}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.tiles.map((tile) =>
                  tile.disabled ? (
                    <div
                      key={tile.name}
                      className="rounded-2xl border border-border bg-surface p-5 text-center opacity-50 cursor-not-allowed"
                    >
                      <div
                        className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${ICON_WRAP_CLASSES[tile.accent]}`}
                      >
                        {tile.icon}
                      </div>
                      <div className="text-sm font-bold text-brand-teal-950">
                        {tile.name}
                      </div>
                      <div className="text-xs text-brand-teal-700/60 mt-1">
                        {tile.desc}
                      </div>
                    </div>
                  ) : (
                    <Link
                      key={tile.name}
                      href={tile.href}
                      className="rounded-2xl border border-border bg-surface p-5 text-center transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-brand-teal-600/30"
                    >
                      <div
                        className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${ICON_WRAP_CLASSES[tile.accent]}`}
                      >
                        {tile.icon}
                      </div>
                      <div className="text-sm font-bold text-brand-teal-950">
                        {tile.name}
                      </div>
                      <div className="text-xs text-brand-teal-700/60 mt-1">
                        {tile.desc}
                      </div>
                    </Link>
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 text-center text-xs text-brand-teal-700/50">
          Junior Gym — مكتب أصول
        </div>
      </div>
    </AppShell>
  );
}
