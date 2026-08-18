"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { recordTransaction } from "@/lib/accounting";

const STATUS_TO_TRANSACTION_TYPE: Record<string, string | null> = {
  attended: "حضور نشاط",
  absent: "غياب (بدون تعويض/محتسب)",
  excused: "غياب غير محتسب",
};

export async function markSession(formData: FormData) {
  const supabase = await createClient();

  const session_id = String(formData.get("session_id") ?? "").trim();
  const subscription_id = String(formData.get("subscription_id") ?? "").trim();
  const customer_party_id =
    String(formData.get("customer_party_id") ?? "").trim() || null;
  const program_id = String(formData.get("program_id") ?? "").trim() || null;
  const code = String(formData.get("code") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const excused_reason = String(formData.get("excused_reason") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "0").trim();
  const amount = Number(amountRaw) || 0;

  if (!session_id || !subscription_id) {
    throw new Error("بيانات السيشن ناقصة");
  }
  if (!STATUS_TO_TRANSACTION_TYPE[status]) {
    throw new Error("حالة غير معروفة");
  }
  if (status === "excused" && !excused_reason) {
    throw new Error("الغياب غير المحتسب لازم يكون له سبب/ملاحظة");
  }

  const today = new Date().toISOString().slice(0, 10);

  const { error: updateError } = await supabase
    .from("subscription_sessions")
    .update({ status, actual_date: today })
    .eq("id", session_id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const transactionTypeName = STATUS_TO_TRANSACTION_TYPE[status];

  if (status === "excused") {
    // مفيش عمود excused_reason في subscription_sessions حاليًا في القاعدة الحية
    // (فجوة schema معروفة، راجع PROGRESS_LOG.md 2026-08-14) — بنحفظ السبب
    // كأثر تدقيقي في daily_transactions.notes لحد ما تتضاف الكولوم.
    await recordTransaction(supabase, {
      transactionTypeName,
      amount: 1,
      subscriptionId: subscription_id,
      customerPartyId: customer_party_id,
      programId: program_id,
      notes: `غياب غير محتسب - سيشن #${formData.get("session_number") ?? ""} - السبب: ${excused_reason}`,
    });
  } else if (amount > 0) {
    await recordTransaction(supabase, {
      transactionTypeName,
      amount,
      subscriptionId: subscription_id,
      customerPartyId: customer_party_id,
      programId: program_id,
      notes: `تسجيل حضور/غياب سيشن #${formData.get("session_number") ?? ""}`,
    });
  }

  const collectCash = formData.get("collect_cash") === "on";
  if (collectCash) {
    const cashAmountRaw = String(formData.get("cash_amount") ?? "").trim();
    const cashAmount = Number(cashAmountRaw);
    const cash_account_id = String(formData.get("cash_account_id") ?? "").trim();

    if (!cash_account_id) {
      throw new Error("لازم تختار الحساب النقدي للتحصيل");
    }
    if (!cashAmountRaw || Number.isNaN(cashAmount) || cashAmount <= 0) {
      throw new Error("قيمة التحصيل النقدي مطلوبة");
    }

    await recordTransaction(supabase, {
      transactionTypeName: "استلام نقدي",
      amount: cashAmount,
      subscriptionId: subscription_id,
      customerPartyId: customer_party_id,
      cashAccountId: cash_account_id,
      notes: "تحصيل نقدي وقت تسجيل الحضور اليومي",
    });
  }

  revalidatePath("/attendance");
  revalidatePath(`/subscriptions/${subscription_id}`);
  redirect(`/attendance?code=${encodeURIComponent(code)}`);
}
