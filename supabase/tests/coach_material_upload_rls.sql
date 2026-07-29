\set ON_ERROR_STOP on

begin;

create temp table material_upload_test_context as
select
  '77777777-7777-4777-8777-777777777771'::uuid as organization_id,
  '77777777-7777-4777-8777-777777777772'::uuid as outsider_id,
  coach.id as coach_id,
  coach.user_id
from public.coaches coach
join auth.users app_user on app_user.id = coach.user_id
limit 1;

grant select on material_upload_test_context to authenticated;

do $$
begin
  if not exists (select 1 from material_upload_test_context) then
    raise exception 'Coach material RLS test requires one owned coach';
  end if;
end;
$$;

insert into auth.users (
  id, aud, role, email, email_confirmed_at, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at
)
select
  outsider_id, 'authenticated', 'authenticated',
  'material-upload-outsider@coachfirst.invalid', now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
from material_upload_test_context;

insert into public.organizations (
  id, name, slug, organization_type, status, coach_id, created_by
)
select
  organization_id, 'Material upload RLS test', 'material-upload-rls-test',
  'coach_business', 'active', coach_id, user_id
from material_upload_test_context;

insert into public.organization_memberships (
  organization_id, user_id, role, status, accepted_at
)
select organization_id, user_id, 'coach', 'active', now()
from material_upload_test_context;

select set_config(
  'request.jwt.claim.sub',
  (select user_id::text from material_upload_test_context),
  true
);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select user_id::text from material_upload_test_context),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

create temp table material_upload_reservation as
select *
from public.begin_own_coach_material_upload(
  (select coach_id from material_upload_test_context),
  'RLS contract video',
  'training_video',
  'Transaction-rollback storage contract test',
  '',
  'training-session.mp4',
  'video/mp4',
  1024
);

insert into storage.objects (bucket_id, name, owner_id, metadata)
select
  'coach-private-materials',
  storage_path,
  (select user_id from material_upload_test_context),
  '{"size":1024,"mimetype":"video/mp4"}'::jsonb
from material_upload_reservation;

do $$
declare
  direct_upload_denied boolean := false;
  completed boolean;
  material_status text;
begin
  begin
    insert into storage.objects (bucket_id, name, owner_id, metadata)
    values (
      'coach-private-materials',
      (select coach_id::text from material_upload_test_context) || '/unreserved.mp4',
      (select user_id from material_upload_test_context),
      '{"size":1024,"mimetype":"video/mp4"}'::jsonb
    );
  exception when others then
    direct_upload_denied := true;
  end;
  if not direct_upload_denied then
    raise exception 'Unreserved coach material entered storage';
  end if;

  select public.complete_own_coach_material_upload(
    (select material_id from material_upload_reservation)
  ) into completed;
  if not completed then raise exception 'Reserved upload did not complete'; end if;

  select upload_status into material_status
  from public.coach_private_materials
  where id = (select material_id from material_upload_reservation);
  if material_status <> 'uploaded' then
    raise exception 'Completed object was not promoted to uploaded status';
  end if;
end;
$$;

select set_config(
  'request.jwt.claim.sub',
  (select outsider_id::text from material_upload_test_context),
  true
);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select outsider_id::text from material_upload_test_context),
    'role', 'authenticated'
  )::text,
  true
);

do $$
declare
  outsider_denied boolean := false;
begin
  begin
    perform public.begin_own_coach_material_upload(
      (select coach_id from material_upload_test_context),
      'Outsider upload',
      'training_video',
      '',
      '',
      'outsider.mp4',
      'video/mp4',
      1024
    );
  exception when others then
    outsider_denied := true;
  end;
  if not outsider_denied then
    raise exception 'A user outside the coach organisation reserved an upload';
  end if;
end;
$$;

rollback;
