-- Add new scoring columns to matches for upgraded matchmaking engine
alter table public.matches
  add column if not exists risk_score numeric(5,2),
  add column if not exists confidence_score numeric(5,2),
  add column if not exists board_compatibility_score numeric(5,2);

comment on column public.matches.risk_score is '0-100, higher = more risk; used in overall_score formula';
comment on column public.matches.confidence_score is '0-100, from profile completeness, recency, update count';
comment on column public.matches.board_compatibility_score is '0-100, board/club fit';
