-- Config tables: all scoped by user_id, with RLS.
-- Base columns: id, user_id, name, sort_order, is_active, created_at, updated_at

create table if not exists public.config_pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.config_reputation_tiers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.config_availability_statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.config_preferred_styles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.config_pressing_intensity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.config_build_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.config_mandate_preference_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.config_formation_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  formation text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.config_scoring_weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  key text not null,
  weight numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, key)
);

-- RLS: enable and policy so user sees only own rows
alter table public.config_pipeline_stages enable row level security;
alter table public.config_reputation_tiers enable row level security;
alter table public.config_availability_statuses enable row level security;
alter table public.config_preferred_styles enable row level security;
alter table public.config_pressing_intensity enable row level security;
alter table public.config_build_preferences enable row level security;
alter table public.config_mandate_preference_categories enable row level security;
alter table public.config_formation_presets enable row level security;
alter table public.config_scoring_weights enable row level security;

create policy "config_pipeline_stages_select" on public.config_pipeline_stages for select using (auth.uid() = user_id);
create policy "config_pipeline_stages_insert" on public.config_pipeline_stages for insert with check (auth.uid() = user_id);
create policy "config_pipeline_stages_update" on public.config_pipeline_stages for update using (auth.uid() = user_id);
create policy "config_pipeline_stages_delete" on public.config_pipeline_stages for delete using (auth.uid() = user_id);

create policy "config_reputation_tiers_select" on public.config_reputation_tiers for select using (auth.uid() = user_id);
create policy "config_reputation_tiers_insert" on public.config_reputation_tiers for insert with check (auth.uid() = user_id);
create policy "config_reputation_tiers_update" on public.config_reputation_tiers for update using (auth.uid() = user_id);
create policy "config_reputation_tiers_delete" on public.config_reputation_tiers for delete using (auth.uid() = user_id);

create policy "config_availability_statuses_select" on public.config_availability_statuses for select using (auth.uid() = user_id);
create policy "config_availability_statuses_insert" on public.config_availability_statuses for insert with check (auth.uid() = user_id);
create policy "config_availability_statuses_update" on public.config_availability_statuses for update using (auth.uid() = user_id);
create policy "config_availability_statuses_delete" on public.config_availability_statuses for delete using (auth.uid() = user_id);

create policy "config_preferred_styles_select" on public.config_preferred_styles for select using (auth.uid() = user_id);
create policy "config_preferred_styles_insert" on public.config_preferred_styles for insert with check (auth.uid() = user_id);
create policy "config_preferred_styles_update" on public.config_preferred_styles for update using (auth.uid() = user_id);
create policy "config_preferred_styles_delete" on public.config_preferred_styles for delete using (auth.uid() = user_id);

create policy "config_pressing_intensity_select" on public.config_pressing_intensity for select using (auth.uid() = user_id);
create policy "config_pressing_intensity_insert" on public.config_pressing_intensity for insert with check (auth.uid() = user_id);
create policy "config_pressing_intensity_update" on public.config_pressing_intensity for update using (auth.uid() = user_id);
create policy "config_pressing_intensity_delete" on public.config_pressing_intensity for delete using (auth.uid() = user_id);

create policy "config_build_preferences_select" on public.config_build_preferences for select using (auth.uid() = user_id);
create policy "config_build_preferences_insert" on public.config_build_preferences for insert with check (auth.uid() = user_id);
create policy "config_build_preferences_update" on public.config_build_preferences for update using (auth.uid() = user_id);
create policy "config_build_preferences_delete" on public.config_build_preferences for delete using (auth.uid() = user_id);

create policy "config_mandate_preference_categories_select" on public.config_mandate_preference_categories for select using (auth.uid() = user_id);
create policy "config_mandate_preference_categories_insert" on public.config_mandate_preference_categories for insert with check (auth.uid() = user_id);
create policy "config_mandate_preference_categories_update" on public.config_mandate_preference_categories for update using (auth.uid() = user_id);
create policy "config_mandate_preference_categories_delete" on public.config_mandate_preference_categories for delete using (auth.uid() = user_id);

create policy "config_formation_presets_select" on public.config_formation_presets for select using (auth.uid() = user_id);
create policy "config_formation_presets_insert" on public.config_formation_presets for insert with check (auth.uid() = user_id);
create policy "config_formation_presets_update" on public.config_formation_presets for update using (auth.uid() = user_id);
create policy "config_formation_presets_delete" on public.config_formation_presets for delete using (auth.uid() = user_id);

create policy "config_scoring_weights_select" on public.config_scoring_weights for select using (auth.uid() = user_id);
create policy "config_scoring_weights_insert" on public.config_scoring_weights for insert with check (auth.uid() = user_id);
create policy "config_scoring_weights_update" on public.config_scoring_weights for update using (auth.uid() = user_id);
create policy "config_scoring_weights_delete" on public.config_scoring_weights for delete using (auth.uid() = user_id);
