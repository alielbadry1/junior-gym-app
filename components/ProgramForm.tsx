"use client";

import Link from "next/link";
import { useState } from "react";

const WEEK_DAYS = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

const DURATION_SUGGESTIONS = ["شهري", "سيشن", "يومي", "أسبوعي", "خاص"];

type Activity = { id: string; name: string; department_id: string | null };
type Department = { id: string; name: string };
type CostCenter = { id: string; name: string };
type Trainer = { id: string; name: string };

type TrainerRow = { trainerId: string; commission: string };

type ProgramFormValues = {
  activity_id?: string | null;
  cost_center_id?: string | null;
  duration_type?: string | null;
  session_count?: number | null;
  session_days?: string[] | null;
  session_time?: string | null;
  location?: string | null;
  price?: number | null;
  active?: boolean | null;
  assignments?: { trainer_party_id: string; commission_percent: number }[];
};

export default function ProgramForm({
  action,
  activities,
  departments,
  costCenters,
  trainers,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  activities: Activity[];
  departments: Department[];
  costCenters: CostCenter[];
  trainers: Trainer[];
  defaultValues?: ProgramFormValues;
  submitLabel: string;
}) {
  const [trainerRows, setTrainerRows] = useState<TrainerRow[]>(
    defaultValues?.assignments && defaultValues.assignments.length > 0
      ? defaultValues.assignments.map((a) => ({
          trainerId: a.trainer_party_id,
          commission: String(a.commission_percent),
        }))
      : [{ trainerId: "", commission: "" }]
  );
  const [sessionDays, setSessionDays] = useState<string[]>(
    defaultValues?.session_days ?? []
  );

  const trainerCommissionSum = trainerRows.reduce(
    (sum, r) => sum + (Number(r.commission) || 0),
    0
  );

  function updateRow(index: number, patch: Partial<TrainerRow>) {
    setTrainerRows((rows) =>
      rows.map((r, i) => (i === index ? { ...r, ...patch } : r))
    );
  }

  function addRow() {
    setTrainerRows((rows) => [...rows, { trainerId: "", commission: "" }]);
  }

  function removeRow(index: number) {
    setTrainerRows((rows) => rows.filter((_, i) => i !== index));
  }

  function toggleDay(day: string) {
    setSessionDays((days) =>
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day]
    );
  }

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
            النشاط *
          </label>
          <select
            name="activity_id"
            required
            defaultValue={defaultValues?.activity_id ?? ""}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
          >
            <option value="" disabled>
              اختر النشاط
            </option>
            {departments.map((d) => {
              const deptActivities = activities.filter(
                (a) => a.department_id === d.id
              );
              if (deptActivities.length === 0) return null;
              return (
                <optgroup key={d.id} label={d.name}>
                  {deptActivities.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          {activities.length === 0 && (
            <p className="text-xs text-brand-coral-600 mt-1.5">
              لا يوجد أنشطة بعد —{" "}
              <Link href="/programs/setup" className="underline">
                أضف قسم ونشاط الأول
              </Link>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
            مركز التكلفة
          </label>
          <select
            name="cost_center_id"
            defaultValue={defaultValues?.cost_center_id ?? ""}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
          >
            <option value="">— بدون تحديد —</option>
            {costCenters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
            عدد السيشنات
          </label>
          <input
            type="number"
            name="session_count"
            min={1}
            defaultValue={defaultValues?.session_count ?? ""}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
            نوع المدة
          </label>
          <input
            type="text"
            name="duration_type"
            list="duration-suggestions"
            defaultValue={defaultValues?.duration_type ?? ""}
            placeholder="شهري / سيشن / يومي..."
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
          />
          <datalist id="duration-suggestions">
            {DURATION_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
            قيمة البرنامج (ج.م) *
          </label>
          <input
            type="number"
            name="price"
            required
            min={0}
            step="0.01"
            defaultValue={defaultValues?.price ?? ""}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
          أيام التدريب
        </label>
        <div className="flex flex-wrap gap-2">
          {WEEK_DAYS.map((day) => (
            <label
              key={day}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                sessionDays.includes(day)
                  ? "border-brand-teal-600 bg-brand-teal-600/10 text-brand-teal-800"
                  : "border-border text-brand-teal-800/70"
              }`}
            >
              <input
                type="checkbox"
                name="session_days"
                value={day}
                checked={sessionDays.includes(day)}
                onChange={() => toggleDay(day)}
                className="sr-only"
              />
              {day}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
            وقت التدريب
          </label>
          <input
            type="time"
            name="session_time"
            defaultValue={defaultValues?.session_time ?? ""}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
            مكان التدريب
          </label>
          <input
            type="text"
            name="location"
            defaultValue={defaultValues?.location ?? ""}
            placeholder="مثال: صالة الجيم"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-bold text-brand-teal-900">
            تكليف المدربين ونسبهم
          </label>
          <span
            className={`text-xs font-bold ${
              trainerCommissionSum > 100
                ? "text-brand-coral-600"
                : "text-brand-teal-700/70"
            }`}
          >
            إجمالي النسب: {trainerCommissionSum}% — نسبة الجيم:{" "}
            {Math.max(0, 100 - trainerCommissionSum)}%
          </span>
        </div>

        <div className="space-y-2">
          {trainerRows.map((row, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                name="trainer_party_id"
                value={row.trainerId}
                onChange={(e) => updateRow(i, { trainerId: e.target.value })}
                className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
              >
                <option value="">— اختر مدرب —</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="commission_percent"
                min={0}
                max={100}
                step="0.01"
                placeholder="النسبة %"
                value={row.commission}
                onChange={(e) => updateRow(i, { commission: e.target.value })}
                className="w-28 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
              />
              {trainerRows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="text-brand-coral-600 text-sm font-bold px-2"
                >
                  حذف
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={addRow}
            className="text-sm font-bold text-brand-teal-700 hover:text-brand-teal-900"
          >
            + إضافة مدرب آخر
          </button>
          {trainers.length === 0 && (
            <Link
              href={`/trainers/new?redirect_to=/programs/new`}
              className="text-sm text-brand-coral-600 underline"
            >
              لا يوجد مدربون — أضف مدرب جديد
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="active"
          id="active"
          defaultChecked={defaultValues?.active ?? true}
          className="h-4 w-4 rounded border-border"
        />
        <label htmlFor="active" className="text-sm font-medium text-brand-teal-900">
          البرنامج نشط
        </label>
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
