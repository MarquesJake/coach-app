-- Coach career circumstances and proposed appointment staff package.
--
-- Coach/representative declarations stay in the portal layer until an internal
-- analyst explicitly verifies them. Only then are the agreed fields copied to
-- the canonical coach record used by mandate assessments and board packs.

alter table public.coaches
  add column if not exists current_salary text,
  add column if not exists availability_timeline text,
  add column if not exists appointment_conditions text,
  add column if not exists feasibility_reviewed_at timestamptz,
  add column if not exists feasibility_reviewed_by uuid references auth.users(id) on delete set null;

alter table public.coach_portal_profiles
  add column if not exists current_salary text,
  add column if not exists salary_expectation text,
  add column if not exists contract_expiry date,
  add column if not exists release_compensation text,
  add column if not exists availability_timeline text,
  add column if not exists family_situation text,
  add column if not exists relocation_requirements text,
  add column if not exists staff_cost_expectation text,
  add column if not exists appointment_conditions text,
  add column if not exists circumstances_visibility text not null default 'coach_first_only',
  add column if not exists feasibility_review_status text not null default 'draft',
  add column if not exists feasibility_reviewed_at timestamptz,
  add column if not exists feasibility_reviewed_by uuid references auth.users(id) on delete set null;

alter table public.coach_portal_profiles
  drop constraint if exists coach_portal_profiles_circumstances_visibility_check,
  add constraint coach_portal_profiles_circumstances_visibility_check check (
    circumstances_visibility in ('coach_first_only', 'clubs_on_request', 'shareable')
  ),
  drop constraint if exists coach_portal_profiles_feasibility_review_status_check,
  add constraint coach_portal_profiles_feasibility_review_status_check check (
    feasibility_review_status in ('draft', 'submitted', 'in_review', 'verified', 'needs_update')
  );

create index if not exists coach_portal_profiles_feasibility_review_idx
  on public.coach_portal_profiles (user_id, feasibility_review_status, updated_at desc);
create index if not exists coach_portal_profiles_feasibility_reviewer_idx
  on public.coach_portal_profiles (feasibility_reviewed_by)
  where feasibility_reviewed_by is not null;
create index if not exists coaches_feasibility_reviewer_idx
  on public.coaches (feasibility_reviewed_by)
  where feasibility_reviewed_by is not null;

create table if not exists public.coach_portal_staff_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  full_name text not null,
  role_title text not null,
  current_club text,
  relationship_context text,
  essentiality text not null default 'preferred' check (
    essentiality in ('essential', 'preferred', 'optional')
  ),
  likely_to_follow text not null default 'unknown' check (
    likely_to_follow in ('yes', 'no', 'unknown')
  ),
  availability text,
  current_salary text,
  expected_salary text,
  compensation_terms text,
  relocation_notes text,
  confidentiality_status text not null default 'coach_first_only' check (
    confidentiality_status in ('coach_first_only', 'clubs_on_request', 'shareable')
  ),
  review_status text not null default 'unreviewed' check (
    review_status in ('unreviewed', 'verified', 'disputed')
  ),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coach_portal_staff_members_coach_idx
  on public.coach_portal_staff_members (coach_id, essentiality, created_at);
create index if not exists coach_portal_staff_members_user_review_idx
  on public.coach_portal_staff_members (user_id, review_status, updated_at desc);
create index if not exists coach_portal_staff_members_reviewer_idx
  on public.coach_portal_staff_members (reviewed_by)
  where reviewed_by is not null;

alter table public.coach_portal_staff_members enable row level security;

create policy "Users can view own coach portal staff"
  on public.coach_portal_staff_members for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.coaches coach
      where coach.id = coach_id
        and coach.user_id = (select auth.uid())
    )
  );

create policy "Users can insert own coach portal staff"
  on public.coach_portal_staff_members for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.coaches coach
      where coach.id = coach_id
        and coach.user_id = (select auth.uid())
    )
  );

create policy "Users can update own coach portal staff"
  on public.coach_portal_staff_members for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.coaches coach
      where coach.id = coach_id
        and coach.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.coaches coach
      where coach.id = coach_id
        and coach.user_id = (select auth.uid())
    )
  );

create policy "Users can delete own coach portal staff"
  on public.coach_portal_staff_members for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.coaches coach
      where coach.id = coach_id
        and coach.user_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on public.coach_portal_staff_members to authenticated;

create or replace function public.verify_coach_career_circumstances(p_coach_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  portal public.coach_portal_profiles%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  select *
  into portal
  from public.coach_portal_profiles
  where coach_id = p_coach_id
    and user_id = (select auth.uid());

  if portal.id is null then
    raise exception 'Coach circumstances were not found';
  end if;

  update public.coaches
  set
    current_salary = portal.current_salary,
    wage_expectation = coalesce(portal.salary_expectation, ''),
    contract_expiry = portal.contract_expiry,
    compensation_expectation = portal.release_compensation,
    availability_timeline = portal.availability_timeline,
    family_context = portal.family_situation,
    relocation_flexibility = portal.relocation_requirements,
    staff_cost_estimate = coalesce(portal.staff_cost_expectation, ''),
    appointment_conditions = portal.appointment_conditions,
    feasibility_reviewed_at = now(),
    feasibility_reviewed_by = (select auth.uid()),
    last_updated = now(),
    updated_at = now()
  where id = p_coach_id
    and user_id = (select auth.uid());

  if not found then
    raise exception 'Coach not found';
  end if;

  update public.coach_portal_profiles
  set
    feasibility_review_status = 'verified',
    feasibility_reviewed_at = now(),
    feasibility_reviewed_by = (select auth.uid()),
    updated_at = now()
  where id = portal.id
    and user_id = (select auth.uid());

  return true;
end;
$$;

revoke all on function public.verify_coach_career_circumstances(uuid) from public;
revoke all on function public.verify_coach_career_circumstances(uuid) from anon;
grant execute on function public.verify_coach_career_circumstances(uuid) to authenticated;

comment on column public.coach_portal_profiles.current_salary is
  'Coach/representative-declared current or most recent salary context. Not club-facing until analyst verification.';
comment on column public.coach_portal_profiles.release_compensation is
  'Coach/representative-declared release clause or estimated compensation payable to the current club.';
comment on table public.coach_portal_staff_members is
  'Coach-submitted proposed appointment staff package, held separately from independently researched staff history.';
