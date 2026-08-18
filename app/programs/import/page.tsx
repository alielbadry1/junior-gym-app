import AppShell from "@/components/AppShell";
import ExcelImportForm from "@/components/ExcelImportForm";
import { importPrograms } from "../actions";

export default function ImportProgramsPage() {
  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mb-1">
          استيراد البرامج من إكسيل
        </h1>
        <p className="text-sm text-brand-teal-700 mb-6">
          الأقسام والأنشطة والمدربون غير الموجودين هيتعملوا تلقائيًا بالاسم
          المكتوب بالظبط — راجع الأسماء بعد الاستيراد عشان تتجنب التكرار
        </p>
        <ExcelImportForm
          action={importPrograms}
          templateHint='الأعمدة: "القسم الرئيسي" و"النشاط" (إجباري)، "البرنامج" (اختياري، بيتولّد تلقائيًا لو فاضي)، "عدد السيشن"، "نوع المدة"، "مركز التكلفة" (الجيم/لاند، لازم يكونوا متهيّئين من إعدادات الحسابات)، "السعر" (إجباري)، "الموقع"، "أيام التدريب" (مفصولة بفاصلة)، "وقت التدريب"، وحتى 4 مدربين: "المدرب 1"/"نسبة 1" إلى "المدرب 4"/"نسبة 4". صدّر البرامج الحالية أولًا عشان تاخد نفس الشكل بالظبط.'
        />
      </div>
    </AppShell>
  );
}
