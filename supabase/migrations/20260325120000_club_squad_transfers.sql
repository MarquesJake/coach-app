-- Club squad: current players from API-Football
create table if not exists public.club_squad (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  player_id integer not null,
  name text not null,
  age integer null,
  position text null,
  number integer null,
  photo_url text null,
  season text not null default '2024',
  synced_at timestamptz not null default now(),
  unique (club_id, player_id)
);

alter table public.club_squad enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'club_squad' and policyname = 'users own squad'
  ) then
    execute 'create policy "users own squad" on public.club_squad
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
end $$;

-- Club transfers: recent ins/outs from API-Football
create table if not exists public.club_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  player_name text not null,
  player_id integer null,
  direction text not null check (direction in ('in', 'out')),
  other_club text null,
  transfer_type text null,
  fee_amount numeric null,
  fee_currency text null,
  transfer_date date null,
  season text null,
  synced_at timestamptz not null default now()
);

alter table public.club_transfers enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'club_transfers' and policyname = 'users own transfers'
  ) then
    execute 'create policy "users own transfers" on public.club_transfers
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
end $$;

-- Track when each club's squad/coaching data was last synced
alter table public.clubs add column if not exists squad_synced_at timestamptz null;
alter table public.clubs add column if not exists coaches_synced_at timestamptz null;
alter table public.clubs add column if not exists transfers_synced_at timestamptz null;
