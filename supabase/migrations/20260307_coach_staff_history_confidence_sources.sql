-- Ensure coach_staff_history has confidence and source/verified columns used by the app.
-- Fixes "Could not find the confidence column of 'coach_staff_history' in the schema cache"
-- when migration 20260302 was not applied or schema cache is stale.
-- Idempotent: safe to run multiple times.

alter table public.coach_staff_history add column if not exists source_type text null;
alter table public.coach_staff_history add column if not exists source_name text null;
alter table public.coach_staff_history add column if not exists source_link text null;
alter table public.coach_staff_history add column if not exists source_notes text null;
alter table public.coach_staff_history add column if not exists confidence integer null;
alter table public.coach_staff_history add column if not exists verified boolean not null default false;
alter table public.coach_staff_history add column if not exists verified_at timestamptz null;
alter table public.coach_staff_history add column if not exists verified_by text null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'coach_staff_history_confidence_check') then
    alter table public.coach_staff_history add constraint coach_staff_history_confidence_check check (confidence is null or (confidence between 0 and 100));
  end if;
end $$;
