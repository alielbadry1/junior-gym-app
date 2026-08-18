import AppShell from "@/components/AppShell";
import ExcelImportForm from "@/components/ExcelImportForm";
import { importTrainers } from "../actions";

export default function ImportTrainersPage() {
  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mb-1">
          استيراد المدربين من إكسيل
        </h1>
        <p className="text-sm text-brand-teal-700 mb-6">
          كل صف هيتحوّل لمدرب جديد بدور &quot;مدرب&quot;
        </p>
        <ExcelImportForm
          action={importTrainers}
          templateHint='الأعمدة المتوقعة: "الاسم" (إجباري)، "الهاتف 1"، "الهاتف 2"، "ملاحظات". صدّر الملف الحالي أولًا من شاشة المدربين عشان تاخد نفس الشكل بالظبط.'
        />
      </div>
    </AppShell>
  );
}
