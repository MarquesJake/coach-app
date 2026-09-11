-- The original schema used a different policy name from the ownership migration.
-- PostgreSQL ORs permissive policies, so this leftover bypasses corpus isolation.
drop policy if exists "Authenticated users can view coaches" on public.coaches;
drop policy if exists "Authenticated users can view coach updates" on public.coach_updates;
