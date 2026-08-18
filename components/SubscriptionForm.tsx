"use client";

import { useMemo, useState } from "react";

const DISCOUNT_TYPES = [
  "خصم الأشقاء",
  "خصم الجيران",
  "خصم ترويجي",
  "خصم تعدد الأنشطة",
  "خصم فريق العمل",
  "خصم فرق تسعير",
  "خصم باقة 3 شهور",
  "خصم أهل جونيور",
  "خسائر خصومات خارج النظام",
  "خصم خاص",
];

type Customer = { id: string; name: string; phone: string | null };
type Department = { id: string; name: string };
type Program = {
  id: string;
  name: string;
  activity_id: string | null;
  price: number;
  session_count: number | null;
  duration_type: string | null;
};

export default function SubscriptionForm({
  action,
  customers,
  departments,
  activities,
  programs,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  customers: Customer[];
  departments: Department[];
  activities: { id: string; name: string; department_id: string | null }[];
  programs: Program[];
  submitLabel: string;
}) {
  const [programId, setProgramId] = useState("");
  const [price, setPrice] = useState("");
  const [sessionCount, setSessionCount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("0");

  const programsById = useMemo(
    () => new Map(programs.map((p) => [p.id, p])),
    [programs]
  );

  function handleProgramChange(id: string) {
    setProgramId(id);
    const program = programsById.get(id);
    if (program) {
      setPrice(String(program.price));
      setSessionCount(program.session_count ? String(program.session_count) : "");
    }
  }

  const priceNum = Number(price) || 0;
  const discountNum = Number(discountAmount) || 0;
  const sessionCountNum = Number(sessionCount) || 0;
  const pricePerSession =
    sessionCountNum > 0
      ? ((priceNum - discountNum) / sessionCountNum).toFixed(2)
      : null;

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      <div>
        <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
          الطالب *
        </label>
        <select
          name="customer_party_id"
          required
          defaultValue=""
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
        >
          <option value="" disabled>
            اختر الطالب
          </option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.phone ? ` — ${c.phone}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
          البرنامج *
        </label>
        <select
          name="program_id"
          required
          value={programId}
          onChange={(e) => handleProgramChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
        >
          <option value="" disabled>
            اختر البرنامج
          </option>
          {departments.map((d) => {
            const deptActivityIds = new Set(
              activities.filter((a) => a.department_id === d.id).map((a) => a.id)
            );
            const deptPrograms = programs.filter(
              (p) => p.activity_id && deptActivityIds.has(p.activity_id)
            );
            if (deptPrograms.length === 0) return null;
            return (
              <optgroup key={d.id} label={d.name}>
                {deptPrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
            تاريخ البدء *
          </label>
          <input
            type="date"
            name="started_at"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
            عدد السيشنات *
          </label>
          <input
            type="number"
            name="session_count"
            required
            min={1}
            value={sessionCount}
            onChange={(e) => setSessionCount(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
            قيمة الاشتراك (ج.م) *
          </label>
          <input
            type="number"
            name="price"
            required
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
            خصم مسموح به (ج.م)
          </label>
          <input
            type="number"
            name="discount_amount"
            min={0}
            step="0.01"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
          نوع الخصم
        </label>
        <select
          name="discount_type"
          defaultValue=""
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
        >
          <option value="">— بدون خصم —</option>
          {DISCOUNT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {pricePerSession && (
        <div className="rounded-xl bg-surface-muted px-4 py-3 text-sm text-brand-teal-800">
          قيمة السيشن بعد الخصم:{" "}
          <span className="font-bold">{pricePerSession} ج.م</span>
        </div>
      )}

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
