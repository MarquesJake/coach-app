-- Add mandate workflow tables, coach scoring columns, and user-scoped RLS.

create extension if not exists "pgcrypto";

create extension if not exists "uuid-ossp";

alter table public.coaches
  add column if not exists placement_score integer,
  add column if not exists board_compatibility integer,
  add column if not exists ownership_fit integer,
  add column if not exists cultural_risk integer,
  add column if not exists agent_relationship integer,
  add column if not exists media_risk integer,
  add column if not exists overall_fit integer,
  add column if not exists tactical_fit integer,
  add column if not exists financial_feasibility integer;

alter table public.coaches drop constraint if exists coaches_placement_score_check;
alter table public.coaches drop constraint if exists coaches_board_compatibility_check;
alter table public.coaches drop constraint if exists coaches_ownership_fit_check;
alter table public.coaches drop constraint if exists coaches_cultural_risk_check;
alter table public.coaches drop constraint if exists coaches_agent_relationship_check;
alter table public.coaches drop constraint if exists coaches_media_risk_check;
alter table public.coaches drop constraint if exists coaches_overall_fit_check;
alter table public.coaches drop constraint if exists coaches_tactical_fit_check;
alter table public.coaches drop constraint if exists coaches_financial_feasibility_check;

alter table public.coaches
  add constraint coaches_placement_score_check check (placement_score is null or (placement_score between 0 and 100)),
  add constraint coaches_board_compatibility_check check (board_compatibility is null or (board_compatibility between 0 and 100)),
  add constraint coaches_ownership_fit_check check (ownership_fit is null or (ownership_fit between 0 and 100)),
  add constraint coaches_cultural_risk_check check (cultural_risk is null or (cultural_risk between 0 and 100)),
  add constraint coaches_agent_relationship_check check (agent_relationship is null or (agent_relationship between 0 and 100)),
  add constraint coaches_media_risk_check check (media_risk is null or (media_risk between 0 and 100)),
  add constraint coaches_overall_fit_check check (overall_fit is null or (overall_fit between 0 and 100)),
  add constraint coaches_tactical_fit_check check (tactical_fit is null or (tactical_fit between 0 and 100)),
  add constraint coaches_financial_feasibility_check check (financial_feasibility is null or (financial_feasibility between 0 and 100));

alter table public.coach_updates
  add column if not exists occurred_at timestamptz,
  add column if not exists confidence text,
  add column if not exists source_tier text,
  add column if not exists source_note text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'coach_updates'
      and column_name = 'date_added'
  ) then
    execute 'update public.coach_updates set occurred_at = coalesce(occurred_at, date_added)';
  end if;
end $$;

alter table public.coach_updates alter column occurred_at set default now();

create table if not exists public.mandates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  status text not null,
  engagement_date date not null,
  target_completion_date date not null,
  priority text not null,
  ownership_structure text not null,
  budget_band text not null,
  strategic_objective text not null,
  board_risk_appetite text not null,
  succession_timeline text not null,
  key_stakeholders text[] not null default '{}'::text[],
  confidentiality_level text not null default 'Standard',
  created_at timestamptz not null default now(),
  constraint mandates_status_check check (status in ('Active', 'In Progress', 'Completed', 'On Hold')),
  constraint mandates_priority_check check (priority in ('High', 'Medium', 'Low')),
  constraint mandates_board_risk_appetite_check check (board_risk_appetite in ('Conservative', 'Moderate', 'Aggressive')),
  constraint mandates_confidentiality_level_check check (confidentiality_level in ('Standard', 'High', 'Board Only'))
);

create index if not exists mandates_user_id_idx on public.mandates (user_id);
create index if not exists mandates_club_id_idx on public.mandates (club_id);
create index if not exists mandates_target_completion_idx on public.mandates (target_completion_date);

create table if not exists public.mandate_shortlist (
  id uuid primary key default gen_random_uuid(),
  mandate_id uuid not null references public.mandates(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  placement_probability integer not null,
  risk_rating text not null,
  status text not null,
  created_at timestamptz not null default now(),
  constraint mandate_shortlist_probability_check check (placement_probability between 0 and 100),
  constraint mandate_shortlist_risk_rating_check check (risk_rating in ('Low', 'Medium', 'High')),
  constraint mandate_shortlist_status_check check (status in ('Under Review', 'Shortlisted', 'In Negotiations', 'Declined')),
  constraint mandate_shortlist_unique unique (mandate_id, coach_id)
);

create index if not exists mandate_shortlist_mandate_id_idx on public.mandate_shortlist (mandate_id);
create index if not exists mandate_shortlist_coach_id_idx on public.mandate_shortlist (coach_id);

create table if not exists public.mandate_deliverables (
  id uuid primary key default gen_random_uuid(),
  mandate_id uuid not null references public.mandates(id) on delete cascade,
  item text not null,
  due_date date not null,
  status text not null,
  created_at timestamptz not null default now(),
  constraint mandate_deliverables_status_check check (status in ('Not Started', 'In Progress', 'Completed'))
);

create index if not exists mandate_deliverables_mandate_id_idx on public.mandate_deliverables (mandate_id);
create index if not exists mandate_deliverables_due_date_idx on public.mandate_deliverables (due_date);

alter table public.mandates enable row level security;
alter table public.mandate_shortlist enable row level security;
alter table public.mandate_deliverables enable row level security;

drop policy if exists "Users can view own mandates" on public.mandates;
create policy "Users can view own mandates"
  on public.mandates for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own mandates" on public.mandates;
create policy "Users can insert own mandates"
  on public.mandates for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.clubs c
      where c.id = club_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update own mandates" on public.mandates;
create policy "Users can update own mandates"
  on public.mandates for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.clubs c
      where c.id = club_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own mandates" on public.mandates;
create policy "Users can delete own mandates"
  on public.mandates for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view shortlist for own mandates" on public.mandate_shortlist;
create policy "Users can view shortlist for own mandates"
  on public.mandate_shortlist for select
  using (
    exists (
      select 1
      from public.mandates m
      where m.id = mandate_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert shortlist for own mandates" on public.mandate_shortlist;
create policy "Users can insert shortlist for own mandates"
  on public.mandate_shortlist for insert
  with check (
    exists (
      select 1
      from public.mandates m
      where m.id = mandate_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update shortlist for own mandates" on public.mandate_shortlist;
create policy "Users can update shortlist for own mandates"
  on public.mandate_shortlist for update
  using (
    exists (
      select 1
      from public.mandates m
      where m.id = mandate_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.mandates m
      where m.id = mandate_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete shortlist for own mandates" on public.mandate_shortlist;
create policy "Users can delete shortlist for own mandates"
  on public.mandate_shortlist for delete
  using (
    exists (
      select 1
      from public.mandates m
      where m.id = mandate_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "Users can view deliverables for own mandates" on public.mandate_deliverables;
create policy "Users can view deliverables for own mandates"
  on public.mandate_deliverables for select
  using (
    exists (
      select 1
      from public.mandates m
      where m.id = mandate_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert deliverables for own mandates" on public.mandate_deliverables;
create policy "Users can insert deliverables for own mandates"
  on public.mandate_deliverables for insert
  with check (
    exists (
      select 1
      from public.mandates m
      where m.id = mandate_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update deliverables for own mandates" on public.mandate_deliverables;
create policy "Users can update deliverables for own mandates"
  on public.mandate_deliverables for update
  using (
    exists (
      select 1
      from public.mandates m
      where m.id = mandate_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.mandates m
      where m.id = mandate_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete deliverables for own mandates" on public.mandate_deliverables;
create policy "Users can delete deliverables for own mandates"
  on public.mandate_deliverables for delete
  using (
    exists (
      select 1
      from public.mandates m
      where m.id = mandate_id
        and m.user_id = auth.uid()
    )
  );
