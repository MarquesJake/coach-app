BEGIN;

CREATE TABLE IF NOT EXISTS public.coach_data_profiles (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  avg_squad_age numeric null,
  avg_starting_xi_age numeric null,
  minutes_u21 numeric null,
  minutes_21_24 numeric null,
  minutes_25_28 numeric null,
  minutes_29_plus numeric null,
  recruitment_avg_age numeric null,
  recruitment_repeat_player_count integer null,
  recruitment_repeat_agent_count integer null,
  media_pressure_score integer null,
  media_accountability_score integer null,
  media_confrontation_score integer null,
  social_presence_level text null,
  narrative_risk_summary text null,
  confidence_score integer null,
  created_at timestamptz not null default now(),
  unique (coach_id)
);

CREATE INDEX IF NOT EXISTS coach_data_profiles_coach_id_idx ON public.coach_data_profiles(coach_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coach_data_profiles_confidence_score_check'
  ) THEN
    ALTER TABLE public.coach_data_profiles
      ADD CONSTRAINT coach_data_profiles_confidence_score_check
      CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100));
  END IF;
END
$$;

ALTER TABLE public.coach_data_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coach_data_profiles_select ON public.coach_data_profiles;
CREATE POLICY coach_data_profiles_select ON public.coach_data_profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.coaches c
    WHERE c.id = coach_data_profiles.coach_id
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS coach_data_profiles_insert ON public.coach_data_profiles;
CREATE POLICY coach_data_profiles_insert ON public.coach_data_profiles
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.coaches c
    WHERE c.id = coach_data_profiles.coach_id
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS coach_data_profiles_update ON public.coach_data_profiles;
CREATE POLICY coach_data_profiles_update ON public.coach_data_profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.coaches c
    WHERE c.id = coach_data_profiles.coach_id
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS coach_data_profiles_delete ON public.coach_data_profiles;
CREATE POLICY coach_data_profiles_delete ON public.coach_data_profiles
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.coaches c
    WHERE c.id = coach_data_profiles.coach_id
      AND c.user_id = auth.uid()
  )
);

COMMIT;

