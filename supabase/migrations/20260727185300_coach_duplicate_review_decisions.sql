create table if not exists public.coach_duplicate_reviews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  coach_a_id uuid not null references public.coaches(id) on delete cascade,
  coach_b_id uuid not null references public.coaches(id) on delete cascade,
  decision text not null check (decision in ('keep_separate', 'canonical_selected')),
  canonical_coach_id uuid references public.coaches(id) on delete set null,
  reason text not null,
  review_note text,
  reviewed_by uuid not null references auth.users(id) on delete restrict,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coach_duplicate_reviews_distinct_pair_check check (coach_a_id < coach_b_id),
  constraint coach_duplicate_reviews_canonical_check check (
    (decision = 'keep_separate' and canonical_coach_id is null)
    or
    (
      decision = 'canonical_selected'
      and canonical_coach_id is not null
      and canonical_coach_id in (coach_a_id, coach_b_id)
    )
  ),
  unique (org_id, coach_a_id, coach_b_id)
);

create index if not exists coach_duplicate_reviews_org_decision_idx
  on public.coach_duplicate_reviews (org_id, decision, reviewed_at desc);
create index if not exists coach_duplicate_reviews_coach_a_idx
  on public.coach_duplicate_reviews (coach_a_id);
create index if not exists coach_duplicate_reviews_coach_b_idx
  on public.coach_duplicate_reviews (coach_b_id);
create index if not exists coach_duplicate_reviews_canonical_idx
  on public.coach_duplicate_reviews (canonical_coach_id)
  where canonical_coach_id is not null;

alter table public.coach_duplicate_reviews enable row level security;

drop policy if exists "Internal members can view coach duplicate reviews"
  on public.coach_duplicate_reviews;
create policy "Internal members can view coach duplicate reviews"
  on public.coach_duplicate_reviews
  for select
  to authenticated
  using (
    public.is_organization_member(org_id, array['owner', 'admin', 'analyst'])
  );

drop policy if exists "Internal members can create coach duplicate reviews"
  on public.coach_duplicate_reviews;
create policy "Internal members can create coach duplicate reviews"
  on public.coach_duplicate_reviews
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and reviewed_by = (select auth.uid())
    and public.is_organization_member(org_id, array['owner', 'admin', 'analyst'])
  );

drop policy if exists "Internal members can update coach duplicate reviews"
  on public.coach_duplicate_reviews;
create policy "Internal members can update coach duplicate reviews"
  on public.coach_duplicate_reviews
  for update
  to authenticated
  using (
    public.is_organization_member(org_id, array['owner', 'admin', 'analyst'])
  )
  with check (
    reviewed_by = (select auth.uid())
    and public.is_organization_member(org_id, array['owner', 'admin', 'analyst'])
  );

revoke all on public.coach_duplicate_reviews from anon, authenticated;
grant select, insert, update on public.coach_duplicate_reviews to authenticated;

comment on table public.coach_duplicate_reviews is
  'Non-destructive analyst decisions for potential duplicate coach records. Canonical selection does not merge or delete source rows.';
