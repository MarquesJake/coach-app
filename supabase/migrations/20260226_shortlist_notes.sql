-- Add notes to mandate_shortlist for per-row free text
ALTER TABLE public.mandate_shortlist
ADD COLUMN IF NOT EXISTS notes text;

COMMENT ON COLUMN public.mandate_shortlist.notes IS 'Free text notes for this shortlist entry';
