-- Add pipeline_stage to mandates for lifecycle Kanban
alter table public.mandates
  add column if not exists pipeline_stage text not null default 'Identified';

-- Optional: constrain to known stages (requires enum or check)
-- For now we rely on app using mandateStages.ts; no DB enum.
