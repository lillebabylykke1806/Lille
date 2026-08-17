-- Lagre som "Kode-oversikt" i Supabase SQL Editor (Saved queries)
select
  dc.code,
  dc.type,
  count(r.id) filter (where r.status = 'fulfilled') as antall_innløst,
  dc.max_redemptions
from discount_codes dc
left join redemptions r on r.code = dc.code
group by dc.code, dc.type, dc.max_redemptions
order by antall_innløst desc;
