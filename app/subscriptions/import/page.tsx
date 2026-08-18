import AppShell from "@/components/AppShell";
import ExcelImportForm from "@/components/ExcelImportForm";
import { importSubscriptions } from "../actions";

export default function ImportSubscriptionsPage() {
  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-extrabold text-brand-teal-900 mb-1">
          استيراد الاشتراكات من إكسيل
        </h1>
        <p className="text-sm text-brand-teal-700 mb-6">
          البرنامج لازم يكون موجود بالفعل بنفس الاسم بالظبط (اتعمله من شاشة
          البرامج). الطالب هيتلاقى أو يتعمل تلقائيًا بالاسم.
        </p>
        <ExcelImportForm
          action={importSubscriptions}
          templateHint='الأعمدة: "الطالب" و"البرنامج" (إجباري، البرنامج لازم يكون موجود بالاسم بالظبط)، "الهاتف"، "عدد السيشن" و"القيمة" (إجباري)، "الخصم"، "نوع الخصم"، "تاريخ البدء" (YYYY-MM-DD، افتراضي النهاردة). كل صف بيولّد متتبع سيشنات تلقائي زي شاشة إنشاء الاشتراك بالظبط. صدّر الاشتراكات الحالية أولًا عشان تاخد نفس الشكل.'
        />
      </div>
    </AppShell>
  );
}
