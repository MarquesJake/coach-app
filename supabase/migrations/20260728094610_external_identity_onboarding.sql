-- A small, organisation-scoped identity record for invited club and coach
-- seats. The record deliberately contains no appointment intelligence.

create table public.external_identity_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  membership_id uuid not null unique references public.organization_memberships(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_type text not null check (account_type in ('club', 'coach')),
  display_name text not null check (char_length(trim(display_name)) between 2 and 100),
  position_title text not null check (char_length(trim(position_title)) between 2 and 120),
  contact_phone text check (contact_phone is null or char_length(trim(contact_phone)) between 5 and 50),
  confidentiality_acknowledged_at timestamptz not null,
  intended_use_acknowledged_at timestamptz not null,
  terms_version text not null default '2026-07',
  onboarding_completed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index external_identity_profiles_user_idx
  on public.external_identity_profiles(user_id);
create index external_identity_profiles_org_type_idx
  on public.external_identity_profiles(organization_id, account_type);
create index external_identity_profiles_onboarding_idx
  on public.external_identity_profiles(onboarding_completed_at desc);

alter table public.external_identity_profiles enable row level security;

create policy "External identities are visible within their active organization"
  on public.external_identity_profiles for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_internal_operator()
    or public.is_organization_member(organization_id)
  );

grant select on public.external_identity_profiles to authenticated;

alter table public.organization_access_events
  drop constraint if exists organization_access_events_event_type_check,
  add constraint organization_access_events_event_type_check check (event_type in (
    'invite_issued', 'invite_claimed', 'invite_revoked',
    'club_first_login', 'club_onboarding_completed', 'membership_revoked'
  ));

alter table public.coach_access_events
  drop constraint if exists coach_access_events_event_type_check,
  add constraint coach_access_events_event_type_check check (event_type in (
    'invite_issued', 'invite_claimed', 'invite_revoked',
    'coach_first_login', 'coach_onboarding_completed'
  ));

create unique index organization_access_events_onboarding_idx
  on public.organization_access_events(organization_id, target_user_id)
  where event_type = 'club_onboarding_completed';

create unique index coach_access_events_onboarding_idx
  on public.coach_access_events(organization_id, target_user_id)
  where event_type = 'coach_onboarding_completed';

create or replace function public.complete_external_identity_onboarding(
  target_organization_id uuid,
  target_account_type text,
  person_display_name text,
  person_position_title text,
  person_contact_phone text,
  accepted_confidentiality boolean,
  accepted_intended_use boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  membership_record public.organization_memberships%rowtype;
  organization_record public.organizations%rowtype;
  profile_uuid uuid;
  coach_uuid uuid;
  completed_at timestamptz := now();
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in before completing account setup';
  end if;
  if target_account_type not in ('club', 'coach') then
    raise exception 'Invalid external account type';
  end if;
  if char_length(trim(person_display_name)) not between 2 and 100 then
    raise exception 'Enter your full name';
  end if;
  if char_length(trim(person_position_title)) not between 2 and 120 then
    raise exception 'Enter your role or relationship to the coach';
  end if;
  if nullif(trim(person_contact_phone), '') is not null
    and char_length(trim(person_contact_phone)) not between 5 and 50 then
    raise exception 'Enter a valid contact number or leave it blank';
  end if;
  if not accepted_confidentiality or not accepted_intended_use then
    raise exception 'Both account acknowledgements are required';
  end if;

  select * into organization_record
  from public.organizations
  where id = target_organization_id
    and status = 'active';
  if organization_record.id is null then
    raise exception 'Active organization not found';
  end if;

  select * into membership_record
  from public.organization_memberships
  where organization_id = target_organization_id
    and user_id = (select auth.uid())
    and status = 'active'
  for update;
  if membership_record.id is null then
    raise exception 'Active organization membership not found';
  end if;

  if target_account_type = 'club' then
    if organization_record.organization_type <> 'club'
      or membership_record.role not in ('club_owner', 'club_director', 'club_viewer') then
      raise exception 'This membership is not a club account';
    end if;
  else
    if organization_record.organization_type <> 'coach_business'
      or membership_record.role not in ('coach', 'coach_representative')
      or organization_record.coach_id is null then
      raise exception 'This membership is not a coach account';
    end if;
    coach_uuid := organization_record.coach_id;
  end if;

  insert into public.external_identity_profiles (
    organization_id,
    membership_id,
    user_id,
    account_type,
    display_name,
    position_title,
    contact_phone,
    confidentiality_acknowledged_at,
    intended_use_acknowledged_at,
    terms_version,
    onboarding_completed_at
  ) values (
    target_organization_id,
    membership_record.id,
    (select auth.uid()),
    target_account_type,
    trim(person_display_name),
    trim(person_position_title),
    nullif(trim(person_contact_phone), ''),
    completed_at,
    completed_at,
    '2026-07',
    completed_at
  )
  on conflict (membership_id) do update set
    display_name = excluded.display_name,
    position_title = excluded.position_title,
    contact_phone = excluded.contact_phone,
    confidentiality_acknowledged_at = excluded.confidentiality_acknowledged_at,
    intended_use_acknowledged_at = excluded.intended_use_acknowledged_at,
    terms_version = excluded.terms_version,
    onboarding_completed_at = excluded.onboarding_completed_at,
    updated_at = completed_at
  returning id into profile_uuid;

  if target_account_type = 'club' then
    insert into public.organization_access_events (
      organization_id,
      actor_user_id,
      target_user_id,
      event_type,
      metadata
    ) values (
      target_organization_id,
      (select auth.uid()),
      (select auth.uid()),
      'club_onboarding_completed',
      jsonb_build_object(
        'membership_id', membership_record.id,
        'role', membership_record.role,
        'position_title', trim(person_position_title),
        'terms_version', '2026-07'
      )
    ) on conflict do nothing;
  else
    insert into public.coach_access_events (
      organization_id,
      coach_id,
      actor_user_id,
      target_user_id,
      event_type,
      metadata
    ) values (
      target_organization_id,
      coach_uuid,
      (select auth.uid()),
      (select auth.uid()),
      'coach_onboarding_completed',
      jsonb_build_object(
        'membership_id', membership_record.id,
        'role', membership_record.role,
        'position_title', trim(person_position_title),
        'terms_version', '2026-07'
      )
    ) on conflict do nothing;
  end if;

  return profile_uuid;
end;
$$;

revoke all on function public.complete_external_identity_onboarding(
  uuid, text, text, text, text, boolean, boolean
) from public;
revoke all on function public.complete_external_identity_onboarding(
  uuid, text, text, text, text, boolean, boolean
) from anon;
grant execute on function public.complete_external_identity_onboarding(
  uuid, text, text, text, text, boolean, boolean
) to authenticated;
