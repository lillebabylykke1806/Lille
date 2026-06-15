-- Align vekt with mat: same profil_id FK target and identical RLS policies.
-- Run in Supabase SQL Editor (requires elevated privileges).

-- Remove vekt rows that cannot satisfy the same profil_id FK as mat.
DELETE FROM public.vekt v
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = v.profil_id
);

-- Mirror mat's profil_id foreign key on vekt.
DO $$
DECLARE
  fk_def text;
BEGIN
  SELECT pg_get_constraintdef(c.oid)
  INTO fk_def
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'mat'
    AND c.conname = 'mat_profil_id_fkey';

  IF fk_def IS NULL THEN
    RAISE EXCEPTION 'mat_profil_id_fkey not found on public.mat';
  END IF;

  ALTER TABLE public.vekt DROP CONSTRAINT IF EXISTS vekt_profil_id_fkey;
  EXECUTE format(
    'ALTER TABLE public.vekt ADD CONSTRAINT vekt_profil_id_fkey %s',
    fk_def
  );
END $$;

-- Mirror mat RLS enabled/disabled state and copy policies verbatim.
DO $$
DECLARE
  mat_rls boolean;
  pol record;
  roles_sql text;
BEGIN
  SELECT c.relrowsecurity
  INTO mat_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'mat';

  EXECUTE format(
    'ALTER TABLE public.vekt %s ROW LEVEL SECURITY',
    CASE WHEN mat_rls THEN 'ENABLE' ELSE 'DISABLE' END
  );

  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'vekt'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.vekt', pol.policyname);
  END LOOP;

  FOR pol IN
    SELECT policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'mat'
  LOOP
    SELECT string_agg(quote_ident(r), ', ')
    INTO roles_sql
    FROM unnest(pol.roles) AS r;

    EXECUTE format(
      'CREATE POLICY %I ON public.vekt AS %s FOR %s TO %s%s%s',
      pol.policyname,
      pol.permissive,
      pol.cmd,
      roles_sql,
      CASE WHEN pol.qual IS NOT NULL THEN format(' USING (%s)', pol.qual) ELSE '' END,
      CASE WHEN pol.with_check IS NOT NULL THEN format(' WITH CHECK (%s)', pol.with_check) ELSE '' END
    );
  END LOOP;
END $$;
