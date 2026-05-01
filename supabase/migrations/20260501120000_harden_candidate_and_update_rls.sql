-- Harden RLS for coach updates and mandate candidate tables.
-- Users should only read coach updates for coaches they own, and should only add
-- owned coaches to mandate shortlist or longlist rows.

-- ── coach_updates SELECT: scope through owned coach ──────────────────────────

drop policy if exists "Authenticated users can view coach updates" on public.coach_updates;

create policy "Users can view coach_updates for own coaches"
  on public.coach_updates for select
  using (
    exists (
      select 1
      from public.coaches c
      where c.id = coach_updates.coach_id
        and c.user_id = auth.uid()
    )
  );

-- ── mandate_shortlist INSERT / UPDATE: require mandate + coach ownership ─────

drop policy if exists "Users can insert shortlist for own mandates" on public.mandate_shortlist;

create policy "Users can insert shortlist for own mandates"
  on public.mandate_shortlist for insert
  with check (
    exists (
      select 1
      from public.mandates m
      where m.id = mandate_id
        and m.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.coaches c
      where c.id = coach_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update shortlist for own mandates" on public.mandate_shortlist;

create policy "Users can update shortlist for own mandates"
  on public.mandate_shortlist for update
  using (
    exists (
      select 1
      from public.mandates m
      where m.id = mandate_id
        and m.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.coaches c
      where c.id = coach_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.mandates m
      where m.id = mandate_id
        and m.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.coaches c
      where c.id = coach_id
        and c.user_id = auth.uid()
    )
  );

-- ── mandate_longlist: split broad FOR ALL policy into operation-specific RLS ─

drop policy if exists "Users can manage longlist for own mandates" on public.mandate_longlist;

create policy "Users can view longlist for own mandates"
  on public.mandate_longlist for select
  using (
    exists (
      select 1
      from public.mandates m
      where m.id = mandate_id
        and m.user_id = auth.uid()
    )
  );

create policy "Users can delete longlist for own mandates"
  on public.mandate_longlist for delete
  using (
    exists (
      select 1
      from public.mandates m
      where m.id = mandate_id
        and m.user_id = auth.uid()
    )
  );

create policy "Users can insert longlist for own mandates and coaches"
  on public.mandate_longlist for insert
  with check (
    exists (
      select 1
      from public.mandates m
      where m.id = mandate_id
        and m.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.coaches c
      where c.id = coach_id
        and c.user_id = auth.uid()
    )
  );

create policy "Users can update longlist for own mandates and coaches"
  on public.mandate_longlist for update
  using (
    exists (
      select 1
      from public.mandates m
      where m.id = mandate_id
        and m.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.coaches c
      where c.id = coach_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.mandates m
      where m.id = mandate_id
        and m.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.coaches c
      where c.id = coach_id
        and c.user_id = auth.uid()
    )
  );
