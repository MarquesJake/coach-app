'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const MIGRATION_20260227_SQL = `-- Bootstrap user_id for ownership and RLS where columns may be missing.
-- Safe to run repeatedly. Use Admin > Data tools to "Claim" unowned rows after running.

alter table public.clubs
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.coaches
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.clubs enable row level security;

drop policy if exists "Users can view own clubs" on public.clubs;
create policy "Users can view own clubs" on public.clubs for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own clubs" on public.clubs;
create policy "Users can insert own clubs" on public.clubs for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own clubs" on public.clubs;
create policy "Users can update own clubs" on public.clubs for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own clubs" on public.clubs;
create policy "Users can delete own clubs" on public.clubs for delete using (auth.uid() = user_id);

alter table public.coaches enable row level security;

drop policy if exists "Users can view own coaches" on public.coaches;
create policy "Users can view own coaches" on public.coaches for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own coaches" on public.coaches;
create policy "Users can insert own coaches" on public.coaches for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own coaches" on public.coaches;
create policy "Users can update own coaches" on public.coaches for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own coaches" on public.coaches;
create policy "Users can delete own coaches" on public.coaches for delete using (auth.uid() = user_id);

create or replace function public.get_unowned_counts()
returns json language plpgsql security definer set search_path = public as $$
declare
  clubs_count bigint := 0;
  coaches_count bigint := 0;
  has_clubs_user_id boolean := false;
  has_coaches_user_id boolean := false;
begin
  select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clubs' and column_name = 'user_id') into has_clubs_user_id;
  select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'coaches' and column_name = 'user_id') into has_coaches_user_id;
  if has_clubs_user_id then select count(*) from public.clubs where user_id is null into clubs_count; end if;
  if has_coaches_user_id then select count(*) from public.coaches where user_id is null into coaches_count; end if;
  return json_build_object('clubs', clubs_count, 'coaches', coaches_count, 'clubs_has_user_id', has_clubs_user_id, 'coaches_has_user_id', has_coaches_user_id);
end; $$;

create or replace function public.claim_unowned_rows()
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  clubs_updated bigint := 0;
  coaches_updated bigint := 0;
  has_clubs_user_id boolean := false;
  has_coaches_user_id boolean := false;
begin
  if uid is null then return json_build_object('error', 'Not authenticated'); end if;
  select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clubs' and column_name = 'user_id') into has_clubs_user_id;
  select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'coaches' and column_name = 'user_id') into has_coaches_user_id;
  if has_clubs_user_id then with updated as (update public.clubs set user_id = uid where user_id is null returning 1) select count(*) from updated into clubs_updated; end if;
  if has_coaches_user_id then with updated as (update public.coaches set user_id = uid where user_id is null returning 1) select count(*) from updated into coaches_updated; end if;
  return json_build_object('clubs_claimed', clubs_updated, 'coaches_claimed', coaches_updated, 'clubs_has_user_id', has_clubs_user_id, 'coaches_has_user_id', has_coaches_user_id);
end; $$;
`

export function CopyMigrationButton() {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(MIGRATION_20260227_SQL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy SQL to clipboard'}
    </button>
  )
}
