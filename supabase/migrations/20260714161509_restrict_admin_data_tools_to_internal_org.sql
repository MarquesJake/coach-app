-- These ownership-bootstrap helpers can see and mutate rows across users.
-- Authentication alone is insufficient once real club and coach accounts
-- exist; require an active internal owner/admin membership inside each RPC.

create or replace function public.get_unowned_counts()
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  clubs_count bigint := 0;
  coaches_count bigint := 0;
  has_clubs_user_id boolean := false;
  has_coaches_user_id boolean := false;
begin
  if uid is null or not exists (
    select 1
    from public.organization_memberships membership
    join public.organizations organization
      on organization.id = membership.organization_id
    where membership.user_id = uid
      and membership.status = 'active'
      and membership.role in ('owner', 'admin')
      and organization.organization_type = 'internal'
      and organization.status = 'active'
  ) then
    raise exception 'Internal administrator access required';
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'clubs'
      and column_name = 'user_id'
  ) into has_clubs_user_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'coaches'
      and column_name = 'user_id'
  ) into has_coaches_user_id;

  if has_clubs_user_id then
    select count(*)
    into clubs_count
    from public.clubs
    where user_id is null;
  end if;

  if has_coaches_user_id then
    select count(*)
    into coaches_count
    from public.coaches
    where user_id is null;
  end if;

  return json_build_object(
    'clubs', clubs_count,
    'coaches', coaches_count,
    'clubs_has_user_id', has_clubs_user_id,
    'coaches_has_user_id', has_coaches_user_id
  );
end;
$$;

create or replace function public.claim_unowned_rows()
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  clubs_updated bigint := 0;
  coaches_updated bigint := 0;
  has_clubs_user_id boolean := false;
  has_coaches_user_id boolean := false;
begin
  if uid is null or not exists (
    select 1
    from public.organization_memberships membership
    join public.organizations organization
      on organization.id = membership.organization_id
    where membership.user_id = uid
      and membership.status = 'active'
      and membership.role in ('owner', 'admin')
      and organization.organization_type = 'internal'
      and organization.status = 'active'
  ) then
    raise exception 'Internal administrator access required';
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'clubs'
      and column_name = 'user_id'
  ) into has_clubs_user_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'coaches'
      and column_name = 'user_id'
  ) into has_coaches_user_id;

  if has_clubs_user_id then
    with updated as (
      update public.clubs
      set user_id = uid
      where user_id is null
      returning 1
    )
    select count(*) into clubs_updated from updated;
  end if;

  if has_coaches_user_id then
    with updated as (
      update public.coaches
      set user_id = uid
      where user_id is null
      returning 1
    )
    select count(*) into coaches_updated from updated;
  end if;

  return json_build_object(
    'clubs_claimed', clubs_updated,
    'coaches_claimed', coaches_updated,
    'clubs_has_user_id', has_clubs_user_id,
    'coaches_has_user_id', has_coaches_user_id
  );
end;
$$;

revoke all on function public.claim_unowned_rows() from public, anon;
revoke all on function public.get_unowned_counts() from public, anon;
grant execute on function public.claim_unowned_rows() to authenticated;
grant execute on function public.get_unowned_counts() to authenticated;
