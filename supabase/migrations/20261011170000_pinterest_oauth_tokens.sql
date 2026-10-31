-- Server-side Pinterest OAuth token blob (encrypted ciphertext only).
-- No RLS policies: accessible only via service role. Never expose to clients.

create table if not exists public.pinterest_oauth_tokens (
  id text primary key check (id = 'lille'),
  ciphertext text not null,
  updated_at timestamptz not null default now()
);

alter table public.pinterest_oauth_tokens enable row level security;

comment on table public.pinterest_oauth_tokens is
  'Encrypted Pinterest OAuth tokens for Lille Content Autopilot. Service-role only.';
