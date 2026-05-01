BEGIN;

CREATE TABLE IF NOT EXISTS public.coach_external_profiles (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  api_coach_id text null,
  full_name text null,
  first_name text null,
  last_name text null,
  nationality text null,
  birth_date date null,
  birth_place text null,
  birth_country text null,
  height text null,
  weight text null,
  photo_url text null,
  current_team_name text null,
  profile_payload jsonb null,
  source_name text not null default 'API-Football',
  source_link text null,
  confidence integer null,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id),
  unique (coach_id, api_coach_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'coach_external_profiles_confidence_range_check'
  ) THEN
    ALTER TABLE public.coach_external_profiles
      ADD CONSTRAINT coach_external_profiles_confidence_range_check
      CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 100));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS coach_external_profiles_coach_id_idx on public.coach_external_profiles(coach_id);
CREATE INDEX IF NOT EXISTS coach_external_profiles_api_coach_id_idx on public.coach_external_profiles(api_coach_id);

ALTER TABLE public.coach_external_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coach_external_profiles_select on public.coach_external_profiles;
CREATE POLICY coach_external_profiles_select on public.coach_external_profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.coaches c
    WHERE c.id = coach_external_profiles.coach_id
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS coach_external_profiles_insert on public.coach_external_profiles;
CREATE POLICY coach_external_profiles_insert on public.coach_external_profiles
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.coaches c
    WHERE c.id = coach_external_profiles.coach_id
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS coach_external_profiles_update on public.coach_external_profiles;
CREATE POLICY coach_external_profiles_update on public.coach_external_profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.coaches c
    WHERE c.id = coach_external_profiles.coach_id
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS coach_external_profiles_delete on public.coach_external_profiles;
CREATE POLICY coach_external_profiles_delete on public.coach_external_profiles
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.coaches c
    WHERE c.id = coach_external_profiles.coach_id
      AND c.user_id = auth.uid()
  )
);

COMMIT;

