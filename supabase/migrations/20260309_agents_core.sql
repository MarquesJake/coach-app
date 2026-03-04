-- Agents module: agents, coach_agents, agent_club_relationships, agent_interactions, agent_deals.
-- Idempotent: create table if not exists; drop policy if exists then create.

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  agency_name text null,
  base_location text null,
  markets text[] not null default '{}',
  languages text[] not null default '{}',
  phone text null,
  email text null,
  whatsapp text null,
  preferred_contact_channel text null,
  notes text null,
  reliability_score int null check (reliability_score between 0 and 100),
  influence_score int null check (influence_score between 0 and 100),
  responsiveness_score int null check (responsiveness_score between 0 and 100),
  risk_flag boolean not null default false,
  risk_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agents_user_id_idx on public.agents(user_id);
create index if not exists agents_full_name_idx on public.agents(full_name);

create table if not exists public.coach_agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  relationship_type text not null default 'Primary',
  started_on date null,
  ended_on date null,
  relationship_strength int null check (relationship_strength between 0 and 100),
  confidence int null check (confidence between 0 and 100),
  notes text null,
  created_at timestamptz not null default now(),
  unique (coach_id, agent_id)
);

create index if not exists coach_agents_user_id_idx on public.coach_agents(user_id);
create index if not exists coach_agents_coach_id_idx on public.coach_agents(coach_id);
create index if not exists coach_agents_agent_id_idx on public.coach_agents(agent_id);

create table if not exists public.agent_club_relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  relationship_type text not null default 'Intermediary',
  relationship_strength int null check (relationship_strength between 0 and 100),
  last_active_on date null,
  notes text null,
  created_at timestamptz not null default now(),
  unique (agent_id, club_id)
);

create index if not exists agent_club_rel_user_id_idx on public.agent_club_relationships(user_id);
create index if not exists agent_club_rel_agent_id_idx on public.agent_club_relationships(agent_id);
create index if not exists agent_club_rel_club_id_idx on public.agent_club_relationships(club_id);

create table if not exists public.agent_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  channel text null,
  direction text null,
  topic text null,
  summary text not null,
  detail text null,
  sentiment text null,
  confidence int null check (confidence between 0 and 100),
  created_at timestamptz not null default now()
);

create index if not exists agent_interactions_user_id_idx on public.agent_interactions(user_id);
create index if not exists agent_interactions_agent_id_idx on public.agent_interactions(agent_id);
create index if not exists agent_interactions_occurred_at_idx on public.agent_interactions(occurred_at);

create table if not exists public.agent_deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  coach_id uuid null references public.coaches(id) on delete set null,
  club_id uuid null references public.clubs(id) on delete set null,
  deal_type text not null,
  season text null,
  value_band text null,
  notes text null,
  occurred_on date null,
  created_at timestamptz not null default now()
);

create index if not exists agent_deals_user_id_idx on public.agent_deals(user_id);
create index if not exists agent_deals_agent_id_idx on public.agent_deals(agent_id);

alter table public.agents enable row level security;
alter table public.coach_agents enable row level security;
alter table public.agent_club_relationships enable row level security;
alter table public.agent_interactions enable row level security;
alter table public.agent_deals enable row level security;

drop policy if exists agents_select on public.agents;
create policy agents_select on public.agents for select using (auth.uid() = user_id);
drop policy if exists agents_insert on public.agents;
create policy agents_insert on public.agents for insert with check (auth.uid() = user_id);
drop policy if exists agents_update on public.agents;
create policy agents_update on public.agents for update using (auth.uid() = user_id);
drop policy if exists agents_delete on public.agents;
create policy agents_delete on public.agents for delete using (auth.uid() = user_id);

drop policy if exists coach_agents_select on public.coach_agents;
create policy coach_agents_select on public.coach_agents for select using (auth.uid() = user_id);
drop policy if exists coach_agents_insert on public.coach_agents;
create policy coach_agents_insert on public.coach_agents for insert with check (auth.uid() = user_id);
drop policy if exists coach_agents_update on public.coach_agents;
create policy coach_agents_update on public.coach_agents for update using (auth.uid() = user_id);
drop policy if exists coach_agents_delete on public.coach_agents;
create policy coach_agents_delete on public.coach_agents for delete using (auth.uid() = user_id);

drop policy if exists agent_club_select on public.agent_club_relationships;
create policy agent_club_select on public.agent_club_relationships for select using (auth.uid() = user_id);
drop policy if exists agent_club_insert on public.agent_club_relationships;
create policy agent_club_insert on public.agent_club_relationships for insert with check (auth.uid() = user_id);
drop policy if exists agent_club_update on public.agent_club_relationships;
create policy agent_club_update on public.agent_club_relationships for update using (auth.uid() = user_id);
drop policy if exists agent_club_delete on public.agent_club_relationships;
create policy agent_club_delete on public.agent_club_relationships for delete using (auth.uid() = user_id);

drop policy if exists agent_interactions_select on public.agent_interactions;
create policy agent_interactions_select on public.agent_interactions for select using (auth.uid() = user_id);
drop policy if exists agent_interactions_insert on public.agent_interactions;
create policy agent_interactions_insert on public.agent_interactions for insert with check (auth.uid() = user_id);
drop policy if exists agent_interactions_update on public.agent_interactions;
create policy agent_interactions_update on public.agent_interactions for update using (auth.uid() = user_id);
drop policy if exists agent_interactions_delete on public.agent_interactions;
create policy agent_interactions_delete on public.agent_interactions for delete using (auth.uid() = user_id);

drop policy if exists agent_deals_select on public.agent_deals;
create policy agent_deals_select on public.agent_deals for select using (auth.uid() = user_id);
drop policy if exists agent_deals_insert on public.agent_deals;
create policy agent_deals_insert on public.agent_deals for insert with check (auth.uid() = user_id);
drop policy if exists agent_deals_update on public.agent_deals;
create policy agent_deals_update on public.agent_deals for update using (auth.uid() = user_id);
drop policy if exists agent_deals_delete on public.agent_deals;
create policy agent_deals_delete on public.agent_deals for delete using (auth.uid() = user_id);
