-- Add executive_brief to vacancies for storing generated briefs
alter table public.vacancies
  add column if not exists executive_brief text;

-- Allow users to update vacancies for their clubs (e.g. executive_brief)
create policy if not exists "Users can update vacancies for their clubs"
  on public.vacancies for update
  using (
    club_id in (
      select id from public.clubs where user_id = auth.uid()
    )
  );

-- Allow users to insert/update matches for their vacancies
create policy if not exists "Users can insert matches for their vacancies"
  on public.matches for insert
  with check (
    vacancy_id in (
      select v.id from public.vacancies v
      join public.clubs c on v.club_id = c.id
      where c.user_id = auth.uid()
    )
  );

create policy if not exists "Users can update matches for their vacancies"
  on public.matches for update
  using (
    vacancy_id in (
      select v.id from public.vacancies v
      join public.clubs c on v.club_id = c.id
      where c.user_id = auth.uid()
    )
  );
