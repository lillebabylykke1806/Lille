alter table public.profiler
  add column if not exists vilkaar_godtatt_tid    timestamptz,
  add column if not exists vilkaar_versjon        text,
  add column if not exists personvern_godtatt_tid timestamptz,
  add column if not exists personvern_versjon     text,
  add column if not exists markedsforing_samtykke boolean default false;;
