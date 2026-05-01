BEGIN;

ALTER TABLE public.coach_stints
  ADD COLUMN IF NOT EXISTS source_type text null,
  ADD COLUMN IF NOT EXISTS source_name text null,
  ADD COLUMN IF NOT EXISTS source_link text null,
  ADD COLUMN IF NOT EXISTS source_notes text null,
  ADD COLUMN IF NOT EXISTS confidence integer null,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz null,
  ADD COLUMN IF NOT EXISTS verified_by uuid null;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'coach_stints_confidence_range_check'
  ) THEN
    ALTER TABLE public.coach_stints
      ADD CONSTRAINT coach_stints_confidence_range_check
      CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 100));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS coach_stints_coach_id_idx ON public.coach_stints(coach_id);
CREATE INDEX IF NOT EXISTS coach_stints_confidence_idx ON public.coach_stints(confidence);

COMMIT;

