-- ============================================================
-- Junior Gym — النظام المالي والمحاسبي والإداري
-- Database Schema v1 (PostgreSQL / Supabase)
-- ============================================================

-- ------------------------------------------------------------
-- 1) مراكز التكلفة (الجيم / لاند)
-- ------------------------------------------------------------
create table cost_centers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,          -- 'الجيم' / 'لاند'
  created_at    timestamptz default now()
);

-- شركاء تشغيل الأموال (خاص بمركز تكلفة "لاند" حاليًا)
create table partners (
  id              uuid primary key default gen_random_uuid(),
  cost_center_id  uuid references cost_centers(id),
  name            text not null,
  share_percent   numeric(5,2),         -- من العقد، قد تتغير بمرور الوقت
  joined_at       date,
  active          boolean default true
);

-- ------------------------------------------------------------
-- 2) الأشخاص (Parties) — قاعدة موحدة لكل من يتعامل مع الجيم
--    نفس الشخص ممكن ياخد أكتر من دور (مثال: موظف حضانة + مدرب نسبة)
-- ------------------------------------------------------------
create table parties (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  phone_1       text,
  phone_2       text,
  phone_3       text,
  referral_source text,                 -- جهة معرفته بنا
  notes         text,
  created_at    timestamptz default now()
);

-- أدوار الشخص: عميل / مدرب (نسبة) / موظف (راتب ثابت) / مالك / شريك
create type party_role as enum ('customer','trainer','employee','owner','partner');

create table party_roles (
  id            uuid primary key default gen_random_uuid(),
  party_id      uuid references parties(id) on delete cascade,
  role          party_role not null,
  department    text,                  -- القسم الإداري (للموظف): المالية، الاستقبال...
  cost_center_id uuid references cost_centers(id), -- مركز تكلفة الراتب (حضانة/جيم..)
  status        text default 'active', -- نشط / متوقف (يُحسب تلقائيًا للعملاء، يدوي لغيرهم)
  started_at    date,
  ended_at      date,
  unique (party_id, role, cost_center_id)
);

-- ------------------------------------------------------------
-- 3) شجرة الأنشطة: قسم رئيسي ← نشاط ← برنامج
-- ------------------------------------------------------------
create table departments (             -- الأقسام الرئيسية
  id      uuid primary key default gen_random_uuid(),
  name    text not null unique
);

create table activities (              -- الأنشطة
  id              uuid primary key default gen_random_uuid(),
  department_id   uuid references departments(id),
  name            text not null
);

create table programs (                -- البرامج (اسم = نشاط/عدد سيشن/مدرب رئيسي)
  id              uuid primary key default gen_random_uuid(),
  activity_id     uuid references activities(id),
  cost_center_id  uuid references cost_centers(id),
  name            text not null,           -- توليد تلقائي من القالب أدناه
  session_count   int,                     -- عدد السيشنات (null = غير محدد / يومي)
  duration_type   text,                    -- 'شهري' / 'سيشن' / 'يومي' ...
  session_days    text[],                  -- أيام الأسبوع (لحساب تاريخ الانتهاء بالحصص)
  session_time    time,
  location        text,
  price           numeric(12,2) not null,  -- قيمة البرنامج الكاملة
  price_per_session numeric(12,2),         -- محسوبة: price / session_count
  active          boolean default true,
  created_at      timestamptz default now()
);

-- تكليف المدرب على برنامج معين — Versioned (له تاريخ بداية/نهاية)
-- بيسمح بتغيّر المدرب أو النسبة بدون التأثير على الاشتراكات القديمة
create table program_trainer_assignments (
  id              uuid primary key default gen_random_uuid(),
  program_id      uuid references programs(id),
  trainer_party_id uuid references parties(id),
  commission_percent numeric(5,2) not null,   -- نسبة المدرب من المتحصلات الفعلية
  starts_at       date not null,
  ends_at         date,                       -- null = ساري حاليًا
  created_at      timestamptz default now()
);

-- ------------------------------------------------------------
-- 4) الاشتراكات (كود الاشتراك = محور التسجيل)
-- ------------------------------------------------------------
create table subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  code                bigint generated always as identity, -- كود الاشتراك (رقم تسلسلي)
  customer_party_id   uuid references parties(id),
  program_id          uuid references programs(id),
  session_count       int not null,
  price               numeric(12,2) not null,       -- قيمة الاشتراك عند الإنشاء
  discount_amount     numeric(12,2) default 0,       -- خصم مسموح به
  discount_type       text,                          -- نوع الخصم (من قائمة الخصومات)
  price_per_session_after_discount numeric(12,2),    -- محسوبة
  -- Snapshot لتكليف المدرب وقت إنشاء الاشتراك (حتى لو اتغيّر بعدين)
  trainer_assignment_snapshot jsonb,
  started_at          date not null,
  ends_at             date,                          -- محسوبة حسب نوع المدة
  status              text default 'active',         -- active / stopped / cancelled
  created_at          timestamptz default now()
);

-- متتبع السيشنات (Session Tracker) — سطر لكل سيشن متوقعة/فعلية
create table subscription_sessions (
  id                uuid primary key default gen_random_uuid(),
  subscription_id   uuid references subscriptions(id) on delete cascade,
  session_number    int not null,                -- 1..session_count
  expected_date     date,                         -- تاريخ متوقع (لطباعة PDF للعميل)
  actual_date       date,                         -- تاريخ الحضور/الغياب الفعلي
  status            text default 'pending',       -- pending / attended / absent / excused
  excused_reason    text,                         -- سبب "غياب غير محتسب" (إجباري)
  unique (subscription_id, session_number)
);

-- ------------------------------------------------------------
-- 5) شجرة الحسابات (Chart of Accounts) — 3 مستويات
-- ------------------------------------------------------------
create table financial_statements (      -- القوائم المالية
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique             -- المركز المالي / قائمة الدخل
);

create table main_accounts (             -- الحساب الرئيسي
  id                    uuid primary key default gen_random_uuid(),
  financial_statement_id uuid references financial_statements(id),
  name                  text not null,   -- الأصول المتداولة / الالتزامات / الإيرادات ...
  nature                text not null    -- 'مدين' / 'دائن'
);

create table sub_accounts (              -- الحساب الفرعي
  id              uuid primary key default gen_random_uuid(),
  main_account_id uuid references main_accounts(id),
  name            text not null unique,  -- النقدية / العملاء / رواتب المدربين (COGS) ...
  cost_center_id  uuid references cost_centers(id)  -- null = عام لكل المراكز
);

-- الحسابات النقدية الفرعية (فروع تحت حساب "النقدية")
create table cash_accounts (
  id      uuid primary key default gen_random_uuid(),
  name    text not null unique   -- الخزينة / الدرج / فودافون كاش / انستا باي
);

-- ------------------------------------------------------------
-- 6) أنواع العمليات (Transaction Types) — يحدد القيد المزدوج تلقائيًا
-- ------------------------------------------------------------
create table transaction_types (
  id                uuid primary key default gen_random_uuid(),
  name              text not null unique,   -- اشتراك / حضور نشاط / استلام نقدي ...
  debit_sub_account_id  uuid references sub_accounts(id),
  credit_sub_account_id uuid references sub_accounts(id),
  generates_entry   boolean default true,   -- false لعمليات مثل "تسجيل الاشتراك"
  -- هل يولّد قيد COGS مرافق (رواتب مدربين) تلقائيًا؟
  triggers_cogs     boolean default false
);

-- ------------------------------------------------------------
-- 7) اليومية (سجل العمليات الخام) — قلب النظام
-- ------------------------------------------------------------
create table daily_transactions (
  id                  uuid primary key default gen_random_uuid(),
  seq                 bigint generated always as identity,   -- م (رقم مسلسل)
  transaction_date    date not null default current_date,
  transaction_type_id uuid references transaction_types(id),
  subscription_id     uuid references subscriptions(id),
  customer_party_id   uuid references parties(id),
  program_id          uuid references programs(id),
  employee_party_id   uuid references parties(id),   -- الموظف اللي سجّل العملية
  amount              numeric(12,2) not null default 0,
  cash_account_id     uuid references cash_accounts(id),  -- طريقة السداد (لو نقدية)
  expense_category    text,                 -- تصنيف المصروفات (لو مصروف)
  discount_type       text,                 -- نوع الخصم (لو خصم)
  notes               text,
  created_by          uuid references parties(id),
  created_at          timestamptz default now()
);

-- القيد المزدوج المُولَّد تلقائيًا من كل عملية (Journal Entries)
create table journal_entries (
  id                    uuid primary key default gen_random_uuid(),
  daily_transaction_id  uuid references daily_transactions(id) on delete cascade,
  debit_sub_account_id  uuid references sub_accounts(id),
  credit_sub_account_id uuid references sub_accounts(id),
  amount                numeric(12,2) not null,
  cost_center_id        uuid references cost_centers(id),
  is_cogs_entry         boolean default false,  -- true لقيد "رواتب المدربين" المرافق
  trainer_party_id      uuid references parties(id),  -- لو قيد COGS، مين المدرب المستفيد
  created_at            timestamptz default now()
);

-- ------------------------------------------------------------
-- 8) الأصول الثابتة والاستهلاك
-- ------------------------------------------------------------
create table fixed_assets (
  id                uuid primary key default gen_random_uuid(),
  sub_account_id    uuid references sub_accounts(id),
  name              text not null,
  cost_center_id    uuid references cost_centers(id),
  purchase_cost     numeric(12,2) not null,
  purchase_date     date,
  monthly_depreciation numeric(12,2),
  accumulated_depreciation numeric(12,2) default 0
);

-- ------------------------------------------------------------
-- فهارس أساسية للأداء
-- ------------------------------------------------------------
create index idx_dt_date on daily_transactions(transaction_date);
create index idx_dt_customer on daily_transactions(customer_party_id);
create index idx_dt_subscription on daily_transactions(subscription_id);
create index idx_je_daily_tx on journal_entries(daily_transaction_id);
create index idx_subs_customer on subscriptions(customer_party_id);
create index idx_subs_program on subscriptions(program_id);
