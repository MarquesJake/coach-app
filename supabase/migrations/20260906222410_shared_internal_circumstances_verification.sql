create or replace function public.verify_coach_career_circumstances(p_coach_id uuid)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare portal public.coach_portal_profiles%rowtype;
begin
  if (select auth.uid()) is null or not public.is_internal_operator(array['owner','admin','analyst']) then
    raise exception 'Active internal review access required';
  end if;
  select * into portal from public.coach_portal_profiles where coach_id = p_coach_id for update;
  if portal.id is null then raise exception 'Coach circumstances were not found'; end if;
  update public.coaches set
    current_salary = portal.current_salary,
    wage_expectation = coalesce(portal.salary_expectation, ''),
    contract_expiry = portal.contract_expiry,
    compensation_expectation = portal.release_compensation,
    availability_timeline = portal.availability_timeline,
    family_context = portal.family_situation,
    relocation_flexibility = portal.relocation_requirements,
    staff_cost_estimate = coalesce(portal.staff_cost_expectation, ''),
    appointment_conditions = portal.appointment_conditions,
    feasibility_reviewed_at = now(), feasibility_reviewed_by = (select auth.uid()),
    last_updated = now(), updated_at = now()
  where id = p_coach_id;
  if not found then raise exception 'Coach not found'; end if;
  update public.coach_portal_profiles set feasibility_review_status = 'verified',
    feasibility_reviewed_at = now(), feasibility_reviewed_by = (select auth.uid()), updated_at = now()
  where id = portal.id;
  if not found then raise exception 'Coach declaration update was not permitted'; end if;
  return true;
end;
$$;
revoke all on function public.verify_coach_career_circumstances(uuid) from public, anon;
grant execute on function public.verify_coach_career_circumstances(uuid) to authenticated;
