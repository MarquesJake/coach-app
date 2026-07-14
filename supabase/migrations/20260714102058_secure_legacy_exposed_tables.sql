-- Secure legacy tables that are exposed through the Data API.

alter table public.matches enable row level security;

drop policy if exists "Users can view matches for their vacancies" on public.matches;
drop policy if exists "Users can insert matches for their vacancies" on public.matches;
drop policy if exists "Users can update matches for their vacancies" on public.matches;
drop policy if exists "Users can delete matches for their vacancies" on public.matches;

create policy "Users can view matches for their vacancies"
  on public.matches
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.vacancies v
      join public.clubs c on c.id = v.club_id
      where v.id = matches.vacancy_id
        and c.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.coaches coach
      where coach.id = matches.coach_id
        and coach.user_id = (select auth.uid())
    )
  );

create policy "Users can insert matches for their vacancies"
  on public.matches
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.vacancies v
      join public.clubs c on c.id = v.club_id
      where v.id = matches.vacancy_id
        and c.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.coaches coach
      where coach.id = matches.coach_id
        and coach.user_id = (select auth.uid())
    )
  );

create policy "Users can update matches for their vacancies"
  on public.matches
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.vacancies v
      join public.clubs c on c.id = v.club_id
      where v.id = matches.vacancy_id
        and c.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.coaches coach
      where coach.id = matches.coach_id
        and coach.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.vacancies v
      join public.clubs c on c.id = v.club_id
      where v.id = matches.vacancy_id
        and c.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.coaches coach
      where coach.id = matches.coach_id
        and coach.user_id = (select auth.uid())
    )
  );

create policy "Users can delete matches for their vacancies"
  on public.matches
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.vacancies v
      join public.clubs c on c.id = v.club_id
      where v.id = matches.vacancy_id
        and c.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.coaches coach
      where coach.id = matches.coach_id
        and coach.user_id = (select auth.uid())
    )
  );

alter table public.config_lists enable row level security;

create policy "Users can view own config lists"
  on public.config_lists
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert own config lists"
  on public.config_lists
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update own config lists"
  on public.config_lists
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete own config lists"
  on public.config_lists
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

alter table public.scoring_weights enable row level security;

create policy "Users can view own scoring weights"
  on public.scoring_weights
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert own scoring weights"
  on public.scoring_weights
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update own scoring weights"
  on public.scoring_weights
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete own scoring weights"
  on public.scoring_weights
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

alter function public.set_updated_at() set search_path = pg_catalog;
