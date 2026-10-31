-- Email foundation: locale + marketing consent audit, subscription events, email_log.

alter table public.profiler
  add column if not exists locale text;

alter table public.profiler
  add column if not exists markedsforing_samtykke boolean;

update public.profiler
set markedsforing_samtykke = false
where markedsforing_samtykke is null;

alter table public.profiler
  alter column markedsforing_samtykke set default false;

alter table public.profiler
  alter column markedsforing_samtykke set not null;

alter table public.profiler
  add column if not exists markedsforing_samtykke_at timestamptz;

alter table public.profiler
  add column if not exists markedsforing_samtykke_kilde text;

comment on column public.profiler.locale is
  'App UI locale (no, en, …). Written on profiler insert and kept in sync.';
comment on column public.profiler.markedsforing_samtykke_kilde is
  'registration | settings';

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  app_user_id text,
  type text,
  store text,
  product_id text,
  period_type text,
  event_at timestamptz,
  expiration_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists subscription_events_user_id_idx
  on public.subscription_events (user_id);

create table if not exists public.subscription_status (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text,
  store text,
  product_id text,
  is_trial boolean,
  will_renew boolean,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email_type text not null,
  sent_at timestamptz not null default now(),
  resend_id text,
  unique (user_id, email_type)
);

alter table public.subscription_events enable row level security;
alter table public.subscription_status enable row level security;
alter table public.email_log enable row level security;

drop policy if exists subscription_status_les_egen on public.subscription_status;
create policy subscription_status_les_egen
  on public.subscription_status
  for select
  to authenticated
  using (user_id = auth.uid());

grant select on table public.subscription_status to authenticated;
grant all on table public.subscription_events to service_role;
grant all on table public.subscription_status to service_role;
grant all on table public.email_log to service_role;
