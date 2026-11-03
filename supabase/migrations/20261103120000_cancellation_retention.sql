-- Cancellation feedback (portal + later iOS email) and one-time retention offers.

create table if not exists public.cancellation_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  reason text,
  comment text,
  source text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

create index if not exists cancellation_feedback_user_id_idx
  on public.cancellation_feedback (user_id);

create table if not exists public.retention_offers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  offer_type text not null,
  redeemed_at timestamptz not null default now(),
  stripe_subscription_id text
);

alter table public.cancellation_feedback enable row level security;
alter table public.retention_offers enable row level security;

grant all on table public.cancellation_feedback to service_role;
grant all on table public.retention_offers to service_role;
