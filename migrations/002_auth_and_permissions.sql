-- ============================================================
-- Junior Gym — نظام تسجيل الدخول والمستخدمين (Migration 002)
-- ============================================================
-- آمن تشغّله في أي وقت — بيضيف جداول جديدة بس، ومش بيقفل أي جدول
-- موجود حاليًا (parties, subscriptions...). طريقة التشغيل: افتح
-- Supabase Dashboard ← SQL Editor ← الصق الملف كامل ← Run.
--
-- بعد التشغيل: افتح /signup في التطبيق وسجّل أول حساب — هيتحول تلقائيًا
-- لحساب "Owner" (لأنه أول حساب في النظام). أي حساب بعده هيفضل معلّق
-- لحد ما الـ Owner يعتمده من شاشة /users.
-- ============================================================

create table app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  party_id uuid references parties(id),
  full_name text not null,
  role text not null default 'secretary', -- owner / accounts_manager / office_accountant / secretary
  active boolean not null default false,
  created_at timestamptz default now()
);

-- صلاحيات دقيقة لكل شاشة (مُجهّزة للمرحلة الجاية — التفعيل الفعلي في
-- الشاشات لسه مش مبني، الجدول بس موجود عشان يبقى جاهز).
create table app_user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete cascade,
  screen text not null, -- students / programs / trainers / subscriptions / attendance / accounting / reports / users
  can_view boolean not null default true,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  unique (user_id, screen)
);

create or replace function is_owner() returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from app_users where id = auth.uid() and role = 'owner' and active
  );
$$;

alter table app_users enable row level security;
alter table app_user_permissions enable row level security;

create policy "app_users_select_authenticated" on app_users
  for select using (auth.uid() is not null);
create policy "app_users_write_owner_only" on app_users
  for all using (is_owner()) with check (is_owner());
-- استثناء: يسمح لأي مستخدم يعمل صف نفسه أول مرة (auto-provision عند أول
-- تسجيل دخول) حتى لو مش Owner — بس بحالة active=false (معلّق لحد الاعتماد).
create policy "app_users_self_insert" on app_users
  for insert with check (id = auth.uid() and active = false);

create policy "app_user_permissions_select_authenticated" on app_user_permissions
  for select using (auth.uid() is not null);
create policy "app_user_permissions_write_owner_only" on app_user_permissions
  for all using (is_owner()) with check (is_owner());
