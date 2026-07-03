create table if not exists public.coach_tactical_reports (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  match_observed text,
  formation_used text,
  in_possession_shape text,
  out_of_possession_shape text,
  pressing_height text,
  build_up_pattern text,
  defensive_structure text,
  transitions text,
  overall_tactical_score integer,
  notes text,
  created_at timestamptz not null default now(),
  constraint coach_tactical_reports_overall_tactical_score_check
    check (overall_tactical_score is null or (overall_tactical_score between 0 and 100))
);

create table if not exists public.coach_background_checks (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  legal_issues text,
  fa_investigations text,
  misconduct_notes text,
  media_reputation text,
  dressing_room_reputation text,
  board_relationship_history text,
  overall_risk_rating integer,
  last_verified_at timestamptz,
  verified_by text,
  created_at timestamptz not null default now(),
  constraint coach_background_checks_overall_risk_rating_check
    check (overall_risk_rating is null or (overall_risk_rating between 0 and 100))
);

create table if not exists public.coach_references (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  reference_name text not null,
  reference_role text,
  reference_club text,
  contact_details text,
  rating integer,
  summary text,
  created_at timestamptz not null default now(),
  constraint coach_references_rating_check
    check (rating is null or (rating between 0 and 100))
);

create index if not exists coach_tactical_reports_coach_id_idx on public.coach_tactical_reports (coach_id);
create index if not exists coach_background_checks_coach_id_idx on public.coach_background_checks (coach_id);
create index if not exists coach_references_coach_id_idx on public.coach_references (coach_id);

alter table public.coach_tactical_reports enable row level security;
alter table public.coach_background_checks enable row level security;
alter table public.coach_references enable row level security;

drop policy if exists "Users can manage own coach tactical reports" on public.coach_tactical_reports;
create policy "Users can manage own coach tactical reports"
  on public.coach_tactical_reports for all
  using (
    exists (
      select 1
      from public.coaches
      where coaches.id = coach_tactical_reports.coach_id
        and coaches.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.coaches
      where coaches.id = coach_tactical_reports.coach_id
        and coaches.user_id = auth.uid()
    )
  );

drop policy if exists "Users can manage own coach background checks" on public.coach_background_checks;
create policy "Users can manage own coach background checks"
  on public.coach_background_checks for all
  using (
    exists (
      select 1
      from public.coaches
      where coaches.id = coach_background_checks.coach_id
        and coaches.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.coaches
      where coaches.id = coach_background_checks.coach_id
        and coaches.user_id = auth.uid()
    )
  );

drop policy if exists "Users can manage own coach references" on public.coach_references;
create policy "Users can manage own coach references"
  on public.coach_references for all
  using (
    exists (
      select 1
      from public.coaches
      where coaches.id = coach_references.coach_id
        and coaches.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.coaches
      where coaches.id = coach_references.coach_id
        and coaches.user_id = auth.uid()
    )
  );
