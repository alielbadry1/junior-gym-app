type StudentFormValues = {
  full_name?: string;
  phone_1?: string | null;
  phone_2?: string | null;
  referral_source?: string | null;
  notes?: string | null;
};

export default function StudentForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaultValues?: StudentFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5 max-w-lg">
      <div>
        <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
          اسم الطالب *
        </label>
        <input
          type="text"
          name="full_name"
          required
          defaultValue={defaultValues?.full_name}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
            رقم الهاتف 1
          </label>
          <input
            type="tel"
            name="phone_1"
            defaultValue={defaultValues?.phone_1 ?? ""}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
            رقم الهاتف 2
          </label>
          <input
            type="tel"
            name="phone_2"
            defaultValue={defaultValues?.phone_2 ?? ""}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
          مصدر التعريف بالنادي
        </label>
        <input
          type="text"
          name="referral_source"
          defaultValue={defaultValues?.referral_source ?? ""}
          placeholder="مثال: توصية صديق، سوشيال ميديا..."
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
          ملاحظات
        </label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="inline-flex items-center rounded-xl bg-brand-coral-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-coral-600 transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
