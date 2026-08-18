"use client";

import { useState } from "react";

export default function StopSubscriptionForm({
  action,
  subscriptionId,
  netUnconsumedValue,
  cashAccounts,
}: {
  action: (formData: FormData) => void;
  subscriptionId: string;
  netUnconsumedValue: number;
  cashAccounts: { id: string; name: string }[];
}) {
  const [doRefund, setDoRefund] = useState(true);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="subscription_id" value={subscriptionId} />
      <input
        type="hidden"
        name="net_unconsumed_value"
        value={netUnconsumedValue}
      />

      <label className="flex items-center gap-2 text-sm font-bold text-brand-teal-900">
        <input
          type="checkbox"
          name="do_refund"
          checked={doRefund}
          onChange={(e) => setDoRefund(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        استرداد القيمة نقدًا للعميل
      </label>

      {doRefund && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-brand-teal-900 mb-1">
              قيمة الاسترداد (ج.م)
            </label>
            <input
              type="number"
              name="refund_amount"
              min={0}
              step="0.01"
              defaultValue={netUnconsumedValue}
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

      <button
        type="submit"
        className="inline-flex items-center rounded-xl bg-brand-coral-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-coral-600 transition-colors"
      >
        تنفيذ إيقاف الاشتراك
      </button>
    </form>
  );
}
