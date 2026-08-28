\set ON_ERROR_STOP on

-- Contract for 20260803120000_internal_team_corpus_access.sql
--
-- A second internal analyst must see the corpus created by the first, while a
-- club identity and an account with no membership must see none of it. The whole
-- test runs inside a transaction that is rolled back.

begin;

-- Two fresh accounts: one internal analyst, one club-only identity.
insert into auth.users (
  id, aud, role, email, email_confirmed_at, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at
) values
  ('33333333-3333-4333-8333-333333333333',
   'authenticated', 'authenticated', 'rls-corpus-analyst@coachfirst.invalid', now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('44444444-4444-4444-8444-444444444444',
   'authenticated', 'authenticated', 'rls-corpus-club@coachfirst.invalid', now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('55555555-5555-4555-8555-555555555555',
   'authenticated', 'authenticated', 'rls-corpus-nobody@coachfirst.invalid', now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into public.organization_memberships (organization_id, user_id, role, status)
select id, '33333333-3333-4333-8333-333333333333', 'analyst', 'active'
from public.organizations where slug = 'coach-first';

insert into public.organization_memberships (organization_id, user_id, role, status)
select id, '44444444-4444-4444-8444-444444444444', 'club_director', 'active'
from public.organizations where organization_type = 'club' limit 1;

-- A coach and a club owned by a *different* user, standing in for corpus that
-- an existing analyst created.
insert into public.clubs (id, user_id, name, league, country, ownership_model)
values (
  '66666666-6666-4666-8666-666666666666',
  (select membership.user_id from public.organization_memberships membership
   join public.organizations organization on organization.id = membership.organization_id
   where organization.slug = 'coach-first' and membership.role = 'owner'
     and membership.status = 'active' limit 1),
  'RLS Corpus Test Club', 'Test League', 'Testland', 'Private'
);

-- The second analyst reads corpus they did not create.
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
set local role authenticated;

do $$
declare visible integer;
begin
  select count(*) into visible from public.clubs
  where id = '66666666-6666-4666-8666-666666666666';
  if visible <> 1 then
    raise exception 'analyst must see corpus created by another internal member (saw %)', visible;
  end if;

  select count(*) into visible from public.coaches;
  if visible = 0 then
    raise exception 'analyst must see the shared coach corpus';
  end if;
end;
$$;

-- The second analyst can also write shared corpus, not merely read it.
update public.clubs set notes = 'edited by a second analyst'
where id = '66666666-6666-4666-8666-666666666666';

reset role;

-- A club identity sees none of the internal corpus.
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
set local role authenticated;

do $$
declare leaked integer;
begin
  select count(*) into leaked from public.clubs
  where id = '66666666-6666-4666-8666-666666666666';
  if leaked <> 0 then
    raise exception 'club identity must not read internal corpus (saw %)', leaked;
  end if;

  select count(*) into leaked from public.coaches;
  if leaked <> 0 then
    raise exception 'club identity must not read the coach corpus (saw %)', leaked;
  end if;

  select count(*) into leaked from public.mandates;
  if leaked <> 0 then
    raise exception 'club identity must not read mandates (saw %)', leaked;
  end if;
end;
$$;

reset role;

-- An account with no membership at all sees nothing.
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
set local role authenticated;

do $$
declare leaked integer;
begin
  select count(*) into leaked from public.clubs
  where id = '66666666-6666-4666-8666-666666666666';
  if leaked <> 0 then
    raise exception 'membership-less account must not read internal corpus (saw %)', leaked;
  end if;

  select count(*) into leaked from public.coaches;
  if leaked <> 0 then
    raise exception 'membership-less account must not read the coach corpus (saw %)', leaked;
  end if;
end;
$$;

reset role;

-- Coach private material stays behind its own release boundary: the corpus
-- migration must not have widened it.
do $$
declare policy_count integer;
begin
  select count(*) into policy_count from pg_policy
  where polrelid = 'public.coach_private_materials'::regclass
    and polname = 'Internal team can work the shared corpus';
  if policy_count <> 0 then
    raise exception 'coach_private_materials must not carry the shared corpus policy';
  end if;
end;
$$;

rollback;
