"use client";

import { useState } from "react";

export default function AttendanceMarkForm({
  action,
  code,
  sessionId,
  sessionNumber,
  subscriptionId,
  customerPartyId,
  programId,
  defaultAmount,
  cashAccounts,
}: {
  action: (formData: FormData) => void;
  code: string;
  sessionId: string;
  sessionNumber: number;
  subscriptionId: string;
  customerPartyId: string | null;
  programId: string | null;
  defaultAmount: number;
  cashAccounts: { id: string; name: string }[];
}) {
  const [status, setStatus] = useState<"attended" | "absent" | "excused">(
    "attended"
  );
  const [collectCash, setCollectCash] = useState(false);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="session_number" value={sessionNumber} />
      <input type="hidden" name="subscription_id" value={subscriptionId} />
      {customerPartyId && (
        <input type="hidden" name="customer_party_id" value={customerPartyId} />
      )}
      {programId && <input type="hidden" name="program_id" value={programId} />}
      <input type="hidden" name="amount" value={defaultAmount} />

      <div>
        <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
          حالة سيشن #{sessionNumber}
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "attended", label: "حضر" },
            { value: "absent", label: "غاب — يُحتسب" },
            { value: "excused", label: "غياب غير محتسب" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                status === opt.value
                  ? "border-brand-teal-600 bg-brand-teal-600/10 text-brand-teal-800"
                  : "border-border text-brand-teal-800/70"
              }`}
            >
              <input
                type="radio"
                name="status"
                value={opt.value}
                checked={status === opt.value}
                onChange={() =>
                  setStatus(opt.value as "attended" | "absent" | "excused")
                }
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {status === "excused" && (
        <div>
          <label className="block text-sm font-bold text-brand-teal-900 mb-1.5">
            سبب الغياب غير المحتسب *
          </label>
          <textarea
            name="excused_reason"
            required
            rows={2}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
          />
        </div>
      )}

      {status !== "excused" && (
        <div className="rounded-xl bg-surface-muted px-4 py-3 text-sm text-brand-teal-800">
          هيتسجّل قيد إيراد بقيمة{" "}
          <span className="font-bold">
            {defaultAmount.toLocaleString("ar-EG")} ج.م
          </span>{" "}
          (قيمة السيشن بعد الخصم)
        </div>
      )}

      <div className="border-t border-border pt-4">
        <label className="flex items-center gap-2 text-sm font-bold text-brand-teal-900 mb-2">
          <input
            type="checkbox"
            name="collect_cash"
            checked={collectCash}
            onChange={(e) => setCollectCash(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          تحصيل نقدي في نفس الوقت
        </label>
        {collectCash && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="block text-xs font-bold text-brand-teal-900 mb-1">
                القيمة (ج.م)
              </label>
              <input
                type="number"
                name="cash_amount"
                min={0}
                step="0.01"
                className="w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-teal-900 mb-1">
                الحساب النقدي
              </label>
              <select
                name="cash_account_id"
                className="w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-brand-teal-600 focus:ring-2 focus:ring-brand-teal-600/20"
              >
                <option value="">اختر</option>
                {cashAccounts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="inline-flex items-center rounded-xl bg-brand-coral-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-coral-600 transition-colors"
      >
        حفظ
      </button>
    </form>
  );
}
