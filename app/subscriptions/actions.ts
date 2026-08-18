"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { recordTransaction, recordManualJournalEntry } from "@/lib/accounting";
import { excelBufferToRows, readCell, type ImportState } from "@/lib/excel";

// JS Date.getDay(): 0=Sunday..6=Saturday — order below must match exactly.
const WEEKDAY_NAMES = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

function generateExpectedDates(
  startedAt: string,
  sessionCount: number,
  sessionDays: string[] | null
): string[] {
  const dates: string[] = [];
  const allowedDays =
    sessionDays && sessionDays.length > 0 ? new Set(sessionDays) : null;
  const cursor = new Date(`${startedAt}T00:00:00`);
  let guard = 0;
  const guardLimit = sessionCount * 30 + 90;

  while (dates.length < sessionCount && guard < guardLimit) {
    const dayName = WEEKDAY_NAMES[cursor.getDay()];
    if (!allowedDays || allowedDays.has(dayName)) {
      dates.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + (allowedDays ? 1 : 7));
    } else {
      cursor.setDate(cursor.getDate() + 1);
    }
    guard++;
  }

  return dates;
}

export async function createSubscription(formData: FormData) {
  const supabase = await createClient();

  const customer_party_id = String(
    formData.get("customer_party_id") ?? ""
  ).trim();
  const program_id = String(formData.get("program_id") ?? "").trim();
  const started_at = String(formData.get("started_at") ?? "").trim();
  const sessionCountRaw = String(formData.get("session_count") ?? "").trim();
  const session_count = Number(sessionCountRaw);
  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = Number(priceRaw);
  const discount_type =
    String(formData.get("discount_type") ?? "").trim() || null;
  const discountRaw = String(formData.get("discount_amount") ?? "").trim();
  const discount_amount = discountRaw ? Number(discountRaw) : 0;

  if (!customer_party_id) throw new Error("لازم تختار الطالب");
  if (!program_id) throw new Error("لازم تختار البرنامج");
  if (!started_at) throw new Error("تاريخ البدء مطلوب");
  if (!sessionCountRaw || Number.isNaN(session_count) || session_count <= 0) {
    throw new Error("عدد السيشنات مطلوب ولازم يكون أكبر من صفر");
  }
  if (!priceRaw || Number.isNaN(price) || price < 0) {
    throw new Error("قيمة الاشتراك مطلوبة");
  }

  const { data: program, error: programError } = await supabase
    .from("programs")
    .select("id, session_days")
    .eq("id", program_id)
    .single();

  if (programError || !program) {
    throw new Error("البرنامج المختار غير موجود");
  }

  const { data: assignments, error: assignError } = await supabase
    .from("program_trainer_assignments")
    .select("trainer_party_id, commission_percent, parties(full_name)")
    .eq("program_id", program_id)
    .is("ends_at", null);

  if (assignError) {
    throw new Error(assignError.message);
  }

  const trainer_assignment_snapshot = (assignments ?? []).map((a) => ({
    trainer_party_id: a.trainer_party_id,
    trainer_name: a.parties?.full_name ?? null,
    commission_percent: Number(a.commission_percent),
  }));

  const price_per_session_after_discount = session_count
    ? Number(((price - discount_amount) / session_count).toFixed(2))
    : null;

  const expectedDates = generateExpectedDates(
    started_at,
    session_count,
    program.session_days
  );
  const ends_at =
    expectedDates.length > 0 ? expectedDates[expectedDates.length - 1] : null;

  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .insert({
      customer_party_id,
      program_id,
      session_count,
      price,
      discount_amount,
      discount_type,
      price_per_session_after_discount,
      trainer_assignment_snapshot,
      started_at,
      ends_at,
      status: "active",
    })
    .select("id")
    .single();

  if (subError || !subscription) {
    throw new Error(subError?.message ?? "فشل إنشاء الاشتراك");
  }

  const sessionRows = Array.from({ length: session_count }, (_, i) => ({
    subscription_id: subscription.id,
    session_number: i + 1,
    expected_date: expectedDates[i] ?? null,
    status: "pending",
  }));

  const { error: sessionsError } = await supabase
    .from("subscription_sessions")
    .insert(sessionRows);

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  revalidatePath("/subscriptions");
  redirect(`/subscriptions/${subscription.id}`);
}

export async function stopAndRefundSubscription(formData: FormData) {
  const supabase = await createClient();

  const subscription_id = String(formData.get("subscription_id") ?? "").trim();
  const doRefund = formData.get("do_refund") === "on";
  const refundAmountRaw = String(formData.get("refund_amount") ?? "").trim();
  const cash_account_id = String(formData.get("cash_account_id") ?? "").trim();

  if (!subscription_id) {
    throw new Error("بيانات الاشتراك ناقصة");
  }

  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("id, customer_party_id, status")
    .eq("id", subscription_id)
    .single();

  if (subError || !subscription) {
    throw new Error("الاشتراك غير موجود");
  }

  const { count: pendingCount } = await supabase
    .from("subscription_sessions")
    .select("id", { count: "exact", head: true })
    .eq("subscription_id", subscription_id)
    .eq("status", "pending");

  const netUnconsumedValue =
    Number(formData.get("net_unconsumed_value") ?? "0") || 0;

  await recordTransaction(supabase, {
    transactionTypeName: "إيقاف اشتراك",
    amount: Math.max(netUnconsumedValue, 0.01),
    subscriptionId: subscription_id,
    customerPartyId: subscription.customer_party_id,
    notes: `إيقاف اشتراك — ${pendingCount ?? 0} سيشن غير مستهلكة`,
  });

  const { error: statusError } = await supabase
    .from("subscriptions")
    .update({ status: "stopped" })
    .eq("id", subscription_id);
  if (statusError) throw new Error(statusError.message);

  if (doRefund) {
    const refundAmount = Number(refundAmountRaw);
    if (!refundAmountRaw || Number.isNaN(refundAmount) || refundAmount <= 0) {
      throw new Error("قيمة الاسترداد مطلوبة");
    }
    if (!cash_account_id) {
      throw new Error("لازم تختار الحساب النقدي للاسترداد");
    }

    await recordTransaction(supabase, {
      transactionTypeName: "استرداد الاشتراك",
      amount: refundAmount,
      subscriptionId: subscription_id,
      customerPartyId: subscription.customer_party_id,
      cashAccountId: cash_account_id,
      notes: "استرداد قيمة السيشنات غير المستهلكة",
    });
  }

  revalidatePath("/subscriptions");
  revalidatePath(`/subscriptions/${subscription_id}`);
  redirect(`/subscriptions/${subscription_id}`);
}

export async function recordSettlementEntry(formData: FormData) {
  const supabase = await createClient();

  const subscription_id = String(formData.get("subscription_id") ?? "").trim();
  const customer_party_id =
    String(formData.get("customer_party_id") ?? "").trim() || null;
  const debit_sub_account_id = String(
    formData.get("debit_sub_account_id") ?? ""
  ).trim();
  const credit_sub_account_id = String(
    formData.get("credit_sub_account_id") ?? ""
  ).trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const amount = Number(amountRaw);

  if (!debit_sub_account_id || !credit_sub_account_id) {
    throw new Error("لازم تختار حساب مدين وحساب دائن");
  }
  if (!amountRaw || Number.isNaN(amount) || amount <= 0) {
    throw new Error("القيمة مطلوبة");
  }

  await recordManualJournalEntry(supabase, {
    transactionTypeName: "تسوية حساب",
    amount,
    debitSubAccountId: debit_sub_account_id,
    creditSubAccountId: credit_sub_account_id,
    subscriptionId: subscription_id || null,
    customerPartyId: customer_party_id,
    notes: "تسوية فرق الخصم على السيشنات غير المستهلكة",
  });

  revalidatePath(`/subscriptions/${subscription_id}`);
  redirect(`/subscriptions/${subscription_id}`);
}

async function findOrCreateCustomer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string,
  phone: string | null
) {
  const { data: existingRole } = await supabase
    .from("party_roles")
    .select("party_id, parties!inner(full_name, phone_1)")
    .eq("role", "customer")
    .eq("parties.full_name", name)
    .maybeSingle();
  if (existingRole) return existingRole.party_id as string;

  const { data: party, error: partyError } = await supabase
    .from("parties")
    .insert({ full_name: name, phone_1: phone })
    .select("id")
    .single();
  if (partyError || !party) {
    throw new Error(partyError?.message ?? `فشل إنشاء الطالب: ${name}`);
  }

  const { error: roleError } = await supabase.from("party_roles").insert({
    party_id: party.id,
    role: "customer",
    status: "active",
    started_at: new Date().toISOString().slice(0, 10),
  });
  if (roleError) throw new Error(roleError.message);

  return party.id as string;
}

export async function importSubscriptions(
  _prevState: ImportState,
  formData: FormData
): Promise<ImportState> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { status: "done", successCount: 0, errorCount: 1, errors: ["لازم تختار ملف إكسيل"] };
  }

  const rows = await excelBufferToRows(await file.arrayBuffer());
  const supabase = await createClient();

  let successCount = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;
    try {
      const customerName = readCell(row, "الطالب", "customer");
      const programName = readCell(row, "البرنامج", "program");
      const sessionCountRaw = readCell(row, "عدد السيشن", "session_count");
      const session_count = Number(sessionCountRaw);
      const priceRaw = readCell(row, "القيمة", "price");
      const price = Number(priceRaw);
      const started_at =
        readCell(row, "تاريخ البدء", "started_at") ||
        new Date().toISOString().slice(0, 10);
      const discount_type = readCell(row, "نوع الخصم", "discount_type") || null;
      const discountRaw = readCell(row, "الخصم", "discount_amount");
      const discount_amount = discountRaw ? Number(discountRaw) : 0;
      const phone = readCell(row, "الهاتف", "phone") || null;

      if (!customerName || !programName) {
        errors.push(`صف ${rowNum}: الطالب والبرنامج مطلوبين`);
        continue;
      }
      if (!sessionCountRaw || Number.isNaN(session_count) || session_count <= 0) {
        errors.push(`صف ${rowNum}: عدد السيشن مطلوب`);
        continue;
      }
      if (!priceRaw || Number.isNaN(price) || price < 0) {
        errors.push(`صف ${rowNum}: القيمة مطلوبة`);
        continue;
      }

      const { data: program } = await supabase
        .from("programs")
        .select("id, session_days")
        .eq("name", programName)
        .maybeSingle();
      if (!program) {
        errors.push(`صف ${rowNum}: البرنامج "${programName}" غير موجود — أضفه أولًا من شاشة البرامج`);
        continue;
      }

      const customer_party_id = await findOrCreateCustomer(supabase, customerName, phone);

      const { data: assignments } = await supabase
        .from("program_trainer_assignments")
        .select("trainer_party_id, commission_percent, parties(full_name)")
        .eq("program_id", program.id)
        .is("ends_at", null);

      const trainer_assignment_snapshot = (assignments ?? []).map((a) => ({
        trainer_party_id: a.trainer_party_id,
        trainer_name: a.parties?.full_name ?? null,
        commission_percent: Number(a.commission_percent),
      }));

      const price_per_session_after_discount = Number(
        ((price - discount_amount) / session_count).toFixed(2)
      );

      const expectedDates = generateExpectedDates(started_at, session_count, program.session_days);
      const ends_at = expectedDates.length > 0 ? expectedDates[expectedDates.length - 1] : null;

      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .insert({
          customer_party_id,
          program_id: program.id,
          session_count,
          price,
          discount_amount,
          discount_type,
          price_per_session_after_discount,
          trainer_assignment_snapshot,
          started_at,
          ends_at,
          status: "active",
        })
        .select("id")
        .single();

      if (subError || !subscription) {
        errors.push(`صف ${rowNum}: ${subError?.message ?? "فشل إنشاء الاشتراك"}`);
        continue;
      }

      const sessionRows = Array.from({ length: session_count }, (_, idx) => ({
        subscription_id: subscription.id,
        session_number: idx + 1,
        expected_date: expectedDates[idx] ?? null,
        status: "pending",
      }));

      const { error: sessionsError } = await supabase
        .from("subscription_sessions")
        .insert(sessionRows);
      if (sessionsError) {
        errors.push(`صف ${rowNum}: الاشتراك اتعمل لكن فشل توليد السيشنات: ${sessionsError.message}`);
        continue;
      }

      successCount++;
    } catch (err) {
      errors.push(`صف ${rowNum}: ${err instanceof Error ? err.message : "خطأ غير معروف"}`);
    }
  }

  revalidatePath("/subscriptions");
  return { status: "done", successCount, errorCount: errors.length, errors };
}
