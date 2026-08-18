import AppShell from "@/components/AppShell";
import ExcelImportForm from "@/components/ExcelImportForm";
import { importStudents } from "../actions";

export default function ImportStudentsPage() {
  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mb-1">
          استيراد الطلاب من إكسيل
        </h1>
        <p className="text-sm text-brand-teal-700 mb-6">
          كل صف هيتحوّل لطالب جديد بدور &quot;عميل&quot;
        </p>
        <ExcelImportForm
          action={importStudents}
          templateHint='الأعمدة المتوقعة: "الاسم" (إجباري)، "الهاتف 1"، "الهاتف 2"، "الهاتف 3"، "مصدر التعريف"، "ملاحظات". صدّر الملف الحالي أولًا من شاشة الطلاب عشان تاخد نفس الشكل بالظبط.'
        />
      </div>
    </AppShell>
  );
}
