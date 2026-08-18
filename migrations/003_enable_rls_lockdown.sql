-- ============================================================
-- Junior Gym — قفل قاعدة البيانات خلف تسجيل الدخول (Migration 003)
-- ============================================================
-- ⚠️ متشغّلش الملف ده إلا لما:
--   1. شغّلت migrations/002_auth_and_permissions.sql بالفعل.
--   2. سجّلت حساب Owner فعلي من /signup ولوجينت بيه وشغال تمام.
--   3. أي حد تاني محتاج يستخدم النظام عنده حساب متعمول ومعتمد
--      (Active) من شاشة /users.
--
-- بعد التشغيل، أي حد معاه رابط التطبيق بس من غير حساب مسجّل دخول
-- (زي ما هو حاصل دلوقتي) مش هيقدر يقرأ ولا يكتب أي حاجة خالص.
-- لو حصل خطأ وانقفل عليك النظام، رجّع الصلاحيات بالاستعلام ده لأي
-- جدول عشان تفتحه تاني مؤقتًا:
--   alter table <اسم الجدول> disable row level security;
-- ============================================================

create or replace function is_active_user() returns boolean
language sql security definer stable as $$
  select exists (select 1 from app_users where id = auth.uid() and active);
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'parties', 'party_roles', 'cost_centers', 'partners', 'departments',
    'activities', 'programs', 'program_trainer_assignments', 'subscriptions',
    'subscription_sessions', 'financial_statements', 'main_accounts',
    'sub_accounts', 'cash_accounts', 'transaction_types', 'daily_transactions',
    'journal_entries', 'fixed_assets'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      'create policy %I on %I for all using (is_active_user()) with check (is_active_user());',
      t || '_active_users_only', t
    );
  end loop;
end $$;
