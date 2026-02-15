-- Coach Matchmaking Platform - Database Schema
-- Clean version aligned to live Supabase tables

create extension if not exists "uuid-ossp";

-- ============================================
-- CLUBS
-- ============================================
create table if not exists public.clubs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  league text not null,
  country text not null,
  ownership_model text not null default 'private',
  created_at timestamptz default now() not null
);

alter table public.clubs enable row level security;

create policy if not exists "Users can view their own club"
  on public.clubs for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert their own club"
  on public.clubs for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update their own club"
  on public.clubs for update
  using (auth.uid() = user_id);

-- ============================================
-- VACANCIES
-- ============================================
create table if not exists public.vacancies (
  id uuid primary key default uuid_generate_v4(),
  club_id uuid references public.clubs(id) on delete cascade not null,
  role_type text not null default 'Head Coach',
  objective text not null,
  style_of_play text not null,
  pressing_level text not null,
  build_style text not null,
  budget_range text not null,
  staff_budget text not null,
  timeline text not null,
  league_experience_required boolean default false,
  status text not null default 'open',
  created_at timestamptz default now() not null
);

alter table public.vacancies enable row level security;

create policy if not exists "Users can view vacancies for their clubs"
  on public.vacancies for select
  using (
    club_id in (
      select id from public.clubs where user_id = auth.uid()
    )
  );

create policy if not exists "Users can insert vacancies for their clubs"
  on public.vacancies for insert
  with check (
    club_id in (
      select id from public.clubs where user_id = auth.uid()
    )
  );

-- ============================================
-- COACHES
-- ============================================
create table if not exists public.coaches (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  age integer,
  nationality text,
  role_current text not null default 'Unemployed',
  club_current text,
  preferred_style text not null,
  pressing_intensity text not null,
  build_preference text not null,
  leadership_style text not null,
  wage_expectation text not null,
  staff_cost_estimate text not null,
  available_status text not null default 'Available',
  reputation_tier text not null default 'Established',
  league_experience text[] default '{}'::text[],
  last_updated timestamptz default now() not null
);

alter table public.coaches enable row level security;

create policy if not exists "Authenticated users can view coaches"
  on public.coaches for select
  using (auth.role() = 'authenticated');

-- ============================================
-- COACH UPDATES (INTELLIGENCE FEED)
-- ============================================
create table if not exists public.coach_updates (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references public.coaches(id) on delete cascade,
  update_note text not null,
  update_type text default 'general',
  availability_change text,
  reputation_shift text,
  date_added timestamptz default now()
);

alter table public.coach_updates enable row level security;

create policy if not exists "Authenticated users can view coach updates"
  on public.coach_updates for select
  using (auth.role() = 'authenticated');

-- ============================================
-- MATCHES (SHORTLIST RESULTS)
-- ============================================
create table if not exists public.matches (
  id uuid primary key default uuid_generate_v4(),
  vacancy_id uuid references public.vacancies(id) on delete cascade not null,
  coach_id uuid references public.coaches(id) on delete cascade not null,
  tactical_fit_score numeric(5,2) default 0,
  squad_fit_score numeric(5,2) default 0,
  financial_fit_score numeric(5,2) default 0,
  cultural_fit_score numeric(5,2) default 0,
  availability_score numeric(5,2) default 0,
  overall_score numeric(5,2) default 0,
  created_at timestamptz default now(),
  unique(vacancy_id, coach_id)
);

alter table public.matches enable row level security;

create policy if not exists "Users can view matches for their vacancies"
  on public.matches for select
  using (
    vacancy_id in (
      select v.id from public.vacancies v
      join public.clubs c on v.club_id = c.id
      where c.user_id = auth.uid()
    )
  );