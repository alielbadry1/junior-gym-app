"use client";

import { useActionState } from "react";
import { INITIAL_IMPORT_STATE, type ImportState } from "@/lib/excel";

export default function ExcelImportForm({
  action,
  templateHint,
}: {
  action: (prevState: ImportState, formData: FormData) => Promise<ImportState>;
  templateHint: string;
}) {
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_IMPORT_STATE
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-brand-teal-700/70 leading-relaxed">
        {templateHint}
      </p>
      <form action={formAction} className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="file"
          accept=".xlsx,.xls"
          required
          className="text-sm text-brand-teal-800 file:me-3 file:rounded-lg file:border-0 file:bg-brand-teal-700/10 file:px-3 file:py-2 file:text-sm file:font-bold file:text-brand-teal-800"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-xl bg-brand-teal-700 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-teal-800 transition-colors disabled:opacity-60"
        >
          {isPending ? "جاري الاستيراد..." : "استيراد"}
        </button>
      </form>

      {state.status === "done" && (
        <div className="rounded-xl border border-border bg-surface-muted p-4 text-sm">
          <div className="font-bold text-brand-teal-900">
            تم الاستيراد: {state.successCount} نجح، {state.errorCount} فشل
          </div>
          {state.errors.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-brand-coral-600 list-disc pe-4">
              {state.errors.slice(0, 20).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
              {state.errors.length > 20 && (
                <li>... و{state.errors.length - 20} خطأ إضافي</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
