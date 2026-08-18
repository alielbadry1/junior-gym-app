import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type TrainerSnapshot = {
  trainer_party_id: string;
  trainer_name: string | null;
  commission_percent: number;
};

export type RecordTransactionInput = {
  transactionTypeName: string;
  transactionDate?: string;
  amount: number;
  subscriptionId?: string | null;
  customerPartyId?: string | null;
  programId?: string | null;
  employeePartyId?: string | null;
  cashAccountId?: string | null;
  expenseCategory?: string | null;
  discountType?: string | null;
  notes?: string | null;
  costCenterId?: string | null;
  createdBy?: string | null;
};

async function getSubAccountId(supabase: SupabaseClient, name: string) {
  const { data } = await supabase
    .from("sub_accounts")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * رصيد حساب نقدي = مجموع كل daily_transactions المرتبطة بيه، بإشارة موجبة
 * لو "النقدية" على جانب المدين في نوع العملية، وسالبة لو على جانب الدائن.
 * (مفيش FK مباشر بين cash_accounts و sub_accounts في الـ schema الحالي —
 * الربط بيتم عن طريق transaction_types.debit/credit_sub_account_id، انظر
 * PROJECT_HANDOFF.md قسم 5.2.)
 */
export async function getCashAccountBalance(
  supabase: SupabaseClient,
  cashAccountId: string
) {
  const cashSubId = await getSubAccountId(supabase, "النقدية");
  if (!cashSubId) return 0;

  const { data: rows, error } = await supabase
    .from("daily_transactions")
    .select("amount, transaction_types(debit_sub_account_id, credit_sub_account_id)")
    .eq("cash_account_id", cashAccountId);

  if (error) throw new Error(error.message);

  let balance = 0;
  for (const r of rows ?? []) {
    const tt = r.transaction_types;
    if (!tt) continue;
    if (tt.debit_sub_account_id === cashSubId) balance += Number(r.amount);
    if (tt.credit_sub_account_id === cashSubId) balance -= Number(r.amount);
  }
  return balance;
}

/**
 * يسجّل عملية يومية ويولّد القيد المزدوج المرافق تلقائيًا حسب transaction_types،
 * بما في ذلك قيد الـ COGS التلقائي (رواتب المدربين) لو النوع triggers_cogs،
 * ومنع أي خصم من حساب نقدي يخليه سالب (القاعدة الصارمة في قسم 7 من البريف).
 */
export async function recordTransaction(
  supabase: SupabaseClient,
  input: RecordTransactionInput
) {
  const { data: type, error: typeError } = await supabase
    .from("transaction_types")
    .select(
      "id, name, debit_sub_account_id, credit_sub_account_id, generates_entry, triggers_cogs"
    )
    .eq("name", input.transactionTypeName)
    .single();

  if (typeError || !type) {
    throw new Error(`نوع العملية غير موجود: ${input.transactionTypeName}`);
  }

  if (input.amount <= 0) {
    throw new Error("قيمة العملية لازم تكون أكبر من صفر");
  }

  if (type.generates_entry && input.cashAccountId && type.credit_sub_account_id) {
    const cashSubId = await getSubAccountId(supabase, "النقدية");
    if (cashSubId && type.credit_sub_account_id === cashSubId) {
      const balance = await getCashAccountBalance(supabase, input.cashAccountId);
      if (balance - input.amount < 0) {
        throw new Error(
          `الرصيد غير كافٍ في هذا الحساب النقدي (الرصيد الحالي: ${balance.toLocaleString(
            "ar-EG"
          )} ج.م) — العملية ممنوعة عشان الخزينة ميجيش رصيدها سالب`
        );
      }
    }
  }

  const transaction_date =
    input.transactionDate ?? new Date().toISOString().slice(0, 10);

  const { data: tx, error: txError } = await supabase
    .from("daily_transactions")
    .insert({
      transaction_date,
      transaction_type_id: type.id,
      subscription_id: input.subscriptionId ?? null,
      customer_party_id: input.customerPartyId ?? null,
      program_id: input.programId ?? null,
      employee_party_id: input.employeePartyId ?? null,
      amount: input.amount,
      cash_account_id: input.cashAccountId ?? null,
      expense_category: input.expenseCategory ?? null,
      discount_type: input.discountType ?? null,
      notes: input.notes ?? null,
      created_by: input.createdBy ?? null,
    })
    .select("id")
    .single();

  if (txError || !tx) {
    throw new Error(txError?.message ?? "فشل تسجيل العملية");
  }

  if (!type.generates_entry) {
    return { transactionId: tx.id as string, journalEntryIds: [] as string[] };
  }

  if (!type.debit_sub_account_id || !type.credit_sub_account_id) {
    throw new Error(
      `نوع العملية "${type.name}" محتاج تحديد الحسابات يدويًا (زي تسوية حساب) — القيد التلقائي مش مدعوم له لسه`
    );
  }

  let costCenterId = input.costCenterId ?? null;
  if (!costCenterId && input.programId) {
    const { data: program } = await supabase
      .from("programs")
      .select("cost_center_id")
      .eq("id", input.programId)
      .single();
    costCenterId = program?.cost_center_id ?? null;
  }

  const entriesToInsert: {
    daily_transaction_id: string;
    debit_sub_account_id: string;
    credit_sub_account_id: string;
    amount: number;
    cost_center_id: string | null;
    is_cogs_entry: boolean;
    trainer_party_id: string | null;
  }[] = [
    {
      daily_transaction_id: tx.id,
      debit_sub_account_id: type.debit_sub_account_id,
      credit_sub_account_id: type.credit_sub_account_id,
      amount: input.amount,
      cost_center_id: costCenterId,
      is_cogs_entry: false,
      trainer_party_id: null,
    },
  ];

  if (type.triggers_cogs && input.subscriptionId) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("trainer_assignment_snapshot")
      .eq("id", input.subscriptionId)
      .single();

    const snapshot = (sub?.trainer_assignment_snapshot ??
      []) as unknown as TrainerSnapshot[];

    if (snapshot.length > 0) {
      const [cogsExpenseId, payableId] = await Promise.all([
        getSubAccountId(supabase, "رواتب المدربين (COGS)"),
        getSubAccountId(supabase, "الرواتب المستحقة - المدربين"),
      ]);

      if (cogsExpenseId && payableId) {
        for (const t of snapshot) {
          const cogsAmount = Number(
            ((input.amount * t.commission_percent) / 100).toFixed(2)
          );
          if (cogsAmount > 0) {
            entriesToInsert.push({
              daily_transaction_id: tx.id,
              debit_sub_account_id: cogsExpenseId,
              credit_sub_account_id: payableId,
              amount: cogsAmount,
              cost_center_id: costCenterId,
              is_cogs_entry: true,
              trainer_party_id: t.trainer_party_id,
            });
          }
        }
      }
    }
  }

  const { data: insertedEntries, error: entriesError } = await supabase
    .from("journal_entries")
    .insert(entriesToInsert)
    .select("id");

  if (entriesError) {
    throw new Error(entriesError.message);
  }

  return {
    transactionId: tx.id as string,
    journalEntryIds: (insertedEntries ?? []).map((e) => e.id as string),
  };
}

export type RecordManualEntryInput = {
  transactionTypeName: string;
  transactionDate?: string;
  amount: number;
  debitSubAccountId: string;
  creditSubAccountId: string;
  subscriptionId?: string | null;
  customerPartyId?: string | null;
  costCenterId?: string | null;
  notes?: string | null;
  createdBy?: string | null;
};

/**
 * لتسجيل عمليات محاسبها "متغير" حسب الحالة (زي "تسوية حساب") ومفيش لها
 * debit/credit ثابت في transaction_types — بيوخد الحسابين صراحةً من المستخدم
 * بدل ما يحاول يخمنهم. آلية "تسوية حساب" التلقائية بالتفصيل بند مؤجل (قسم 9
 * من CLAUDE_PROJECT_BRIEF.md)، فده حل يدوي مؤقت لحد ما تتحدد الآلية.
 */
export async function recordManualJournalEntry(
  supabase: SupabaseClient,
  input: RecordManualEntryInput
) {
  const { data: type, error: typeError } = await supabase
    .from("transaction_types")
    .select("id")
    .eq("name", input.transactionTypeName)
    .single();

  if (typeError || !type) {
    throw new Error(`نوع العملية غير موجود: ${input.transactionTypeName}`);
  }
  if (input.amount <= 0) {
    throw new Error("قيمة العملية لازم تكون أكبر من صفر");
  }

  const transaction_date =
    input.transactionDate ?? new Date().toISOString().slice(0, 10);

  const { data: tx, error: txError } = await supabase
    .from("daily_transactions")
    .insert({
      transaction_date,
      transaction_type_id: type.id,
      subscription_id: input.subscriptionId ?? null,
      customer_party_id: input.customerPartyId ?? null,
      amount: input.amount,
      notes: input.notes ?? null,
      created_by: input.createdBy ?? null,
    })
    .select("id")
    .single();

  if (txError || !tx) {
    throw new Error(txError?.message ?? "فشل تسجيل العملية");
  }

  const { error: entryError } = await supabase.from("journal_entries").insert({
    daily_transaction_id: tx.id,
    debit_sub_account_id: input.debitSubAccountId,
    credit_sub_account_id: input.creditSubAccountId,
    amount: input.amount,
    cost_center_id: input.costCenterId ?? null,
    is_cogs_entry: false,
  });

  if (entryError) {
    throw new Error(entryError.message);
  }

  return { transactionId: tx.id as string };
}

export type SubAccountBalance = {
  subAccountId: string;
  subAccountName: string;
  mainAccountId: string;
  mainAccountName: string;
  mainAccountNature: string;
  financialStatementName: string;
  /** مدين − دائن التراكمي (موجب = رصيد مدين، سالب = رصيد دائن) */
  balance: number;
};

/**
 * رصيد كل حساب فرعي في شجرة الحسابات = مجموع (مدين − دائن) من كل journal_entries
 * في المدى الزمني/مركز التكلفة المحدد. أساس مشترك لميزان المراجعة والمركز
 * المالي وشاشة الالتزامات المستحقة.
 */
export async function getSubAccountBalances(
  supabase: SupabaseClient,
  filters?: { fromDate?: string; toDate?: string; costCenterId?: string | null }
): Promise<SubAccountBalance[]> {
  const { data: subAccounts, error: subError } = await supabase
    .from("sub_accounts")
    .select(
      "id, name, main_accounts(id, name, nature, financial_statements(name))"
    );
  if (subError) throw new Error(subError.message);

  let entriesQuery = supabase
    .from("journal_entries")
    .select(
      "debit_sub_account_id, credit_sub_account_id, amount, cost_center_id, daily_transactions!inner(transaction_date)"
    );

  if (filters?.fromDate) {
    entriesQuery = entriesQuery.gte(
      "daily_transactions.transaction_date",
      filters.fromDate
    );
  }
  if (filters?.toDate) {
    entriesQuery = entriesQuery.lte(
      "daily_transactions.transaction_date",
      filters.toDate
    );
  }
  if (filters?.costCenterId) {
    entriesQuery = entriesQuery.eq("cost_center_id", filters.costCenterId);
  }

  const { data: entries, error: entriesError } = await entriesQuery;
  if (entriesError) throw new Error(entriesError.message);

  const balanceMap = new Map<string, number>();
  for (const e of entries ?? []) {
    if (e.debit_sub_account_id) {
      balanceMap.set(
        e.debit_sub_account_id,
        (balanceMap.get(e.debit_sub_account_id) ?? 0) + Number(e.amount)
      );
    }
    if (e.credit_sub_account_id) {
      balanceMap.set(
        e.credit_sub_account_id,
        (balanceMap.get(e.credit_sub_account_id) ?? 0) - Number(e.amount)
      );
    }
  }

  return (subAccounts ?? []).map((s) => ({
    subAccountId: s.id,
    subAccountName: s.name,
    mainAccountId: s.main_accounts?.id ?? "",
    mainAccountName: s.main_accounts?.name ?? "",
    mainAccountNature: s.main_accounts?.nature ?? "",
    financialStatementName: s.main_accounts?.financial_statements?.name ?? "",
    balance: Number((balanceMap.get(s.id) ?? 0).toFixed(2)),
  }));
}
