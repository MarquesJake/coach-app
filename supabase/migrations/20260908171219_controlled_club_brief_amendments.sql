-- Original agreed wording stays immutable. Accepted requests form numbered versions.
-- Writes run as the caller: grants, RLS and trigger validation all apply.
create schema if not exists private;

create table public.club_brief_amendments (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references public.club_briefs(id) on delete restrict,
  base_version integer not null check (base_version >= 1),
  accepted_version integer,
  changes jsonb not null,
  before_snapshot jsonb not null default '{}'::jsonb,
  after_snapshot jsonb not null default '{}'::jsonb,
  request_reason text not null check (length(btrim(request_reason)) between 1 and 4000),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  requested_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  requested_at timestamptz not null default now(),
  decision_note text,
  next_action text,
  reviewed_by uuid references auth.users(id) on delete restrict,
  reviewed_at timestamptz,
  check ((status = 'pending' and reviewed_by is null and reviewed_at is null and decision_note is null and next_action is null)
    or (status <> 'pending' and reviewed_by is not null and reviewed_at is not null
      and length(btrim(decision_note)) between 1 and 4000 and length(btrim(next_action)) between 1 and 4000)),
  check ((status = 'accepted' and accepted_version = base_version + 1)
    or (status <> 'accepted' and accepted_version is null))
);
create unique index club_brief_one_pending_amendment on public.club_brief_amendments(brief_id) where status = 'pending';
create unique index club_brief_accepted_version on public.club_brief_amendments(brief_id, accepted_version) where status = 'accepted';
create index club_brief_amendment_history on public.club_brief_amendments(brief_id, requested_at desc);
alter table public.club_brief_amendments enable row level security;
revoke all on public.club_brief_amendments from public, anon, authenticated;
grant select on public.club_brief_amendments to authenticated;
grant insert (brief_id, base_version, changes, request_reason) on public.club_brief_amendments to authenticated;
grant update (status, decision_note, next_action) on public.club_brief_amendments to authenticated;

create policy "Brief participants read amendment history" on public.club_brief_amendments
for select to authenticated using (exists (
  select 1 from public.club_briefs b join public.organizations o
    on o.id in (b.buyer_organization_id, b.service_organization_id)
  where b.id = brief_id and o.status = 'active' and public.is_organization_member(o.id)
));
create policy "Club decision makers request amendments" on public.club_brief_amendments
for insert to authenticated with check (requested_by = (select auth.uid()) and status = 'pending' and exists (
  select 1 from public.club_briefs b join public.organizations o on o.id = b.buyer_organization_id
  where b.id = brief_id and o.status = 'active' and o.organization_type = 'club'
    and public.is_organization_member(o.id, array['owner','admin','club_owner','club_director'])
));
create policy "Service analysts decide amendments" on public.club_brief_amendments
for update to authenticated using (status = 'pending' and exists (
  select 1 from public.club_briefs b join public.organizations o on o.id = b.service_organization_id
  where b.id = brief_id and o.status = 'active' and o.organization_type = 'internal'
    and public.is_organization_member(o.id, array['owner','admin','analyst'])
)) with check (status in ('accepted','declined') and reviewed_by = (select auth.uid()) and exists (
  select 1 from public.club_briefs b join public.organizations o on o.id = b.service_organization_id
  where b.id = brief_id and o.status = 'active' and o.organization_type = 'internal'
    and public.is_organization_member(o.id, array['owner','admin','analyst'])
));

create function private.validate_club_brief_amendment() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  brief public.club_briefs%rowtype;
  current_snapshot jsonb;
  current_version integer;
  field_names text[] := array['title', 'role_title', 'appointment_context', 'football_identity', 'in_possession_requirements', 'out_of_possession_requirements', 'transition_requirements', 'set_piece_requirements', 'squad_context', 'player_development_priorities', 'leadership_and_culture', 'budget_parameters', 'availability_timeline', 'location_requirements', 'work_permit_position', 'process_requirements', 'confidentiality_notes'];
begin
  if (select auth.uid()) is null then raise exception 'Sign in to manage amendments'; end if;
  -- Serialize submissions and decisions on the source brief, including different requests.
  select * into brief from public.club_briefs where id = new.brief_id for update;
  if not found or brief.linked_mandate_id is null or brief.status <> 'converted' then
    raise exception 'Only an agreed, linked brief can be amended';
  end if;
  select a.after_snapshot, a.accepted_version into current_snapshot, current_version
    from public.club_brief_amendments a where a.brief_id = brief.id and a.status = 'accepted'
    order by a.accepted_version desc limit 1;
  if current_version is null then
    current_version := 1;
    select jsonb_object_agg(key, value) into current_snapshot
      from jsonb_each(to_jsonb(brief)) where key = any(field_names);
  end if;
  if new.base_version <> current_version then raise exception 'The agreed brief has changed. Reload before requesting or deciding an amendment'; end if;
  if tg_op = 'INSERT' then
    if not public.is_organization_member(brief.buyer_organization_id, array['owner','admin','club_owner','club_director']) then
      raise exception 'Only club decision makers can request an amendment';
    end if;
    if jsonb_typeof(new.changes) <> 'object' or new.changes = '{}'::jsonb then raise exception 'Specify at least one changed field'; end if;
    if exists (select 1 from jsonb_each(new.changes) where not (key = any(field_names))
      or jsonb_typeof(value) not in ('string','null') or length(value #>> '{}') > 12000) then
      raise exception 'Invalid amendment fields';
    end if;
    -- Store only material changes; null means the club explicitly removed the wording.
    select jsonb_object_agg(key, value) into new.changes from jsonb_each(new.changes)
      where value is distinct from current_snapshot -> key;
    if new.changes is null then raise exception 'The request does not change the agreed brief'; end if;
    new.before_snapshot := current_snapshot;
    new.after_snapshot := current_snapshot || new.changes;
    if coalesce(length(btrim(new.after_snapshot ->> 'title')), 0) = 0
      or coalesce(length(btrim(new.after_snapshot ->> 'role_title')), 0) = 0 then
      raise exception 'Brief title and role are required';
    end if;
    new.request_reason := btrim(new.request_reason);
    new.status := 'pending';
    new.requested_by := (select auth.uid());
    new.requested_at := clock_timestamp();
    new.accepted_version := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.decision_note := null;
    new.next_action := null;
  else
    if old.status <> 'pending' or new.status not in ('accepted','declined') then raise exception 'This request has already been decided'; end if;
    if not public.is_organization_member(brief.service_organization_id, array['owner','admin','analyst']) then
      raise exception 'Only the responsible service team can decide an amendment';
    end if;
    if (to_jsonb(new) - array['status','decision_note','next_action']) is distinct from
      (to_jsonb(old) - array['status','decision_note','next_action']) then raise exception 'Request history cannot be rewritten'; end if;
    if new.before_snapshot is distinct from current_snapshot then raise exception 'The agreed wording has changed. Reload before reviewing'; end if;
    new.decision_note := btrim(new.decision_note);
    new.next_action := btrim(new.next_action);
    if coalesce(length(new.decision_note),0) not between 1 and 4000
      or coalesce(length(new.next_action),0) not between 1 and 4000 then raise exception 'Record a decision reason and next action for the club'; end if;
    new.reviewed_by := (select auth.uid());
    new.reviewed_at := clock_timestamp();
    new.accepted_version := case when new.status = 'accepted' then current_version + 1 else null end;
  end if;
  return new;
end;
$$;
revoke all on function private.validate_club_brief_amendment() from public, anon, authenticated;
create trigger validate_club_brief_amendment before insert or update on public.club_brief_amendments
for each row execute function private.validate_club_brief_amendment();

create function private.protect_agreed_club_brief() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if old.status = 'converted' or old.linked_mandate_id is not null then
      if (to_jsonb(new) - 'updated_at') is distinct from (to_jsonb(old) - 'updated_at') then
        raise exception 'Agreed wording is immutable. Submit a separate amendment request';
      end if;
      return new;
    end if;
    if new.buyer_organization_id <> old.buyer_organization_id or new.service_organization_id <> old.service_organization_id
      or new.club_id is distinct from old.club_id or new.created_by <> old.created_by or new.id <> old.id then
      raise exception 'Brief ownership and club cannot be changed';
    end if;
  end if;
  if new.status = 'converted' or new.linked_mandate_id is not null then
    if not public.is_organization_member(new.service_organization_id, array['owner','admin','analyst'])
      or not public.is_internal_operator(array['owner','admin','analyst']) then raise exception 'Only the responsible service team can agree a brief'; end if;
    if new.status <> 'converted' or new.linked_mandate_id is null or new.club_id is null
      or not exists (select 1 from public.mandates m where m.id = new.linked_mandate_id and m.club_id = new.club_id) then
      raise exception 'Select a mandate for the same club';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.protect_agreed_club_brief() from public, anon, authenticated;
create trigger protect_agreed_club_brief before insert or update on public.club_briefs
for each row execute function private.protect_agreed_club_brief();
