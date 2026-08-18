"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const ASSET_CATEGORIES = [
  "معدات رياضية",
  "أثاث وتجهيزات",
  "تكاليف تأسيس الجيم الأول",
  "تكاليف تأسيس مبنى الحضانة",
  "لوحات وإعلانات",
  "أجهزة كهربائية",
];

// شجرة حسابات أولية مبنية حرفيًا على أسماء الحسابات المذكورة في
// CLAUDE_PROJECT_BRIEF.md (قسم 4 و5). أولية ومرشحة للمراجعة من صاحب
// المشروع قبل الترحيل النهائي (بند مؤجل في قسم 9 من نفس الملف).
const CHART_OF_ACCOUNTS: {
  statement: string;
  mainAccounts: {
    name: string;
    nature: "مدين" | "دائن";
    subAccounts: string[];
  }[];
}[] = [
  {
    statement: "المركز المالي",
    mainAccounts: [
      {
        name: "الأصول المتداولة",
        nature: "مدين",
        subAccounts: ["النقدية", "العملاء"],
      },
      {
        name: "الأصول الثابتة",
        nature: "مدين",
        subAccounts: ASSET_CATEGORIES.flatMap((a) => [
          a,
          `مجمع استهلاك ${a}`,
        ]),
      },
      {
        name: "الالتزامات المتداولة",
        nature: "دائن",
        subAccounts: [
          "الرواتب المستحقة - المدربين",
          "الرواتب المستحقة - الموظفين",
          "الدائنون",
          "إيجار مستحق",
        ],
      },
      {
        name: "حقوق الملكية",
        nature: "دائن",
        subAccounts: ["رأس المال", "جاري المالك", "جاري شريك (لاند)"],
      },
    ],
  },
  {
    statement: "قائمة الدخل",
    mainAccounts: [
      {
        name: "الإيرادات",
        nature: "دائن",
        subAccounts: ["المبيعات", "إيرادات أخرى", "خصومات إدارية"],
      },
      {
        name: "تكلفة الخدمات المباعة",
        nature: "مدين",
        subAccounts: ["رواتب المدربين (COGS)", "تكاليف مباشرة"],
      },
      {
        name: "المصروفات التشغيلية والإدارية",
        nature: "مدين",
        subAccounts: [
          "خصم مسموح به",
          "المكافآت",
          "الرواتب الإدارية",
          "المصروفات التشغيلية",
          "إيجار",
          "صدقات",
          ...ASSET_CATEGORIES.map((a) => `مصروف استهلاك ${a}`),
        ],
      },
    ],
  },
];

export async function seedChartOfAccounts() {
  const supabase = await createClient();

  const { error: statementsError } = await supabase
    .from("financial_statements")
    .upsert(
      CHART_OF_ACCOUNTS.map((s) => ({ name: s.statement })),
      { onConflict: "name" }
    );
  if (statementsError) throw new Error(statementsError.message);

  const { data: statements, error: statementsFetchError } = await supabase
    .from("financial_statements")
    .select("id, name");
  if (statementsFetchError) throw new Error(statementsFetchError.message);
  const statementIdByName = new Map(
    (statements ?? []).map((s) => [s.name, s.id])
  );

  const { data: existingMainAccounts, error: mainFetchError } = await supabase
    .from("main_accounts")
    .select("id, name, financial_statement_id");
  if (mainFetchError) throw new Error(mainFetchError.message);
  const existingMainKeys = new Set(
    (existingMainAccounts ?? []).map(
      (m) => `${m.financial_statement_id}::${m.name}`
    )
  );

  const mainAccountsToInsert: {
    name: string;
    nature: string;
    financial_statement_id: string;
  }[] = [];
  for (const s of CHART_OF_ACCOUNTS) {
    const statementId = statementIdByName.get(s.statement);
    if (!statementId) continue;
    for (const m of s.mainAccounts) {
      const key = `${statementId}::${m.name}`;
      if (!existingMainKeys.has(key)) {
        mainAccountsToInsert.push({
          name: m.name,
          nature: m.nature,
          financial_statement_id: statementId,
        });
      }
    }
  }
  if (mainAccountsToInsert.length > 0) {
    const { error } = await supabase
      .from("main_accounts")
      .insert(mainAccountsToInsert);
    if (error) throw new Error(error.message);
  }

  const { data: mainAccounts, error: mainFetchError2 } = await supabase
    .from("main_accounts")
    .select("id, name, financial_statement_id");
  if (mainFetchError2) throw new Error(mainFetchError2.message);
  const mainAccountIdByKey = new Map(
    (mainAccounts ?? []).map((m) => [
      `${m.financial_statement_id}::${m.name}`,
      m.id,
    ])
  );

  const subAccountsToUpsert: { name: string; main_account_id: string }[] = [];
  for (const s of CHART_OF_ACCOUNTS) {
    const statementId = statementIdByName.get(s.statement);
    if (!statementId) continue;
    for (const m of s.mainAccounts) {
      const mainAccountId = mainAccountIdByKey.get(
        `${statementId}::${m.name}`
      );
      if (!mainAccountId) continue;
      for (const subName of m.subAccounts) {
        subAccountsToUpsert.push({
          name: subName,
          main_account_id: mainAccountId,
        });
      }
    }
  }

  const { error: subError } = await supabase
    .from("sub_accounts")
    .upsert(subAccountsToUpsert, { onConflict: "name" });
  if (subError) throw new Error(subError.message);

  revalidatePath("/accounting/setup");
}

export async function seedCashAccounts() {
  const supabase = await createClient();
  const names = ["الخزينة", "الدرج", "فودافون كاش", "انستا باي"];

  const { error } = await supabase
    .from("cash_accounts")
    .upsert(
      names.map((name) => ({ name })),
      { onConflict: "name" }
    );
  if (error) throw new Error(error.message);

  revalidatePath("/accounting/setup");
}

type TransactionTypeDef = {
  name: string;
  debit: string | null;
  credit: string | null;
  generatesEntry: boolean;
  triggersCogs: boolean;
};

function buildTransactionTypes(): TransactionTypeDef[] {
  const types: TransactionTypeDef[] = [
    { name: "تسجيل الاشتراك", debit: null, credit: null, generatesEntry: false, triggersCogs: false },
    { name: "حضور نشاط", debit: "العملاء", credit: "المبيعات", generatesEntry: true, triggersCogs: true },
    { name: "غياب (بدون تعويض/محتسب)", debit: "العملاء", credit: "المبيعات", generatesEntry: true, triggersCogs: true },
    { name: "استلام نقدي", debit: "النقدية", credit: "العملاء", generatesEntry: true, triggersCogs: false },
    { name: "خصم مسموح به", debit: "خصم مسموح به", credit: "العملاء", generatesEntry: true, triggersCogs: false },
    { name: "استرداد الاشتراك", debit: "العملاء", credit: "النقدية", generatesEntry: true, triggersCogs: false },
    { name: "اشتراك بالحضانة", debit: "العملاء", credit: "المبيعات", generatesEntry: true, triggersCogs: true },
    { name: "اشتراك بالرحلات", debit: "العملاء", credit: "المبيعات", generatesEntry: true, triggersCogs: true },
    { name: "إيقاف اشتراك", debit: null, credit: null, generatesEntry: false, triggersCogs: false },
    { name: "تجميد اشتراك", debit: null, credit: null, generatesEntry: false, triggersCogs: false },
    { name: "غياب غير محتسب", debit: null, credit: null, generatesEntry: false, triggersCogs: false },
    { name: "حضور نشاط مجاني", debit: null, credit: null, generatesEntry: false, triggersCogs: false },
    { name: "تسوية حساب", debit: null, credit: null, generatesEntry: true, triggersCogs: false },

    { name: "مكافأة (مدرب)", debit: "المكافآت", credit: "الرواتب المستحقة - المدربين", generatesEntry: true, triggersCogs: false },
    { name: "خصومات إدارية", debit: "الرواتب المستحقة - المدربين", credit: "خصومات إدارية", generatesEntry: true, triggersCogs: false },
    { name: "تسليم راتب (مدرب)", debit: "الرواتب المستحقة - المدربين", credit: "النقدية", generatesEntry: true, triggersCogs: false },

    { name: "استحقاق راتب", debit: "الرواتب الإدارية", credit: "الرواتب المستحقة - الموظفين", generatesEntry: true, triggersCogs: false },
    { name: "استحقاق راتب الحضانة", debit: "الرواتب الإدارية", credit: "الرواتب المستحقة - الموظفين", generatesEntry: true, triggersCogs: false },
    { name: "مكافأة (موظف)", debit: "المكافآت", credit: "الرواتب المستحقة - الموظفين", generatesEntry: true, triggersCogs: false },
    { name: "تسليم راتب (موظف)", debit: "الرواتب المستحقة - الموظفين", credit: "النقدية", generatesEntry: true, triggersCogs: false },

    { name: "مصروفات (عامة)", debit: "المصروفات التشغيلية", credit: "النقدية", generatesEntry: true, triggersCogs: false },
    { name: "تكاليف مباشرة (خاصة بنشاط)", debit: "تكاليف مباشرة", credit: "النقدية", generatesEntry: true, triggersCogs: false },
    { name: "إيجار مستحق", debit: "إيجار", credit: "إيجار مستحق", generatesEntry: true, triggersCogs: false },
    { name: "دفع الإيجار", debit: "إيجار مستحق", credit: "النقدية", generatesEntry: true, triggersCogs: false },

    { name: "سحب المالك", debit: "جاري المالك", credit: "النقدية", generatesEntry: true, triggersCogs: false },
    { name: "رد المالك", debit: "النقدية", credit: "جاري المالك", generatesEntry: true, triggersCogs: false },
    { name: "سلفة خارجية", debit: "النقدية", credit: "الدائنون", generatesEntry: true, triggersCogs: false },
    { name: "سداد سلفة خارجية", debit: "الدائنون", credit: "النقدية", generatesEntry: true, triggersCogs: false },
    { name: "صدقات", debit: "صدقات", credit: "النقدية", generatesEntry: true, triggersCogs: false },
    { name: "إيرادات أخرى", debit: "النقدية", credit: "إيرادات أخرى", generatesEntry: true, triggersCogs: false },

    { name: "رصيد بداية السيستم (مديونية عميل)", debit: "العملاء", credit: "رأس المال", generatesEntry: true, triggersCogs: false },
    { name: "رصيد بداية السيستم (مديونية مدرب)", debit: "رأس المال", credit: "الرواتب المستحقة - المدربين", generatesEntry: true, triggersCogs: false },
    { name: "رصيد بداية السيستم (رصيد مقدم للعميل)", debit: "رأس المال", credit: "العملاء", generatesEntry: true, triggersCogs: false },
  ];

  for (const asset of ASSET_CATEGORIES) {
    types.push({
      name: `شراء ${asset}`,
      debit: asset,
      credit: "النقدية",
      generatesEntry: true,
      triggersCogs: false,
    });
    types.push({
      name: `استهلاك ${asset}`,
      debit: `مصروف استهلاك ${asset}`,
      credit: `مجمع استهلاك ${asset}`,
      generatesEntry: true,
      triggersCogs: false,
    });
  }

  return types;
}

async function subAccountIdMap(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("sub_accounts").select("id, name");
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((s) => [s.name, s.id]));
}

export async function seedTransactionTypes() {
  const supabase = await createClient();
  const idByName = await subAccountIdMap(supabase);

  if (idByName.size === 0) {
    throw new Error("لازم تهيّئ شجرة الحسابات الأول قبل زرع أنواع العمليات");
  }

  const defs = buildTransactionTypes();
  const missing = new Set<string>();
  const rows = defs.map((d) => {
    const debit_sub_account_id = d.debit ? idByName.get(d.debit) ?? null : null;
    const credit_sub_account_id = d.credit ? idByName.get(d.credit) ?? null : null;
    if (d.debit && !debit_sub_account_id) missing.add(d.debit);
    if (d.credit && !credit_sub_account_id) missing.add(d.credit);
    return {
      name: d.name,
      debit_sub_account_id,
      credit_sub_account_id,
      generates_entry: d.generatesEntry,
      triggers_cogs: d.triggersCogs,
    };
  });

  if (missing.size > 0) {
    throw new Error(
      `الحسابات الفرعية دي مش موجودة في شجرة الحسابات: ${Array.from(missing).join("، ")}`
    );
  }

  const { error } = await supabase
    .from("transaction_types")
    .upsert(rows, { onConflict: "name" });
  if (error) throw new Error(error.message);

  revalidatePath("/accounting/setup");
}
