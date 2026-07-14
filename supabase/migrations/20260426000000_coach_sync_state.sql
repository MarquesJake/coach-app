BEGIN;

create table if not exists public.integration_sync_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sync_key text not null,
  status text not null default 'idle',
  cursor integer not null default 0,
  total integer not null default 0,
  result jsonb null,
  error text null,
  started_at timestamptz null,
  updated_at timestamptz not null default now(),
  completed_at timestamptz null,
  unique (user_id, sync_key)
);

create index if not exists integration_sync_state_user_id_idx on public.integration_sync_state(user_id);
create index if not exists integration_sync_state_sync_key_idx on public.integration_sync_state(sync_key);

alter table public.integration_sync_state enable row level security;

drop policy if exists integration_sync_state_select on public.integration_sync_state;
create policy integration_sync_state_select on public.integration_sync_state
for select using (auth.uid() = user_id);

drop policy if exists integration_sync_state_insert on public.integration_sync_state;
create policy integration_sync_state_insert on public.integration_sync_state
for insert with check (auth.uid() = user_id);

drop policy if exists integration_sync_state_update on public.integration_sync_state;
create policy integration_sync_state_update on public.integration_sync_state
for update using (auth.uid() = user_id);

drop policy if exists integration_sync_state_delete on public.integration_sync_state;
create policy integration_sync_state_delete on public.integration_sync_state
for delete using (auth.uid() = user_id);

COMMIT;

