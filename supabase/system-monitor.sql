-- ============================================================================
-- SysMonitor — Full Database Setup
-- Run this once on a fresh Supabase project (SQL Editor → New query → Run).
-- Idempotent: safe to re-run.
-- ============================================================================

-- ── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin
  create type public.app_role as enum ('admin', 'viewer', 'user');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.alert_severity as enum ('warning', 'error', 'critical');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- profiles ------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_roles ----------------------------------------------------------------
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  unique (user_id, role),
  unique (user_id)
);
grant select, insert on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
drop policy if exists "Users can view own roles" on public.user_roles;
create policy "Users can view own roles" on public.user_roles
  for select using (auth.uid() = user_id);
drop policy if exists "Users can create own initial role" on public.user_roles;
create policy "Users can create own initial role" on public.user_roles
  for insert to authenticated with check (auth.uid() = user_id);

-- has_role() ----------------------------------------------------------------
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from anon;

-- system_logs ---------------------------------------------------------------
create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null,
  source text not null,
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists system_logs_created_at_idx on public.system_logs (created_at desc);
grant select, insert, update, delete on public.system_logs to authenticated;
grant all on public.system_logs to service_role;
alter table public.system_logs enable row level security;
drop policy if exists "Admins and viewers can view logs" on public.system_logs;
create policy "Admins and viewers can view logs" on public.system_logs
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'viewer'));
drop policy if exists "Admins can insert logs" on public.system_logs;
create policy "Admins can insert logs" on public.system_logs
  for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

-- alerts --------------------------------------------------------------------
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  severity public.alert_severity not null,
  source text not null,
  metric text not null,
  value numeric not null,
  threshold numeric not null,
  message text not null,
  acknowledged boolean not null default false,
  created_at timestamptz not null default now(),
  acknowledged_by uuid references auth.users(id),
  acknowledged_at timestamptz,
  resolved_at timestamptz
);
create index if not exists alerts_created_at_idx on public.alerts (created_at desc);
grant select, insert, update, delete on public.alerts to authenticated;
grant all on public.alerts to service_role;
alter table public.alerts enable row level security;
drop policy if exists "Admins and viewers can view alerts" on public.alerts;
create policy "Admins and viewers can view alerts" on public.alerts
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'viewer'));
drop policy if exists "Admins can insert alerts" on public.alerts;
create policy "Admins can insert alerts" on public.alerts
  for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
drop policy if exists "Admins can update alerts" on public.alerts;
create policy "Admins can update alerts" on public.alerts
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- alert_rules ---------------------------------------------------------------
create table if not exists public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  metric text not null,
  source text not null default 'system-monitor',
  threshold numeric not null,
  duration_seconds integer not null default 0,
  severity public.alert_severity not null default 'warning',
  message_template text not null,
  cooldown_seconds integer not null default 30,
  enabled boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.alert_rules to authenticated;
grant all on public.alert_rules to service_role;
alter table public.alert_rules enable row level security;
drop policy if exists "Admins and viewers can view alert rules" on public.alert_rules;
create policy "Admins and viewers can view alert rules" on public.alert_rules
  for select using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'viewer'));
drop policy if exists "Admins can insert alert rules" on public.alert_rules;
create policy "Admins can insert alert rules" on public.alert_rules
  for insert with check (public.has_role(auth.uid(), 'admin'));
drop policy if exists "Admins can update alert rules" on public.alert_rules;
create policy "Admins can update alert rules" on public.alert_rules
  for update using (public.has_role(auth.uid(), 'admin'));
drop policy if exists "Admins can delete alert rules" on public.alert_rules;
create policy "Admins can delete alert rules" on public.alert_rules
  for delete using (public.has_role(auth.uid(), 'admin'));

-- metric_snapshots ----------------------------------------------------------
create table if not exists public.metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  cpu numeric not null,
  memory numeric not null,
  disk numeric not null,
  network numeric not null,
  recorded_at timestamptz not null default now()
);
create index if not exists metric_snapshots_recorded_at_idx on public.metric_snapshots (recorded_at desc);
grant select, insert, update, delete on public.metric_snapshots to authenticated;
grant all on public.metric_snapshots to service_role;
alter table public.metric_snapshots enable row level security;
drop policy if exists "Admins and viewers can view metric snapshots" on public.metric_snapshots;
create policy "Admins and viewers can view metric snapshots" on public.metric_snapshots
  for select using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'viewer'));
drop policy if exists "Admins can insert metric snapshots" on public.metric_snapshots;
create policy "Admins can insert metric snapshots" on public.metric_snapshots
  for insert with check (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- REALTIME — enable live updates for dashboard
-- ============================================================================
alter publication supabase_realtime add table public.system_logs;
alter publication supabase_realtime add table public.alerts;
alter publication supabase_realtime add table public.metric_snapshots;

-- Done. Sign up via the app — the app creates the profile and role after
-- Supabase returns a signed-in session. To promote a user manually:
--   insert into public.user_roles(user_id, role) values ('<uuid>', 'admin');
