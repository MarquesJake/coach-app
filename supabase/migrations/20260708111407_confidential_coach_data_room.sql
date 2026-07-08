-- Confidential coach data room.
--
-- This is the private-material layer behind the Head Coach Assessment Pack:
-- coach presentations, training sessions, methodology, video, and analyst-held
-- material can be logged against the coach, while a mandate-candidate can raise
-- a controlled access request before those materials are shared with a club.

create table if not exists public.coach_private_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  title text not null,
  material_type text not null default 'other',
  description text,
  external_url text,
  storage_path text,
  source_label text,
  uploaded_by text not null default 'analyst',
  confidentiality_status text not null default 'available',
  verification_status text not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coach_private_materials_type_check check (material_type in (
    'presentation', 'training_video', 'match_video', 'methodology',
    'analysis', 'media', 'reference_pack', 'other'
  )),
  constraint coach_private_materials_uploaded_by_check check (uploaded_by in (
    'coach', 'analyst', 'agent', 'club', 'unknown'
  )),
  constraint coach_private_materials_confidentiality_check check (confidentiality_status in (
    'available', 'requested', 'missing', 'withheld'
  )),
  constraint coach_private_materials_verification_check check (verification_status in (
    'unverified', 'verified', 'disputed'
  )),
  constraint coach_private_materials_location_check check (
    external_url is not null or storage_path is not null or description is not null
  )
);

create table if not exists public.confidential_access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mandate_id uuid not null references public.mandates(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  requested_by text,
  requester_role text,
  club_context text,
  request_reason text not null,
  status text not null default 'requested',
  internal_notes text,
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint confidential_access_requests_status_check check (status in (
    'draft', 'requested', 'approved', 'shared', 'declined', 'withdrawn'
  ))
);

create index if not exists coach_private_materials_coach_idx
  on public.coach_private_materials (coach_id, created_at desc);

create index if not exists confidential_access_requests_mandate_coach_idx
  on public.confidential_access_requests (mandate_id, coach_id, requested_at desc);

alter table public.coach_private_materials enable row level security;
alter table public.confidential_access_requests enable row level security;

create policy "Users can view own coach private materials"
  on public.coach_private_materials for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own coach private materials"
  on public.coach_private_materials for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.coaches c
      where c.id = coach_id and c.user_id = (select auth.uid())
    )
  );

create policy "Users can update own coach private materials"
  on public.coach_private_materials for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.coaches c
      where c.id = coach_id and c.user_id = (select auth.uid())
    )
  );

create policy "Users can delete own coach private materials"
  on public.coach_private_materials for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view own confidential access requests"
  on public.confidential_access_requests for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own confidential access requests"
  on public.confidential_access_requests for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.mandates m
      where m.id = mandate_id and m.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.coaches c
      where c.id = coach_id and c.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.mandate_shortlist ms
      where ms.mandate_id = confidential_access_requests.mandate_id
        and ms.coach_id = confidential_access_requests.coach_id
    )
  );

create policy "Users can update own confidential access requests"
  on public.confidential_access_requests for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.mandates m
      where m.id = mandate_id and m.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.coaches c
      where c.id = coach_id and c.user_id = (select auth.uid())
    )
  );

create policy "Users can delete own confidential access requests"
  on public.confidential_access_requests for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.coach_private_materials to authenticated;
grant select, insert, update, delete on public.confidential_access_requests to authenticated;
