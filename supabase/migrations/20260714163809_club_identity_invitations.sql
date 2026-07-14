-- Invite-only club identity. Raw invitation tokens never reach the database:
-- the application stores and submits only a SHA-256 digest.

create table public.club_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null check (email = lower(trim(email)) and position('@' in email) > 1),
  role text not null check (role in ('club_owner', 'club_director', 'club_viewer')),
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

create table public.organization_access_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invitation_id uuid references public.club_invitations(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in (
    'invite_issued', 'invite_claimed', 'invite_revoked',
    'club_first_login', 'membership_revoked'
  )),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index club_invitations_org_status_idx
  on public.club_invitations(organization_id, status, created_at desc);
create index club_invitations_email_status_idx
  on public.club_invitations(email, status);
create index organization_access_events_org_time_idx
  on public.organization_access_events(organization_id, occurred_at desc);
create unique index organization_access_events_first_login_idx
  on public.organization_access_events(organization_id, target_user_id)
  where event_type = 'club_first_login';

create or replace function public.is_internal_operator(
  allowed_roles text[] default array['owner', 'admin']::text[]
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
      and organization.organization_type = 'internal'
      and organization.status = 'active'
      and membership.role = any (allowed_roles)
  );
$$;

revoke all on function public.is_internal_operator(text[]) from public;
revoke all on function public.is_internal_operator(text[]) from anon;
grant execute on function public.is_internal_operator(text[]) to authenticated;

alter table public.club_invitations enable row level security;
alter table public.organization_access_events enable row level security;

create policy "Internal operators can view club invitations"
  on public.club_invitations for select to authenticated
  using (public.is_internal_operator());

create policy "Internal operators can view organization access events"
  on public.organization_access_events for select to authenticated
  using (public.is_internal_operator());

drop policy if exists "Members can view their organizations" on public.organizations;
create policy "Members and internal operators can view organizations"
  on public.organizations for select to authenticated
  using (
    created_by = (select auth.uid())
    or public.is_organization_member(id)
    or public.is_internal_operator()
  );

drop policy if exists "Members can view memberships" on public.organization_memberships;
create policy "Members and internal operators can view memberships"
  on public.organization_memberships for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_organization_member(organization_id, array['owner', 'admin', 'club_owner', 'club_director'])
    or public.is_internal_operator()
  );

create or replace function public.issue_club_invitation(
  target_organization_id uuid,
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
  previous_invitation record;
begin
  if (select auth.uid()) is null or not public.is_internal_operator() then
    raise exception 'Only an internal owner or administrator can issue club invitations';
  end if;
  if invited_role not in ('club_owner', 'club_director', 'club_viewer') then
    raise exception 'Invalid club role';
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
  if not exists (
    select 1 from public.organizations organization
    where organization.id = target_organization_id
      and organization.organization_type = 'club'
      and organization.status = 'active'
  ) then
    raise exception 'Active club organization not found';
  end if;
  if exists (
    select 1
    from public.organization_memberships membership
    join auth.users user_account on user_account.id = membership.user_id
    where membership.organization_id = target_organization_id
      and membership.status = 'active'
      and lower(user_account.email) = normalized_email
  ) then
    raise exception 'This person already has active club access';
  end if;

  for previous_invitation in
    select id from public.club_invitations
    where organization_id = target_organization_id
      and email = normalized_email
      and status = 'pending'
    for update
  loop
    update public.club_invitations
    set status = 'revoked', revoked_at = now(), updated_at = now()
    where id = previous_invitation.id;
    insert into public.organization_access_events (
      organization_id, invitation_id, actor_user_id, event_type, metadata
    ) values (
      target_organization_id, previous_invitation.id, (select auth.uid()),
      'invite_revoked', jsonb_build_object('reason', 'superseded')
    );
  end loop;

  insert into public.club_invitations (
    organization_id, email, role, token_hash, invited_by, expires_at
  ) values (
    target_organization_id, normalized_email, invited_role,
    lower(trim(invitation_token_hash)), (select auth.uid()), invitation_expires_at
  ) returning id into invitation_uuid;

  insert into public.organization_access_events (
    organization_id, invitation_id, actor_user_id, event_type,
    metadata
  ) values (
    target_organization_id, invitation_uuid, (select auth.uid()), 'invite_issued',
    jsonb_build_object('email', normalized_email, 'role', invited_role, 'expires_at', invitation_expires_at)
  );

  return invitation_uuid;
end;
$$;

create or replace function public.preview_club_invitation(invitation_token_hash text)
returns table (
  organization_name text,
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
    organization.name,
    left(invitation.email, 1) || '***@' || split_part(invitation.email, '@', 2),
    invitation.role,
    case
      when invitation.status = 'pending' and invitation.expires_at <= now() then 'expired'
      else invitation.status
    end,
    invitation.expires_at
  from public.club_invitations invitation
  join public.organizations organization on organization.id = invitation.organization_id
  where invitation.token_hash = lower(trim(invitation_token_hash))
    and lower(trim(invitation_token_hash)) ~ '^[0-9a-f]{64}$'
  limit 1;
$$;

create or replace function public.club_invitation_email_matches(
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
    from public.club_invitations invitation
    where invitation.token_hash = lower(trim(invitation_token_hash))
      and lower(trim(invitation_token_hash)) ~ '^[0-9a-f]{64}$'
      and invitation.email = lower(trim(candidate_email))
      and invitation.status = 'pending'
      and invitation.expires_at > now()
  );
$$;

create or replace function public.claim_club_invitation(invitation_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.club_invitations%rowtype;
  signed_in_email text;
  membership_uuid uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in before accepting this invitation';
  end if;

  select * into invitation
  from public.club_invitations
  where token_hash = lower(trim(invitation_token_hash))
    and lower(trim(invitation_token_hash)) ~ '^[0-9a-f]{64}$'
  for update;

  if invitation.id is null then raise exception 'Invitation not found'; end if;
  if invitation.status <> 'pending' then raise exception 'Invitation is no longer available'; end if;
  if invitation.expires_at <= now() then raise exception 'Invitation has expired'; end if;
  if not exists (
    select 1 from public.organizations organization
    where organization.id = invitation.organization_id
      and organization.organization_type = 'club'
      and organization.status = 'active'
  ) then
    raise exception 'Club access is not active';
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

  update public.club_invitations
  set status = 'claimed', claimed_by = (select auth.uid()), claimed_at = now(), updated_at = now()
  where id = invitation.id;

  insert into public.organization_access_events (
    organization_id, invitation_id, actor_user_id, target_user_id, event_type,
    metadata
  ) values (
    invitation.organization_id, invitation.id, (select auth.uid()), (select auth.uid()),
    'invite_claimed', jsonb_build_object('membership_id', membership_uuid, 'role', invitation.role)
  );

  return invitation.organization_id;
end;
$$;

create or replace function public.revoke_club_invitation(target_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.club_invitations%rowtype;
begin
  if (select auth.uid()) is null or not public.is_internal_operator() then
    raise exception 'Only an internal owner or administrator can revoke club invitations';
  end if;
  select * into invitation from public.club_invitations where id = target_invitation_id for update;
  if invitation.id is null then raise exception 'Invitation not found'; end if;
  if invitation.status <> 'pending' then raise exception 'Only pending invitations can be revoked'; end if;

  update public.club_invitations
  set status = 'revoked', revoked_at = now(), updated_at = now()
  where id = invitation.id;
  insert into public.organization_access_events (
    organization_id, invitation_id, actor_user_id, event_type
  ) values (
    invitation.organization_id, invitation.id, (select auth.uid()), 'invite_revoked'
  );
end;
$$;

create or replace function public.revoke_club_membership(target_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  membership public.organization_memberships%rowtype;
begin
  if (select auth.uid()) is null or not public.is_internal_operator() then
    raise exception 'Only an internal owner or administrator can revoke club access';
  end if;
  select member.* into membership
  from public.organization_memberships member
  join public.organizations organization on organization.id = member.organization_id
  where member.id = target_membership_id
    and organization.organization_type = 'club'
  for update of member;
  if membership.id is null then raise exception 'Club membership not found'; end if;
  if membership.status <> 'active' then raise exception 'Club membership is not active'; end if;

  update public.organization_memberships
  set status = 'revoked', updated_at = now()
  where id = membership.id;
  insert into public.organization_access_events (
    organization_id, actor_user_id, target_user_id, event_type,
    metadata
  ) values (
    membership.organization_id, (select auth.uid()), membership.user_id,
    'membership_revoked', jsonb_build_object('membership_id', membership.id, 'role', membership.role)
  );
end;
$$;

create or replace function public.record_club_first_login()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  membership public.organization_memberships%rowtype;
begin
  if (select auth.uid()) is null then return false; end if;
  select member.* into membership
  from public.organization_memberships member
  join public.organizations organization on organization.id = member.organization_id
  where member.user_id = (select auth.uid())
    and member.status = 'active'
    and member.role in ('club_owner', 'club_director', 'club_viewer')
    and organization.organization_type = 'club'
    and organization.status = 'active'
  order by member.created_at
  limit 1;
  if membership.id is null then return false; end if;

  insert into public.organization_access_events (
    organization_id, actor_user_id, target_user_id, event_type,
    metadata
  ) values (
    membership.organization_id, (select auth.uid()), (select auth.uid()),
    'club_first_login', jsonb_build_object('membership_id', membership.id, 'role', membership.role)
  ) on conflict do nothing;
  return true;
end;
$$;

revoke all on function public.issue_club_invitation(uuid, text, text, text, timestamptz) from public;
revoke all on function public.issue_club_invitation(uuid, text, text, text, timestamptz) from anon;
revoke all on function public.preview_club_invitation(text) from public;
revoke all on function public.club_invitation_email_matches(text, text) from public;
revoke all on function public.claim_club_invitation(text) from public;
revoke all on function public.claim_club_invitation(text) from anon;
revoke all on function public.revoke_club_invitation(uuid) from public;
revoke all on function public.revoke_club_invitation(uuid) from anon;
revoke all on function public.revoke_club_membership(uuid) from public;
revoke all on function public.revoke_club_membership(uuid) from anon;
revoke all on function public.record_club_first_login() from public;
revoke all on function public.record_club_first_login() from anon;

grant execute on function public.issue_club_invitation(uuid, text, text, text, timestamptz) to authenticated;
grant execute on function public.preview_club_invitation(text) to anon, authenticated;
grant execute on function public.club_invitation_email_matches(text, text) to anon, authenticated;
grant execute on function public.claim_club_invitation(text) to authenticated;
grant execute on function public.revoke_club_invitation(uuid) to authenticated;
grant execute on function public.revoke_club_membership(uuid) to authenticated;
grant execute on function public.record_club_first_login() to authenticated;

grant select on public.club_invitations to authenticated;
grant select on public.organization_access_events to authenticated;
