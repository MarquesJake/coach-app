alter table public.intelligence_items
  add column if not exists archived_at timestamptz,
  add column if not exists archive_recorded_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id) on delete set null,
  add column if not exists archive_reason text;

update public.intelligence_items
set
  archive_recorded_at = coalesce(archive_recorded_at, now()),
  archived_by = coalesce(archived_by, user_id),
  archive_reason = coalesce(
    nullif(btrim(archive_reason), ''),
    'Legacy feed refocus completed 14 July 2026; exact archive timestamp unavailable'
  )
where is_deleted = true;

alter table public.intelligence_items
  drop constraint if exists intelligence_items_archive_audit_check;

alter table public.intelligence_items
  add constraint intelligence_items_archive_audit_check
  check (
    is_deleted = false
    or (
      archive_recorded_at is not null
      and archived_by is not null
      and nullif(btrim(archive_reason), '') is not null
    )
  );

create index if not exists intelligence_items_archive_audit_idx
  on public.intelligence_items (user_id, archive_recorded_at desc)
  where is_deleted = true;

create or replace function public.require_intelligence_item_archive_metadata()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  entering_archive boolean;
begin
  if tg_op = 'INSERT' then
    entering_archive := new.is_deleted;
  else
    entering_archive := new.is_deleted and old.is_deleted = false;
  end if;

  if entering_archive and (
    new.archived_at is null
    or new.archive_recorded_at is null
    or new.archived_by is null
    or nullif(btrim(new.archive_reason), '') is null
  ) then
    raise exception 'Archiving intelligence requires archived_at, archive_recorded_at, archived_by and archive_reason';
  end if;

  return new;
end;
$$;

revoke all on function public.require_intelligence_item_archive_metadata() from public, anon, authenticated;

drop trigger if exists intelligence_items_require_archive_metadata on public.intelligence_items;
create trigger intelligence_items_require_archive_metadata
before insert or update of is_deleted on public.intelligence_items
for each row execute function public.require_intelligence_item_archive_metadata();
