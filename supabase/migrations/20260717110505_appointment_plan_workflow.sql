-- Expand the existing mandate workflow into an accountable appointment plan.
-- Existing mandates and deliverables remain valid and retain their current RLS.

alter table public.mandates
  add column if not exists service_model text not null default 'full_service_search',
  add column if not exists engagement_owner text;

alter table public.mandates
  drop constraint if exists mandates_service_model_check,
  add constraint mandates_service_model_check check (
    service_model in (
      'full_service_search',
      'curated_shortlist',
      'named_coach_diligence',
      'succession_intelligence',
      'confidential_dossier'
    )
  );

alter table public.mandate_deliverables
  add column if not exists category text not null default 'general',
  add column if not exists priority text not null default 'normal',
  add column if not exists assigned_to text,
  add column if not exists linked_coach_id uuid references public.coaches(id) on delete set null,
  add column if not exists notes text,
  add column if not exists blocked_reason text,
  add column if not exists completed_at timestamptz;

alter table public.mandate_deliverables
  drop constraint if exists mandate_deliverables_status_check,
  add constraint mandate_deliverables_status_check check (
    status in ('Not Started', 'In Progress', 'Blocked', 'Completed', 'Cancelled')
  ),
  drop constraint if exists mandate_deliverables_category_check,
  add constraint mandate_deliverables_category_check check (
    category in (
      'brief',
      'market',
      'diligence',
      'assessment',
      'interview_references',
      'feasibility',
      'board',
      'release',
      'commercial',
      'general'
    )
  ),
  drop constraint if exists mandate_deliverables_priority_check,
  add constraint mandate_deliverables_priority_check check (
    priority in ('urgent', 'high', 'normal', 'low')
  ),
  drop constraint if exists mandate_deliverables_blocked_reason_check,
  add constraint mandate_deliverables_blocked_reason_check check (
    status <> 'Blocked' or nullif(btrim(blocked_reason), '') is not null
  );

create index if not exists mandates_service_model_idx
  on public.mandates (service_model, pipeline_stage);

create index if not exists mandate_deliverables_work_queue_idx
  on public.mandate_deliverables (mandate_id, status, due_date);

create index if not exists mandate_deliverables_linked_coach_idx
  on public.mandate_deliverables (linked_coach_id)
  where linked_coach_id is not null;
