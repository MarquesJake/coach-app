-- Assessment hardening (post-review fixes):
-- 1. Write policies must verify the mandate AND coach belong to the user, not just
--    that user_id is stamped correctly — otherwise cross-user rows can be created
--    against another user's (mandate_id, coach_id) and collide with the owner's
--    upserts via the unique constraints.
-- 2. key_strengths on candidate_recommendations for the Riera-format at-a-glance.

alter table public.candidate_recommendations add column if not exists key_strengths text;

-- candidate_assessments
drop policy if exists "Users can manage own candidate assessments" on public.candidate_assessments;
create policy "Users can view own candidate assessments"
  on public.candidate_assessments for select
  using (auth.uid() = user_id);
create policy "Users can insert own candidate assessments"
  on public.candidate_assessments for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = auth.uid())
    and exists (select 1 from public.coaches c where c.id = coach_id and c.user_id = auth.uid())
  );
create policy "Users can update own candidate assessments"
  on public.candidate_assessments for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = auth.uid())
    and exists (select 1 from public.coaches c where c.id = coach_id and c.user_id = auth.uid())
  );
create policy "Users can delete own candidate assessments"
  on public.candidate_assessments for delete
  using (auth.uid() = user_id);

-- assessment_evidence
drop policy if exists "Users can manage own assessment evidence" on public.assessment_evidence;
create policy "Users can view own assessment evidence"
  on public.assessment_evidence for select
  using (auth.uid() = user_id);
create policy "Users can insert own assessment evidence"
  on public.assessment_evidence for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = auth.uid())
    and exists (select 1 from public.coaches c where c.id = coach_id and c.user_id = auth.uid())
  );
create policy "Users can update own assessment evidence"
  on public.assessment_evidence for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = auth.uid())
    and exists (select 1 from public.coaches c where c.id = coach_id and c.user_id = auth.uid())
  );
create policy "Users can delete own assessment evidence"
  on public.assessment_evidence for delete
  using (auth.uid() = user_id);

-- candidate_recommendations
drop policy if exists "Users can manage own candidate recommendations" on public.candidate_recommendations;
create policy "Users can view own candidate recommendations"
  on public.candidate_recommendations for select
  using (auth.uid() = user_id);
create policy "Users can insert own candidate recommendations"
  on public.candidate_recommendations for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = auth.uid())
    and exists (select 1 from public.coaches c where c.id = coach_id and c.user_id = auth.uid())
  );
create policy "Users can update own candidate recommendations"
  on public.candidate_recommendations for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = auth.uid())
    and exists (select 1 from public.coaches c where c.id = coach_id and c.user_id = auth.uid())
  );
create policy "Users can delete own candidate recommendations"
  on public.candidate_recommendations for delete
  using (auth.uid() = user_id);

-- Purge any rows that predate the tighter policies and point at foreign mandates/coaches.
delete from public.candidate_assessments a
where not exists (select 1 from public.mandates m where m.id = a.mandate_id and m.user_id = a.user_id)
   or not exists (select 1 from public.coaches c where c.id = a.coach_id and c.user_id = a.user_id);
delete from public.assessment_evidence e
where not exists (select 1 from public.mandates m where m.id = e.mandate_id and m.user_id = e.user_id)
   or not exists (select 1 from public.coaches c where c.id = e.coach_id and c.user_id = e.user_id);
delete from public.candidate_recommendations r
where not exists (select 1 from public.mandates m where m.id = r.mandate_id and m.user_id = r.user_id)
   or not exists (select 1 from public.coaches c where c.id = r.coach_id and c.user_id = r.user_id);
