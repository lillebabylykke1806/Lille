create table if not exists public.flaske (
  id          uuid primary key default gen_random_uuid(),
  profil_id   text not null,
  dato        date not null,
  klokkeslett time not null,
  mengde_ml   integer not null,
  flasketype  text,
  smokkestr   text,
  melketype   text,
  notater     text,
  opprettet   timestamptz default now()
);

create index if not exists flaske_profil_id_dato_idx on public.flaske (profil_id, dato);

alter table public.flaske enable row level security;

drop policy if exists flaske_egen_data on public.flaske;
create policy flaske_egen_data on public.flaske
  for all to authenticated
  using (profil_id = auth.uid()::text)
  with check (profil_id = auth.uid()::text);

grant select, insert, update, delete on table public.flaske to authenticated;
grant all on table public.flaske to service_role;
