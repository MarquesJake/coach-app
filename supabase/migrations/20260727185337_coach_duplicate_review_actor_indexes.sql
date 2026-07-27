create index if not exists coach_duplicate_reviews_created_by_idx
  on public.coach_duplicate_reviews (created_by);

create index if not exists coach_duplicate_reviews_reviewed_by_idx
  on public.coach_duplicate_reviews (reviewed_by);
