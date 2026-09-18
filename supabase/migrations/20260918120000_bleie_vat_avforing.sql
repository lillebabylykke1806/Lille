-- Multi-select diaper contents: wet and soiled can both be true.
-- Keep legacy `type` text for rollback / old clients.

alter table public.bleie
  add column if not exists vat boolean not null default false;

alter table public.bleie
  add column if not exists avforing boolean not null default false;

comment on column public.bleie.vat is
  'True when the diaper change included wet contents';

comment on column public.bleie.avforing is
  'True when the diaper change included stool. Both vat and avforing may be true. Dry = both false.';

-- Backfill from legacy single-value type
update public.bleie
set
  vat = (type = 'våt'),
  avforing = (type = 'avføring')
where type in ('våt', 'avføring', 'tørr');
