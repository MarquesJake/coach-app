-- Coach Portal: self-supplied coach profile depth.
--
-- This is the supply-side layer of the platform. The core public/internal coach
-- row stays in public.coaches; this table stores what a coach or representative
-- would provide through their own portal before Coach First verifies and uses it
-- in intelligence workflows and Head Coach Assessment Packs.

create table if not exists public.coach_portal_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  portal_status text not null default 'not_invited',
  visibility_status text not null default 'private',
  coach_email text,
  coach_phone text,
  representative_name text,
  representative_email text,
  base_location text,
  preferred_contact_method text,
  short_bio text,
  personal_statement text,
  football_identity text,
  in_possession_model text,
  out_of_possession_model text,
  transition_model text,
  set_piece_model text,
  training_week text,
  session_design_principles text,
  player_development_proof text,
  academy_integration text,
  recruitment_preferences text,
  staff_network text,
  key_staff_likely_to_follow text,
  presentation_summary text,
  video_summary text,
  media_and_communication text,
  reference_permissions text,
  sensitive_notes text,
  release_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coach_portal_profiles_unique unique (coach_id),
  constraint coach_portal_profiles_status_check check (portal_status in (
    'not_invited', 'invited', 'in_progress', 'submitted', 'in_review', 'approved', 'needs_update'
  )),
  constraint coach_portal_profiles_visibility_check check (visibility_status in (
    'private', 'coach_first_only', 'clubs_on_request', 'shareable'
  ))
);

create index if not exists coach_portal_profiles_user_status_idx
  on public.coach_portal_profiles (user_id, portal_status);

alter table public.coach_portal_profiles enable row level security;

create policy "Users can view own coach portal profiles"
  on public.coach_portal_profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own coach portal profiles"
  on public.coach_portal_profiles for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.coaches c
      where c.id = coach_id and c.user_id = (select auth.uid())
    )
  );

create policy "Users can update own coach portal profiles"
  on public.coach_portal_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.coaches c
      where c.id = coach_id and c.user_id = (select auth.uid())
    )
  );

create policy "Users can delete own coach portal profiles"
  on public.coach_portal_profiles for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.coach_portal_profiles to authenticated;
