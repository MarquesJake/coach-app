-- Real coach identity and coach-owned material intake.
--
-- The analyst-owned coach record remains the system of record. Coach accounts
-- receive a tightly-scoped route into their own portal profile and material
-- library; they never receive access to independent intelligence, assessment
-- conclusions, source identities, or club decision rooms.

alter table public.organizations
  add column if not exists coach_id uuid references public.coaches(id) on delete set null;

alter table public.agents
  add column if not exists football_contact_id uuid references public.football_contacts(id) on delete set null;

create unique index if not exists agents_football_contact_unique_idx
  on public.agents (football_contact_id)
  where football_contact_id is not null;

create unique index if not exists organizations_active_coach_business_idx
  on public.organizations (coach_id)
  where organization_type = 'coach_business' and status = 'active' and coach_id is not null;

alter table public.organizations
  drop constraint if exists organizations_coach_business_link_check,
  add constraint organizations_coach_business_link_check check (
    (organization_type = 'coach_business' and coach_id is not null and club_id is null)
    or (organization_type <> 'coach_business' and coach_id is null)
  );

create table if not exists public.coach_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  email text not null check (email = lower(trim(email)) and position('@' in email) > 1),
  role text not null check (role in ('coach', 'coach_representative')),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending' check (status in ('pending', 'claimed', 'revoked')),
  invited_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz not null,
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > created_at),
  check ((status = 'claimed') = (claimed_by is not null and claimed_at is not null)),
  check ((status = 'revoked') = (revoked_at is not null))
);

create table if not exists public.coach_access_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  invitation_id uuid references public.coach_invitations(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in (
    'invite_issued', 'invite_claimed', 'invite_revoked', 'coach_first_login'
  )),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists coach_invitations_coach_status_idx
  on public.coach_invitations (coach_id, status, created_at desc);
create index if not exists coach_invitations_email_status_idx
  on public.coach_invitations (email, status);
create index if not exists coach_invitations_invited_by_idx
  on public.coach_invitations (invited_by);
create index if not exists coach_invitations_claimed_by_idx
  on public.coach_invitations (claimed_by) where claimed_by is not null;
create index if not exists coach_access_events_coach_time_idx
  on public.coach_access_events (coach_id, occurred_at desc);
create index if not exists coach_access_events_invitation_idx
  on public.coach_access_events (invitation_id) where invitation_id is not null;
create unique index if not exists coach_access_events_first_login_idx
  on public.coach_access_events (organization_id, target_user_id)
  where event_type = 'coach_first_login';

create or replace function public.is_coach_portal_member(
  target_coach_id uuid,
  allowed_roles text[] default array['coach', 'coach_representative']::text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    join public.organizations organization on organization.id = membership.organization_id
    where membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and membership.role = any (allowed_roles)
      and organization.organization_type = 'coach_business'
      and organization.status = 'active'
      and organization.coach_id = target_coach_id
  );
$$;

revoke all on function public.is_coach_portal_member(uuid, text[]) from public;
revoke all on function public.is_coach_portal_member(uuid, text[]) from anon;
grant execute on function public.is_coach_portal_member(uuid, text[]) to authenticated;

alter table public.coach_invitations enable row level security;
alter table public.coach_access_events enable row level security;

create policy "Coach invitations are visible to their internal owner"
  on public.coach_invitations for select to authenticated
  using (
    exists (
      select 1 from public.coaches coach
      where coach.id = coach_invitations.coach_id
        and coach.user_id = (select auth.uid())
    )
  );

create policy "Coach access events are visible to their internal owner"
  on public.coach_access_events for select to authenticated
  using (
    exists (
      select 1 from public.coaches coach
      where coach.id = coach_access_events.coach_id
        and coach.user_id = (select auth.uid())
    )
  );

create or replace function public.issue_coach_invitation(
  target_coach_id uuid,
  intended_email text,
  invited_role text,
  invitation_token_hash text,
  invitation_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(trim(intended_email));
  invitation_uuid uuid;
  coach_record public.coaches%rowtype;
  organization_uuid uuid;
  previous_invitation record;
begin
  if (select auth.uid()) is null or not public.is_internal_operator() then
    raise exception 'Only an internal owner or administrator can invite a coach';
  end if;
  if invited_role not in ('coach', 'coach_representative') then
    raise exception 'Invalid coach role';
  end if;
  if normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'A valid email address is required';
  end if;
  if lower(trim(invitation_token_hash)) !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid invitation token';
  end if;
  if invitation_expires_at <= now() or invitation_expires_at > now() + interval '31 days' then
    raise exception 'Invitation expiry must be within the next 31 days';
  end if;

  select * into coach_record
  from public.coaches
  where id = target_coach_id
    and user_id = (select auth.uid());
  if coach_record.id is null then
    raise exception 'Coach not found';
  end if;

  select id into organization_uuid
  from public.organizations
  where coach_id = target_coach_id
    and organization_type = 'coach_business'
    and status = 'active'
  limit 1;

  if organization_uuid is null then
    insert into public.organizations (
      name, slug, organization_type, coach_id, status, created_by
    ) values (
      coach_record.name,
      'coach-' || replace(target_coach_id::text, '-', ''),
      'coach_business',
      target_coach_id,
      'active',
      (select auth.uid())
    )
    returning id into organization_uuid;
  end if;

  if exists (
    select 1
    from public.organization_memberships membership
    join auth.users user_account on user_account.id = membership.user_id
    where membership.organization_id = organization_uuid
      and membership.status = 'active'
      and lower(user_account.email) = normalized_email
  ) then
    raise exception 'This person already has active coach access';
  end if;

  for previous_invitation in
    select id from public.coach_invitations
    where coach_id = target_coach_id
      and email = normalized_email
      and status = 'pending'
    for update
  loop
    update public.coach_invitations
    set status = 'revoked', revoked_at = now(), updated_at = now()
    where id = previous_invitation.id;
    insert into public.coach_access_events (
      organization_id, coach_id, invitation_id, actor_user_id, event_type, metadata
    ) values (
      organization_uuid, target_coach_id, previous_invitation.id, (select auth.uid()),
      'invite_revoked', jsonb_build_object('reason', 'superseded')
    );
  end loop;

  insert into public.coach_invitations (
    organization_id, coach_id, email, role, token_hash, invited_by, expires_at
  ) values (
    organization_uuid, target_coach_id, normalized_email, invited_role,
    lower(trim(invitation_token_hash)), (select auth.uid()), invitation_expires_at
  )
  returning id into invitation_uuid;

  insert into public.coach_access_events (
    organization_id, coach_id, invitation_id, actor_user_id, event_type, metadata
  ) values (
    organization_uuid, target_coach_id, invitation_uuid, (select auth.uid()),
    'invite_issued',
    jsonb_build_object('email', normalized_email, 'role', invited_role, 'expires_at', invitation_expires_at)
  );

  update public.coach_portal_profiles
  set portal_status = case when portal_status = 'not_invited' then 'invited' else portal_status end,
      updated_at = now()
  where coach_id = target_coach_id;

  return invitation_uuid;
end;
$$;

create or replace function public.preview_coach_invitation(invitation_token_hash text)
returns table (
  coach_name text,
  email_hint text,
  invited_role text,
  invitation_status text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coach.name,
    left(invitation.email, 1) || '***@' || split_part(invitation.email, '@', 2),
    invitation.role,
    case
      when invitation.status = 'pending' and invitation.expires_at <= now() then 'expired'
      else invitation.status
    end,
    invitation.expires_at
  from public.coach_invitations invitation
  join public.coaches coach on coach.id = invitation.coach_id
  where invitation.token_hash = lower(trim(invitation_token_hash))
    and lower(trim(invitation_token_hash)) ~ '^[0-9a-f]{64}$'
  limit 1;
$$;

create or replace function public.coach_invitation_email_matches(
  invitation_token_hash text,
  candidate_email text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.coach_invitations invitation
    where invitation.token_hash = lower(trim(invitation_token_hash))
      and lower(trim(invitation_token_hash)) ~ '^[0-9a-f]{64}$'
      and invitation.email = lower(trim(candidate_email))
      and invitation.status = 'pending'
      and invitation.expires_at > now()
  );
$$;

create or replace function public.claim_coach_invitation(invitation_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.coach_invitations%rowtype;
  signed_in_email text;
  membership_uuid uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in before accepting this invitation';
  end if;

  select * into invitation
  from public.coach_invitations
  where token_hash = lower(trim(invitation_token_hash))
    and lower(trim(invitation_token_hash)) ~ '^[0-9a-f]{64}$'
  for update;

  if invitation.id is null then raise exception 'Invitation not found'; end if;
  if invitation.status <> 'pending' then raise exception 'Invitation is no longer available'; end if;
  if invitation.expires_at <= now() then raise exception 'Invitation has expired'; end if;
  if not exists (
    select 1 from public.organizations organization
    where organization.id = invitation.organization_id
      and organization.organization_type = 'coach_business'
      and organization.coach_id = invitation.coach_id
      and organization.status = 'active'
  ) then
    raise exception 'Coach access is not active';
  end if;

  select lower(email) into signed_in_email from auth.users where id = (select auth.uid());
  if signed_in_email is null or signed_in_email <> invitation.email then
    raise exception 'Sign in with the email address this invitation was sent to';
  end if;

  insert into public.organization_memberships (
    organization_id, user_id, role, status, invited_by, accepted_at
  ) values (
    invitation.organization_id, (select auth.uid()), invitation.role,
    'active', invitation.invited_by, now()
  )
  on conflict (organization_id, user_id) do update set
    role = excluded.role,
    status = 'active',
    invited_by = excluded.invited_by,
    accepted_at = now(),
    updated_at = now()
  returning id into membership_uuid;

  update public.coach_invitations
  set status = 'claimed', claimed_by = (select auth.uid()), claimed_at = now(), updated_at = now()
  where id = invitation.id;

  update public.coach_portal_profiles
  set portal_status = case when portal_status in ('not_invited', 'invited') then 'in_progress' else portal_status end,
      updated_at = now()
  where coach_id = invitation.coach_id;

  insert into public.coach_access_events (
    organization_id, coach_id, invitation_id, actor_user_id, target_user_id, event_type,
    metadata
  ) values (
    invitation.organization_id, invitation.coach_id, invitation.id,
    (select auth.uid()), (select auth.uid()), 'invite_claimed',
    jsonb_build_object('membership_id', membership_uuid, 'role', invitation.role)
  );

  return invitation.coach_id;
end;
$$;

create or replace function public.revoke_coach_invitation(target_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.coach_invitations%rowtype;
begin
  if (select auth.uid()) is null or not public.is_internal_operator() then
    raise exception 'Only an internal owner or administrator can revoke coach invitations';
  end if;

  select invite.* into invitation
  from public.coach_invitations invite
  join public.coaches coach on coach.id = invite.coach_id
  where invite.id = target_invitation_id
    and coach.user_id = (select auth.uid())
  for update of invite;

  if invitation.id is null then raise exception 'Invitation not found'; end if;
  if invitation.status <> 'pending' then raise exception 'Only pending invitations can be revoked'; end if;

  update public.coach_invitations
  set status = 'revoked', revoked_at = now(), updated_at = now()
  where id = invitation.id;

  insert into public.coach_access_events (
    organization_id, coach_id, invitation_id, actor_user_id, event_type
  ) values (
    invitation.organization_id, invitation.coach_id, invitation.id,
    (select auth.uid()), 'invite_revoked'
  );
end;
$$;

create or replace function public.record_coach_first_login()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  membership_uuid uuid;
  organization_uuid uuid;
  membership_role text;
  coach_uuid uuid;
begin
  if (select auth.uid()) is null then return false; end if;

  select member.id, member.organization_id, member.role, organization.coach_id
  into membership_uuid, organization_uuid, membership_role, coach_uuid
  from public.organization_memberships member
  join public.organizations organization on organization.id = member.organization_id
  where member.user_id = (select auth.uid())
    and member.status = 'active'
    and member.role in ('coach', 'coach_representative')
    and organization.organization_type = 'coach_business'
    and organization.status = 'active'
  order by member.created_at
  limit 1;

  if membership_uuid is null or coach_uuid is null then return false; end if;

  insert into public.coach_access_events (
    organization_id, coach_id, actor_user_id, target_user_id, event_type,
    metadata
  ) values (
    organization_uuid, coach_uuid, (select auth.uid()), (select auth.uid()),
    'coach_first_login', jsonb_build_object('membership_id', membership_uuid, 'role', membership_role)
  ) on conflict do nothing;

  return true;
end;
$$;

drop policy if exists "Coach members can view their portal profile" on public.coach_portal_profiles;
create policy "Coach members can view their portal profile"
  on public.coach_portal_profiles for select to authenticated
  using (public.is_coach_portal_member(coach_id));

drop policy if exists "Coach members can view their coach identity" on public.coaches;
create policy "Coach members can view their coach identity"
  on public.coaches for select to authenticated
  using (public.is_coach_portal_member(id));

drop policy if exists "Coach members can view their submitted materials" on public.coach_private_materials;
create policy "Coach members can view their submitted materials"
  on public.coach_private_materials for select to authenticated
  using (public.is_coach_portal_member(coach_id));

create or replace function public.save_own_coach_portal_profile(
  target_coach_id uuid,
  profile jsonb,
  submit_for_review boolean default false
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  coach_owner uuid;
  next_status text := case when submit_for_review then 'submitted' else 'in_progress' end;
  now_value timestamptz := now();
begin
  if (select auth.uid()) is null or not public.is_coach_portal_member(target_coach_id) then
    raise exception 'Coach access is not available';
  end if;

  select user_id into coach_owner from public.coaches where id = target_coach_id;
  if coach_owner is null then raise exception 'Coach not found'; end if;

  insert into public.coach_portal_profiles (
    user_id, coach_id, portal_status, visibility_status,
    coach_email, coach_phone, representative_name, representative_email,
    base_location, preferred_contact_method, short_bio, personal_statement,
    football_identity, in_possession_model, out_of_possession_model, transition_model,
    set_piece_model, training_week, session_design_principles, player_development_proof,
    academy_integration, recruitment_preferences, staff_network, key_staff_likely_to_follow,
    presentation_summary, video_summary, media_and_communication, reference_permissions,
    current_salary, salary_expectation, contract_expiry, release_compensation,
    availability_timeline, family_situation, relocation_requirements,
    staff_cost_expectation, appointment_conditions, circumstances_visibility,
    feasibility_review_status, submitted_at, updated_at
  ) values (
    coach_owner, target_coach_id, next_status, 'coach_first_only',
    nullif(trim(profile->>'coach_email'), ''), nullif(trim(profile->>'coach_phone'), ''),
    nullif(trim(profile->>'representative_name'), ''), nullif(trim(profile->>'representative_email'), ''),
    nullif(trim(profile->>'base_location'), ''), nullif(trim(profile->>'preferred_contact_method'), ''),
    nullif(trim(profile->>'short_bio'), ''), nullif(trim(profile->>'personal_statement'), ''),
    nullif(trim(profile->>'football_identity'), ''), nullif(trim(profile->>'in_possession_model'), ''),
    nullif(trim(profile->>'out_of_possession_model'), ''), nullif(trim(profile->>'transition_model'), ''),
    nullif(trim(profile->>'set_piece_model'), ''), nullif(trim(profile->>'training_week'), ''),
    nullif(trim(profile->>'session_design_principles'), ''), nullif(trim(profile->>'player_development_proof'), ''),
    nullif(trim(profile->>'academy_integration'), ''), nullif(trim(profile->>'recruitment_preferences'), ''),
    nullif(trim(profile->>'staff_network'), ''), nullif(trim(profile->>'key_staff_likely_to_follow'), ''),
    nullif(trim(profile->>'presentation_summary'), ''), nullif(trim(profile->>'video_summary'), ''),
    nullif(trim(profile->>'media_and_communication'), ''), nullif(trim(profile->>'reference_permissions'), ''),
    nullif(trim(profile->>'current_salary'), ''), nullif(trim(profile->>'salary_expectation'), ''),
    nullif(trim(profile->>'contract_expiry'), '')::date, nullif(trim(profile->>'release_compensation'), ''),
    nullif(trim(profile->>'availability_timeline'), ''), nullif(trim(profile->>'family_situation'), ''),
    nullif(trim(profile->>'relocation_requirements'), ''), nullif(trim(profile->>'staff_cost_expectation'), ''),
    nullif(trim(profile->>'appointment_conditions'), ''), 'coach_first_only', 'draft',
    case when submit_for_review then now_value else null end, now_value
  )
  on conflict (coach_id) do update set
    portal_status = next_status,
    coach_email = excluded.coach_email,
    coach_phone = excluded.coach_phone,
    representative_name = excluded.representative_name,
    representative_email = excluded.representative_email,
    base_location = excluded.base_location,
    preferred_contact_method = excluded.preferred_contact_method,
    short_bio = excluded.short_bio,
    personal_statement = excluded.personal_statement,
    football_identity = excluded.football_identity,
    in_possession_model = excluded.in_possession_model,
    out_of_possession_model = excluded.out_of_possession_model,
    transition_model = excluded.transition_model,
    set_piece_model = excluded.set_piece_model,
    training_week = excluded.training_week,
    session_design_principles = excluded.session_design_principles,
    player_development_proof = excluded.player_development_proof,
    academy_integration = excluded.academy_integration,
    recruitment_preferences = excluded.recruitment_preferences,
    staff_network = excluded.staff_network,
    key_staff_likely_to_follow = excluded.key_staff_likely_to_follow,
    presentation_summary = excluded.presentation_summary,
    video_summary = excluded.video_summary,
    media_and_communication = excluded.media_and_communication,
    reference_permissions = excluded.reference_permissions,
    current_salary = excluded.current_salary,
    salary_expectation = excluded.salary_expectation,
    contract_expiry = excluded.contract_expiry,
    release_compensation = excluded.release_compensation,
    availability_timeline = excluded.availability_timeline,
    family_situation = excluded.family_situation,
    relocation_requirements = excluded.relocation_requirements,
    staff_cost_expectation = excluded.staff_cost_expectation,
    appointment_conditions = excluded.appointment_conditions,
    circumstances_visibility = 'coach_first_only',
    feasibility_review_status = 'draft',
    feasibility_reviewed_at = null,
    feasibility_reviewed_by = null,
    submitted_at = case when submit_for_review then now_value else coach_portal_profiles.submitted_at end,
    updated_at = now_value;

  return next_status;
end;
$$;

create or replace function public.add_own_coach_material(
  target_coach_id uuid,
  material_title text,
  material_kind text,
  material_description text default null,
  material_external_url text default null,
  material_storage_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  coach_owner uuid;
  material_uuid uuid;
  clean_title text := nullif(trim(material_title), '');
  clean_kind text := lower(trim(material_kind));
begin
  if (select auth.uid()) is null or not public.is_coach_portal_member(target_coach_id) then
    raise exception 'Coach access is not available';
  end if;
  if clean_title is null then raise exception 'Material title is required'; end if;
  if clean_kind not in (
    'presentation', 'training_video', 'match_video', 'methodology',
    'analysis', 'media', 'reference_pack', 'other'
  ) then
    raise exception 'Invalid material type';
  end if;
  if nullif(trim(material_description), '') is null
    and nullif(trim(material_external_url), '') is null
    and nullif(trim(material_storage_path), '') is null then
    raise exception 'Add a file, secure link, or useful description';
  end if;
  if material_storage_path is not null
    and split_part(material_storage_path, '/', 1) <> target_coach_id::text then
    raise exception 'Invalid material location';
  end if;

  select user_id into coach_owner from public.coaches where id = target_coach_id;
  if coach_owner is null then raise exception 'Coach not found'; end if;

  insert into public.coach_private_materials (
    user_id, coach_id, title, material_type, description, external_url,
    storage_path, source_label, uploaded_by, confidentiality_status, verification_status
  ) values (
    coach_owner, target_coach_id, clean_title, clean_kind,
    nullif(trim(material_description), ''), nullif(trim(material_external_url), ''),
    nullif(trim(material_storage_path), ''), 'Coach portal submission',
    'coach', 'available', 'unverified'
  )
  returning id into material_uuid;

  return material_uuid;
end;
$$;

revoke all on function public.issue_coach_invitation(uuid, text, text, text, timestamptz) from public;
revoke all on function public.issue_coach_invitation(uuid, text, text, text, timestamptz) from anon;
revoke all on function public.preview_coach_invitation(text) from public;
revoke all on function public.coach_invitation_email_matches(text, text) from public;
revoke all on function public.claim_coach_invitation(text) from public;
revoke all on function public.claim_coach_invitation(text) from anon;
revoke all on function public.revoke_coach_invitation(uuid) from public;
revoke all on function public.revoke_coach_invitation(uuid) from anon;
revoke all on function public.record_coach_first_login() from public;
revoke all on function public.record_coach_first_login() from anon;
revoke all on function public.save_own_coach_portal_profile(uuid, jsonb, boolean) from public;
revoke all on function public.save_own_coach_portal_profile(uuid, jsonb, boolean) from anon;
revoke all on function public.add_own_coach_material(uuid, text, text, text, text, text) from public;
revoke all on function public.add_own_coach_material(uuid, text, text, text, text, text) from anon;

grant execute on function public.issue_coach_invitation(uuid, text, text, text, timestamptz) to authenticated;
grant execute on function public.preview_coach_invitation(text) to anon, authenticated;
grant execute on function public.coach_invitation_email_matches(text, text) to anon, authenticated;
grant execute on function public.claim_coach_invitation(text) to authenticated;
grant execute on function public.revoke_coach_invitation(uuid) to authenticated;
grant execute on function public.record_coach_first_login() to authenticated;
grant execute on function public.save_own_coach_portal_profile(uuid, jsonb, boolean) to authenticated;
grant execute on function public.add_own_coach_material(uuid, text, text, text, text, text) to authenticated;
grant select on public.coach_invitations to authenticated;
grant select on public.coach_access_events to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'coach-private-materials',
  'coach-private-materials',
  false,
  104857600,
  array[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Internal and coach members can read coach materials" on storage.objects;
create policy "Internal and coach members can read coach materials"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'coach-private-materials'
    and (
      public.is_internal_operator(array['owner', 'admin', 'analyst'])
      or (
        (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        and public.is_coach_portal_member(((storage.foldername(name))[1])::uuid)
      )
    )
  );

drop policy if exists "Coach members can upload coach materials" on storage.objects;
create policy "Coach members can upload coach materials"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'coach-private-materials'
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and public.is_coach_portal_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Coach members can remove failed uploads" on storage.objects;
create policy "Coach members can remove failed uploads"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'coach-private-materials'
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and public.is_coach_portal_member(((storage.foldername(name))[1])::uuid)
  );
