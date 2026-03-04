-- demo_seeds: idempotency marker for demo data per user (investor demo generator)
create table if not exists public.demo_seeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  version int default 1 not null,
  unique (user_id)
);

create index if not exists demo_seeds_user_id_idx on public.demo_seeds (user_id);

alter table public.demo_seeds enable row level security;

drop policy if exists "Users can select own demo_seeds" on public.demo_seeds;
create policy "Users can select own demo_seeds"
  on public.demo_seeds for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own demo_seeds" on public.demo_seeds;
create policy "Users can insert own demo_seeds"
  on public.demo_seeds for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own demo_seeds" on public.demo_seeds;
create policy "Users can update own demo_seeds"
  on public.demo_seeds for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
