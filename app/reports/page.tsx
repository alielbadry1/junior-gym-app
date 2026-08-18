import Link from "next/link";
import AppShell from "@/components/AppShell";

const REPORTS = [
  {
    href: "/reports/customers",
    title: "كشف حساب العملاء",
    desc: "تجاري ومحاسبي، وتفصيلي بالنشاط لكل عميل",
  },
  {
    href: "/reports/staff",
    title: "كشف حساب المدربين والموظفين",
    desc: "الرواتب المستحقة والمكافآت والتسليمات",
  },
  {
    href: "/reports/cash",
    title: "النقدية والخزينة",
    desc: "رصيد كل حساب نقدي وحركته",
  },
  {
    href: "/reports/income-statement",
    title: "قائمة الدخل الموحّدة",
    desc: "تجميع حسب القسم/النشاط/البرنامج، بفترة ومركز تكلفة قابلين للتحديد",
  },
  {
    href: "/reports/trial-balance",
    title: "ميزان المراجعة",
    desc: "رصيد كل حساب فرعي في شجرة الحسابات",
  },
  {
    href: "/reports/balance-sheet",
    title: "المركز المالي",
    desc: "الأصول والالتزامات وحقوق الملكية",
  },
  {
    href: "/reports/liabilities",
    title: "الالتزامات المستحقة",
    desc: "إجمالي وتفصيل كل بند مستحق",
  },
];

export default function ReportsPage() {
  return (
    <AppShell>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mb-1">
          المالية والتقارير
        </h1>
        <p className="text-sm text-brand-teal-700 mb-6">
          كل التقارير مبنية مباشرة من القيود المحاسبية الفعلية
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {REPORTS.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="rounded-2xl border border-border bg-surface p-5 hover:shadow-sm hover:border-brand-teal-600/40 transition-colors"
            >
              <div className="font-bold text-brand-teal-900">{r.title}</div>
              <div className="text-xs text-brand-teal-700/70 mt-1">
                {r.desc}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
