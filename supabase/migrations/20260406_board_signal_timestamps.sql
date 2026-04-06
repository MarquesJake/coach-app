-- Board signal timestamps
-- Adds scored_at to mandate_longlist and updated_at + trigger to mandates
-- Apply when Supabase MCP permissions are restored

-- Add scored_at to mandate_longlist (set explicitly when scoring runs)
ALTER TABLE public.mandate_longlist
  ADD COLUMN IF NOT EXISTS scored_at timestamptz DEFAULT now();

-- Backfill existing rows
UPDATE public.mandate_longlist SET scored_at = created_at WHERE scored_at IS NULL;

-- Add updated_at to mandates
ALTER TABLE public.mandates
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger on mandates
DROP TRIGGER IF EXISTS mandates_set_updated_at ON public.mandates;
CREATE TRIGGER mandates_set_updated_at
  BEFORE UPDATE ON public.mandates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
