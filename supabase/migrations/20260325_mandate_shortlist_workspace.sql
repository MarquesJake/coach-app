-- Extend mandate_shortlist with candidate pipeline stage, network provenance, and fit dimensions
-- These fields power the Mandate Workspace three-panel decision screen

alter table public.mandate_shortlist
  add column if not exists candidate_stage text not null default 'Longlist',
  add column if not exists network_source text null,
  add column if not exists network_recommender text null,
  add column if not exists network_relationship text null,
  add column if not exists fit_tactical text null,
  add column if not exists fit_cultural text null,
  add column if not exists fit_level text null,
  add column if not exists fit_communication text null,
  add column if not exists fit_network text null,
  add column if not exists fit_notes text null;

comment on column public.mandate_shortlist.candidate_stage is 'Individual candidate stage: Tracked | Longlist | Shortlist | Interview | Final';
comment on column public.mandate_shortlist.network_source is 'How identified: Data search | Direct recommendation | Network suggestion | Proactive approach';
comment on column public.mandate_shortlist.network_relationship is 'Provenance depth: Direct | Indirect | Cold';
comment on column public.mandate_shortlist.fit_tactical is 'Tactical/style fit signal: Strong | Moderate | Weak | Unknown';
comment on column public.mandate_shortlist.fit_cultural is 'Cultural fit signal: Strong | Moderate | Weak | Unknown';
comment on column public.mandate_shortlist.fit_level is 'League/level experience signal: Strong | Moderate | Weak | Unknown';
comment on column public.mandate_shortlist.fit_communication is 'Communication/public profile signal: Strong | Moderate | Weak | Unknown';
comment on column public.mandate_shortlist.fit_network is 'Network standing signal: Strong | Moderate | Weak | Unknown';
