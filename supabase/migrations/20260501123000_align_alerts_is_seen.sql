-- Align alerts unread state with the live schema and application code.
-- Keep legacy `seen` if it exists so older environments can roll forward safely.

begin;

alter table public.alerts
  add column if not exists is_seen boolean not null default false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'alerts'
      and column_name = 'seen'
  ) then
    update public.alerts
    set is_seen = seen
    where is_seen is distinct from seen;
  end if;
end $$;

drop index if exists public.alerts_user_seen_idx;

create index if not exists alerts_user_is_seen_idx
  on public.alerts (user_id, is_seen);

commit;
