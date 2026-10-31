-- Legger til reservefelt for abonnementsstatus.
-- Rein tilleggsendring: ingenting overskrives eller slettes.
alter table public.profiler
  add column if not exists stripe_subscription_status text;

-- Backfill: ambassadører med fullført AMBA100 markeres som aktive
update public.profiler p
set stripe_subscription_status = 'active'
where p.stripe_subscription_status is null
  and exists (
    select 1 from public.redemptions r
    where r.app_user_id::text = p.id
      and r.code = 'AMBA100'
      and r.status = 'fulfilled'
  );;
