# Junior Gym — Database Schema (Supabase, schema public)
 
مرجع كامل لأعمدة كل الجداول، مستخرج فعليًا من قاعدة البيانات الحية بتاريخ 2026-08-13. يُستخدم لبناء الشاشات والاستعلامات بدقة.
 
## activities
- id uuid NOT NULL
- department_id uuid NULL
- name text NOT NULL
## cash_accounts
- id uuid NOT NULL
- name text NOT NULL
## cost_centers
- id uuid NOT NULL
- name text NOT NULL
- created_at timestamptz NULL
## daily_transactions
- id uuid NOT NULL
- seq bigint NOT NULL
- transaction_date date NOT NULL
- transaction_type_id uuid NULL
- subscription_id uuid NULL
- customer_party_id uuid NULL
- program_id uuid NULL
- employee_party_id uuid NULL
- amount numeric NOT NULL
- cash_account_id uuid NULL
- expense_category text NULL
- discount_type text NULL
- notes text NULL
- created_by uuid NULL
- created_at timestamptz NULL
## departments
- id uuid NOT NULL
- name text NOT NULL
## financial_statements
- id uuid NOT NULL
- name text NOT NULL
## fixed_assets
- id uuid NOT NULL
- sub_account_id uuid NULL
- name text NOT NULL
- cost_center_id uuid NULL
- purchase_cost numeric NOT NULL
- purchase_date date NULL
- monthly_depreciation numeric NULL
- accumulated_depreciation numeric NULL
## journal_entries
- id uuid NOT NULL
- daily_transaction_id uuid NULL
- debit_sub_account_id uuid NULL
- credit_sub_account_id uuid NULL
- amount numeric NOT NULL
- cost_center_id uuid NULL
- is_cogs_entry boolean NULL
- trainer_party_id uuid NULL
- created_at timestamptz NULL
## main_accounts
- id uuid NOT NULL
- financial_statement_id uuid NULL
- name text NOT NULL
- nature text NOT NULL
## parties
- id uuid NOT NULL
- full_name text NOT NULL
- phone_1 text NULL
- phone_2 text NULL
- phone_3 text NULL
- referral_source text NULL
- notes text NULL
- created_at timestamptz NULL
## partners
- id uuid NOT NULL
- cost_center_id uuid NULL
- name text NOT NULL
- share_percent numeric NULL
- joined_at date NULL
- active boolean NULL
## party_roles
- id uuid NOT NULL
- party_id uuid NULL
- role USER-DEFINED (enum) NOT NULL
- department text NULL
- cost_center_id uuid NULL
- status text NULL
- started_at date NULL
- ended_at date NULL
## program_trainer_assignments
- id uuid NOT NULL
- program_id uuid NULL
- trainer_party_id uuid NULL
- commission_percent numeric NOT NULL
- starts_at date NOT NULL
- ends_at date NULL
- created_at timestamptz NULL
## programs
- id uuid NOT NULL
- activity_id uuid NULL
- cost_center_id uuid NULL
- name text NOT NULL
- session_count integer NULL
- duration_type text NULL
- session_days ARRAY NULL
- session_time time NULL
- location text NULL
- price numeric NOT NULL
- price_per_session numeric NULL
- active boolean NULL
- created_at timestamptz NULL
## sub_accounts
- id uuid NOT NULL
- main_account_id uuid NULL
- name text NOT NULL
- cost_center_id uuid NULL
## subscription_sessions
- id uuid NOT NULL
- subscription_id uuid NULL
- session_number integer NOT NULL
- expected_date date NULL
- actual_date date NULL
- status text NULL
## subscriptions
- id uuid NOT NULL
- code bigint NOT NULL
- customer_party_id uuid NULL
- program_id uuid NULL
- session_count integer NOT NULL
- price numeric NOT NULL
- discount_amount numeric NULL
- discount_type text NULL
- price_per_session_after_discount numeric NULL
- trainer_assignment_snapshot jsonb NULL
- started_at date NOT NULL
- ends_at date NULL
- status text NULL
- created_at timestamptz NULL
## transaction_types
- id uuid NOT NULL
- name text NOT NULL
- debit_sub_account_id uuid NULL
- credit_sub_account_id uuid NULL
- generates_entry boolean NULL
- triggers_cogs boolean NULL
---
 
## بيانات الاتصال (Supabase)
- Project URL: https://outloitmkhlgzlglvssw.supabase.co
- Publishable/anon key: مخزّن في .env.local بمشروع الكود (مش هنا لأسباب أمان) — لو احتجته تاني، رجّعه من Supabase Dashboard ← Project Settings ← API Keys
- GitHub repo: https://github.com/alielbadry1/junior-gym-app
 