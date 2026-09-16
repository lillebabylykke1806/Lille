-- Backup flag for ambassador / synced Pro access (RC is still source of truth for AMBA).
-- Used by redeem-code, partner checks, and getSubscriptionAccess fallback.

alter table public.profiler
  add column if not exists stripe_subscription_status text;

comment on column public.profiler.stripe_subscription_status is
  'active when user has Pro via ambassador grant or synced from store/Stripe checks';

-- Backfill ambassadors who already redeemed AMBA100 successfully
update public.profiler p
set stripe_subscription_status = 'active'
from public.redemptions r
where r.app_user_id = p.id
  and r.code = 'AMBA100'
  and r.status = 'fulfilled'
  and (p.stripe_subscription_status is distinct from 'active');
