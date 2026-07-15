create index if not exists coach_scores_scoring_model_id_idx
  on public.coach_scores (scoring_model_id);

create index if not exists coach_similarity_coach_b_id_idx
  on public.coach_similarity (coach_b_id);

create index if not exists intelligence_items_archived_by_idx
  on public.intelligence_items (archived_by)
  where archived_by is not null;

drop policy if exists "Users can manage own intelligence_items" on public.intelligence_items;
create policy "Users can manage own intelligence_items"
  on public.intelligence_items for all to authenticated
  using (intelligence_items.user_id = (select auth.uid()))
  with check (intelligence_items.user_id = (select auth.uid()));
