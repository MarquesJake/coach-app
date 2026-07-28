\set ON_ERROR_STOP on

begin;

insert into auth.users (
  id, aud, role, email, email_confirmed_at, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at
) values (
  '55555555-5555-4555-8555-555555555555',
  'authenticated', 'authenticated', 'external-onboarding@coachfirst.invalid', now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
);

select set_config(
  'request.jwt.claim.sub',
  (
    select membership.user_id::text
    from public.organization_memberships membership
    join public.organizations organization on organization.id = membership.organization_id
    where organization.slug = 'coach-first'
      and membership.status = 'active'
      and membership.role in ('owner', 'admin')
    limit 1
  ),
  true
);
set local role authenticated;
select public.issue_club_invitation(
  (select id from public.organizations where slug = 'west-ham-united'),
  'external-onboarding@coachfirst.invalid',
  'club_director',
  repeat('e', 64),
  now() + interval '1 day'
);

select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select set_config('request.jwt.claims', '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}', true);
select public.claim_club_invitation(repeat('e', 64));
select public.complete_external_identity_onboarding(
  (select organization_id from public.organization_memberships
    where user_id = '55555555-5555-4555-8555-555555555555' and status = 'active' limit 1),
  'club',
  'External RLS User',
  'Sporting Director',
  '+44 7700 900000',
  true,
  true
);
select public.complete_external_identity_onboarding(
  (select organization_id from public.organization_memberships
    where user_id = '55555555-5555-4555-8555-555555555555' and status = 'active' limit 1),
  'club',
  'External RLS User',
  'Sporting Director',
  '+44 7700 900001',
  true,
  true
);

do $$
declare
  identity_count bigint;
  directory_count bigint;
  direct_insert_denied boolean := false;
begin
  select count(*) into identity_count
  from public.external_identity_profiles
  where user_id = '55555555-5555-4555-8555-555555555555'
    and contact_phone = '+44 7700 900001';
  if identity_count <> 1 then
    raise exception 'Onboarding was not idempotent or did not retain the latest self-owned contact';
  end if;

  select count(*) into directory_count
  from public.get_external_identity_directory(
    (select organization_id from public.organization_memberships
      where user_id = '55555555-5555-4555-8555-555555555555' and status = 'active' limit 1)
  )
  where display_name = 'External RLS User'
    and position_title = 'Sporting Director';
  if directory_count <> 1 then
    raise exception 'Safe organization directory did not return the completed identity';
  end if;

  begin
    insert into public.external_identity_profiles (
      organization_id, membership_id, user_id, account_type,
      display_name, position_title, confidentiality_acknowledged_at,
      intended_use_acknowledged_at, onboarding_completed_at
    )
    select organization_id, id, user_id, 'club', 'Direct insert', 'Director', now(), now(), now()
    from public.organization_memberships
    where user_id = '55555555-5555-4555-8555-555555555555'
    limit 1;
  exception when others then
    direct_insert_denied := true;
  end;
  if not direct_insert_denied then
    raise exception 'Direct external identity insert was accepted';
  end if;
end;
$$;

reset role;
select set_config(
  'request.jwt.claim.sub',
  (
    select membership.user_id::text
    from public.organization_memberships membership
    join public.organizations organization on organization.id = membership.organization_id
    where organization.slug = 'coach-first'
      and membership.status = 'active'
      and membership.role in ('owner', 'admin')
    limit 1
  ),
  true
);
set local role authenticated;

do $$
declare onboarding_events bigint;
begin
  select count(*) into onboarding_events
  from public.organization_access_events
  where target_user_id = '55555555-5555-4555-8555-555555555555'
    and event_type = 'club_onboarding_completed';
  if onboarding_events <> 1 then
    raise exception 'Onboarding completion event was not idempotent';
  end if;
end;
$$;

reset role;
rollback;

\echo 'external_identity_onboarding_rls: membership binding, privacy and idempotency passed'
