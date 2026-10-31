-- Steg 1: aktiverer RLS på tabeller som allerede HAR ferdige regler.
-- Ingen nye regler skrives. Reversibelt med:
--   alter table public.<tabell> disable row level security;
alter table public.mat        enable row level security;
alter table public.pumping    enable row level security;
alter table public.signaler   enable row level security;
alter table public.temperatur enable row level security;
alter table public.vekt       enable row level security;;
