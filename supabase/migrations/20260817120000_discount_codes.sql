-- Rabatt- og ambassadørkoder (kun server-side via service_role)

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null check (type in ('ambassador_free', 'customer_discount')),
  discount_percent int,
  duration_months int,
  stripe_promo_code_id text,
  active boolean not null default true,
  max_redemptions int,
  notes text,
  created_at timestamptz default now()
);

create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.discount_codes(code),
  email text not null,
  app_user_id uuid,
  redeemed_at timestamptz default now(),
  status text not null default 'pending' check (status in ('pending', 'fulfilled', 'failed'))
);

create index redemptions_code_idx on public.redemptions (code);
create index redemptions_email_idx on public.redemptions (email);

alter table public.discount_codes enable row level security;
alter table public.redemptions enable row level security;

-- Ingen policies for anon/authenticated → kun service_role (bypasser RLS) har tilgang
