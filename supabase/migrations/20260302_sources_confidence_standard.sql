-- Source and confidence standard: same fields across all intelligence/evidence record types.
-- Idempotent: safe to run multiple times.
-- No placeholders stored; use null for empty.

-- ============================================ A) STANDARD COLUMNS (add if missing) ============================================

-- intelligence_items: already has source_type, source_name, source_link, confidence. Add source_notes, verified*.
alter table public.intelligence_items add column if not exists source_notes text;
alter table public.intelligence_items add column if not exists verified boolean not null default false;
alter table public.intelligence_items add column if not exists verified_at timestamptz null;
alter table public.intelligence_items add column if not exists verified_by text null;

-- coach_stints
alter table public.coach_stints add column if not exists source_type text null;
alter table public.coach_stints add column if not exists source_name text null;
alter table public.coach_stints add column if not exists source_link text null;
alter table public.coach_stints add column if not exists source_notes text null;
alter table public.coach_stints add column if not exists confidence integer null;
alter table public.coach_stints add column if not exists verified boolean not null default false;
alter table public.coach_stints add column if not exists verified_at timestamptz null;
alter table public.coach_stints add column if not exists verified_by text null;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'coach_stints_confidence_check') then
    alter table public.coach_stints add constraint coach_stints_confidence_check check (confidence is null or (confidence between 0 and 100));
  end if;
end $$;

-- coach_staff_history (staff network / team members)
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

-- coach_recruitment_history (recruitment signings)
alter table public.coach_recruitment_history add column if not exists source_type text null;
alter table public.coach_recruitment_history add column if not exists source_name text null;
alter table public.coach_recruitment_history add column if not exists source_link text null;
alter table public.coach_recruitment_history add column if not exists source_notes text null;
alter table public.coach_recruitment_history add column if not exists confidence integer null;
alter table public.coach_recruitment_history add column if not exists verified boolean not null default false;
alter table public.coach_recruitment_history add column if not exists verified_at timestamptz null;
alter table public.coach_recruitment_history add column if not exists verified_by text null;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'coach_recruitment_history_confidence_check') then
    alter table public.coach_recruitment_history add constraint coach_recruitment_history_confidence_check check (confidence is null or (confidence between 0 and 100));
  end if;
end $$;

-- coach_media_events: already has confidence. Add source_type, source_name, source_link, source_notes, verified*.
alter table public.coach_media_events add column if not exists source_type text null;
alter table public.coach_media_events add column if not exists source_name text null;
alter table public.coach_media_events add column if not exists source_link text null;
alter table public.coach_media_events add column if not exists source_notes text null;
alter table public.coach_media_events add column if not exists verified boolean not null default false;
alter table public.coach_media_events add column if not exists verified_at timestamptz null;
alter table public.coach_media_events add column if not exists verified_by text null;

-- coach_due_diligence_items: new table for due diligence items per coach
create table if not exists public.coach_due_diligence_items (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  title text not null,
  detail text null,
  source_type text null,
  source_name text null,
  source_link text null,
  source_notes text null,
  confidence integer null,
  verified boolean not null default false,
  verified_at timestamptz null,
  verified_by text null,
  created_at timestamptz default now() not null,
  constraint coach_due_diligence_items_confidence_check check (confidence is null or (confidence between 0 and 100))
);
create index if not exists coach_due_diligence_items_coach_id_idx on public.coach_due_diligence_items (coach_id);

alter table public.coach_due_diligence_items enable row level security;
drop policy if exists "Users can manage coach_due_diligence_items for own coaches" on public.coach_due_diligence_items;
create policy "Users can manage coach_due_diligence_items for own coaches" on public.coach_due_diligence_items for all
  using (exists (select 1 from public.coaches c where c.id = coach_due_diligence_items.coach_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.coaches c where c.id = coach_due_diligence_items.coach_id and c.user_id = auth.uid()));

-- ============================================ B) EVIDENCE_ITEMS (generic, futureproofing) ============================================
create table if not exists public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  category text null,
  title text not null,
  detail text null,
  occurred_at timestamptz null,
  source_type text null,
  source_name text null,
  source_link text null,
  source_notes text null,
  confidence integer null,
  verified boolean not null default false,
  verified_at timestamptz null,
  verified_by text null,
  created_at timestamptz default now() not null,
  constraint evidence_items_confidence_check check (confidence is null or (confidence between 0 and 100))
);

create index if not exists evidence_items_entity_idx on public.evidence_items (entity_type, entity_id);
create index if not exists evidence_items_occurred_at_idx on public.evidence_items (occurred_at desc);

alter table public.evidence_items enable row level security;
drop policy if exists "Users can manage own evidence_items" on public.evidence_items;
create policy "Users can manage own evidence_items" on public.evidence_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Realtime (optional)
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'coach_due_diligence_items') then
    alter publication supabase_realtime add table public.coach_due_diligence_items;
  end if;
end
$$;
