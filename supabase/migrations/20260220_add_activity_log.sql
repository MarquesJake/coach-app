-- Global activity log for audit and timelines
create table if not exists public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  entity_type text not null,
  entity_id uuid not null,
  action_type text not null,
  description text not null,
  metadata jsonb default null,
  created_at timestamptz default now() not null
);

create index if not exists activity_log_entity_idx on public.activity_log (entity_type, entity_id);
create index if not exists activity_log_created_at_idx on public.activity_log (created_at desc);

alter table public.activity_log enable row level security;

drop policy if exists "Users can view own activity log" on public.activity_log;
create policy "Users can view own activity log"
  on public.activity_log for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own activity log" on public.activity_log;
create policy "Users can insert own activity log"
  on public.activity_log for insert
  with check (auth.uid() = user_id);
