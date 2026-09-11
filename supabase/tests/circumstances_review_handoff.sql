-- Isolated fixtures only; no existing coach declarations are read or changed.
begin;
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('dbac0001-0000-4000-8000-000000000001','authenticated','authenticated','circumstances-owner@coachfirst.invalid','{}','{}',now(),now()),
 ('dbac0001-0000-4000-8000-000000000002','authenticated','authenticated','circumstances-reviewer@coachfirst.invalid','{}','{}',now(),now());
insert into public.organization_memberships (organization_id,user_id,role,status)
select id,'dbac0001-0000-4000-8000-000000000002','analyst','active' from public.organizations where slug='coach-first';
insert into public.coaches (id,user_id,name,preferred_style,pressing_intensity,build_preference,leadership_style,wage_expectation,staff_cost_estimate,available_status)
values ('dbac0001-0000-4000-8000-000000000003','dbac0001-0000-4000-8000-000000000001','QA ONLY review handoff','Balanced','Medium','Mixed','Collaborative','QA only','QA only','Unknown');
insert into public.coach_portal_profiles (coach_id,user_id,current_salary,feasibility_review_status)
values ('dbac0001-0000-4000-8000-000000000003','dbac0001-0000-4000-8000-000000000001','QA declaration A','draft');
select set_config('request.jwt.claim.sub','dbac0001-0000-4000-8000-000000000002',true);
set local role authenticated;
select public.verify_coach_career_circumstances('dbac0001-0000-4000-8000-000000000003');
do $$ begin
  if not exists (select 1 from public.coach_portal_profiles where coach_id='dbac0001-0000-4000-8000-000000000003' and user_id='dbac0001-0000-4000-8000-000000000001' and feasibility_review_status='verified') then
    raise exception 'Shared verification failed or changed ownership';
  end if;
end $$;
reset role;
update public.coach_portal_profiles set current_salary='QA revised declaration B' where coach_id='dbac0001-0000-4000-8000-000000000003';
do $$ begin
  if exists (select 1 from public.coaches where id='dbac0001-0000-4000-8000-000000000003' and feasibility_reviewed_at is not null) then
    raise exception 'Old coach review timestamp survived declaration edit';
  end if;
  if exists (select 1 from public.coach_portal_profiles where coach_id='dbac0001-0000-4000-8000-000000000003' and feasibility_review_status='verified') then
    raise exception 'Edited declaration still appears verified';
  end if;
end $$;
select set_config('request.jwt.claim.sub','dbac0001-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ begin
  begin
    perform public.verify_coach_career_circumstances('dbac0001-0000-4000-8000-000000000003');
    raise exception 'FAIL: non-internal identity verified declarations';
  exception when others then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;
end $$;
rollback;
