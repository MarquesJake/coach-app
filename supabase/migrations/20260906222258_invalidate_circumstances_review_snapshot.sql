create schema if not exists private;
create or replace function private.invalidate_circumstances_review_snapshot()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- The trigger may only invalidate the same coach's prior review, never redirect it.
  if new.coach_id is distinct from old.coach_id then
    raise exception 'A coach declaration cannot be reassigned';
  end if;
  if row(new.current_salary, new.salary_expectation, new.contract_expiry,
      new.release_compensation, new.availability_timeline, new.family_situation,
      new.relocation_requirements, new.staff_cost_expectation, new.appointment_conditions,
      new.circumstances_visibility)
    is distinct from row(old.current_salary, old.salary_expectation, old.contract_expiry,
      old.release_compensation, old.availability_timeline, old.family_situation,
      old.relocation_requirements, old.staff_cost_expectation, old.appointment_conditions,
      old.circumstances_visibility) then
    new.feasibility_review_status := 'draft';
    new.feasibility_reviewed_at := null;
    new.feasibility_reviewed_by := null;
  end if;
  if new.feasibility_review_status <> 'verified' or new.feasibility_reviewed_at is null then
    update public.coaches set feasibility_reviewed_at = null, feasibility_reviewed_by = null
      where id = old.coach_id;
  end if;
  return new;
end;
$$;
revoke all on function private.invalidate_circumstances_review_snapshot() from public, anon, authenticated;
create trigger invalidate_circumstances_review_snapshot
  before update on public.coach_portal_profiles for each row
  execute function private.invalidate_circumstances_review_snapshot();
