"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { recordTransaction } from "@/lib/accounting";

export async function recordStaffTransaction(formData: FormData) {
  const supabase = await createClient();

  const party_id = String(formData.get("party_id") ?? "").trim();
  const transaction_type_name = String(
    formData.get("transaction_type_name") ?? ""
  ).trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const amount = Number(amountRaw);
  const cash_account_id = String(formData.get("cash_account_id") ?? "").trim();

  if (!party_id || !transaction_type_name) {
    throw new Error("بيانات ناقصة");
  }
  if (!amountRaw || Number.isNaN(amount) || amount <= 0) {
    throw new Error("القيمة مطلوبة");
  }

  await recordTransaction(supabase, {
    transactionTypeName: transaction_type_name,
    amount,
    employeePartyId: party_id,
    cashAccountId: cash_account_id || null,
    notes: `${transaction_type_name} — من شاشة كشف حساب المدربين/الموظفين`,
  });

  revalidatePath(`/reports/staff/${party_id}`);
  redirect(`/reports/staff/${party_id}`);
}
