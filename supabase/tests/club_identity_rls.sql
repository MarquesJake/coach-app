\set ON_ERROR_STOP on

begin;

insert into auth.users (
  id, aud, role, email, email_confirmed_at, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at
) values (
  '11111111-1111-4111-8111-111111111111',
  'authenticated', 'authenticated', 'rls-club-test@coachfirst.invalid', now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
);

insert into auth.users (
  id, aud, role, email, email_confirmed_at, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at
) values (
  '22222222-2222-4222-8222-222222222222',
  'authenticated', 'authenticated', 'invite-claim-test@coachfirst.invalid', now(),
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
  'invite-claim-test@coachfirst.invalid',
  'club_viewer',
  repeat('a', 64),
  now() + interval '7 days'
);

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select public.claim_club_invitation(repeat('a', 64));
select public.record_club_first_login();
select public.record_club_first_login();

do $$
declare membership_count bigint;
declare first_login_count bigint;
begin
  select count(*) into membership_count
  from public.organization_memberships
  where user_id = '22222222-2222-4222-8222-222222222222'
    and role = 'club_viewer'
    and status = 'active';
  if membership_count <> 1 then raise exception 'Invitation claim did not create one active club membership'; end if;

  -- Access events are seller-only, so verify idempotency after returning to the internal role below.
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
declare first_login_count bigint;
begin
  select count(*) into first_login_count
  from public.organization_access_events
  where target_user_id = '22222222-2222-4222-8222-222222222222'
    and event_type = 'club_first_login';
  if first_login_count <> 1 then raise exception 'First club login audit was not idempotent'; end if;
end;
$$;

reset role;

insert into public.organization_memberships (
  organization_id, user_id, role, status, accepted_at
)
select id, '11111111-1111-4111-8111-111111111111', 'club_director', 'active', now()
from public.organizations
where slug = 'west-ham-united';

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

do $$
declare
  leaked_rows bigint;
  readable_rows bigint;
  protected_order uuid;
  approval_denied boolean := false;
  revocation_denied boolean := false;
  organization_creation_denied boolean := false;
begin
  select
    (select count(*) from public.coaches) +
    (select count(*) from public.candidate_assessments) +
    (select count(*) from public.assessment_evidence) +
    (select count(*) from public.candidate_interview_answers) +
    (select count(*) from public.candidate_reference_answers) +
    (select count(*) from public.coach_references) +
    (select count(*) from public.profile_claims) +
    (select count(*) from public.mandates) +
    (select count(*) from public.succession_plans) +
    (select count(*) from public.intelligence_inbox_items) +
    (select count(*) from public.dossier_offer_commercials) +
    (select count(*) from public.dossier_order_commercials)
  into leaked_rows;
  if leaked_rows <> 0 then
    raise exception 'Club identity leaked % internal rows', leaked_rows;
  end if;

  select
    (select count(*) from public.club_briefs) +
    (select count(*) from public.dossier_offers) +
    (select count(*) from public.dossier_orders) +
    (select count(*) from public.confidential_access_grants) +
    (select count(*) from public.confidential_access_grant_materials) +
    (select count(*) from public.coach_private_materials)
  into readable_rows;
  if readable_rows < 10 then
    raise exception 'Expected the West Ham club room fixture, found only % readable rows', readable_rows;
  end if;

  select id into protected_order from public.dossier_orders limit 1;
  begin
    perform public.approve_dossier_order(protected_order, array[]::uuid[], 30, false, null);
  exception when others then
    approval_denied := position('cannot approve' in lower(sqlerrm)) > 0;
  end;
  if not approval_denied then raise exception 'Club identity could execute approve_dossier_order'; end if;

  begin
    perform public.revoke_dossier_access(protected_order);
  exception when others then
    revocation_denied := position('cannot revoke' in lower(sqlerrm)) > 0;
  end;
  if not revocation_denied then raise exception 'Club identity could execute revoke_dossier_access'; end if;

  begin
    insert into public.organizations (
      name, slug, organization_type, status, created_by
    ) values (
      'Privilege escalation attempt', 'rls-escalation-attempt', 'internal',
      'active', '11111111-1111-4111-8111-111111111111'
    );
  exception when others then
    organization_creation_denied := true;
  end;
  if not organization_creation_denied then
    raise exception 'Club identity could create an internal organization';
  end if;
end;
$$;

reset role;
update public.organization_memberships
set status = 'revoked', updated_at = now()
where user_id = '11111111-1111-4111-8111-111111111111';

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

do $$
declare visible_rows bigint;
begin
  select
    (select count(*) from public.club_briefs) +
    (select count(*) from public.dossier_offers) +
    (select count(*) from public.dossier_orders) +
    (select count(*) from public.confidential_access_grants) +
    (select count(*) from public.confidential_access_grant_materials) +
    (select count(*) from public.coach_private_materials)
  into visible_rows;
  if visible_rows <> 0 then
    raise exception 'Revoked club identity retained access to % rows', visible_rows;
  end if;
end;
$$;

reset role;
rollback;

\echo 'club_identity_rls: active boundary, privileged RPC denial, and instant revocation passed'
