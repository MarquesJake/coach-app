-- Additive classification of internal coach research. Existing questions are
-- deliberately unclassified: a broad domain is not proof of a specific area.
alter table public.coach_research_questions
  add column assessment_area text check (assessment_area in (
    'coach_profile', 'performance_impact', 'tactical_proposal', 'match_management',
    'training_management', 'players_development', 'media_comms',
    'personality_profile', 'cultural_org_fit'
  )),
  add column evidence_methods text[] not null default '{}' check (
    evidence_methods <@ array['desktop_research','data_analysis','ai_generated',
      'media_review','match_analysis','training_observation','candidate_interview','references']::text[]
    and array_position(evidence_methods, null) is null
    and cardinality(evidence_methods) <= 8
  );
comment on column public.coach_research_questions.assessment_area is 'Analyst-selected assessment area. Null means not classified; no inference from the legacy domain.';
comment on column public.coach_research_questions.evidence_methods is 'Methods represented in the linked findings, as recorded by the analyst. Not verification, independent corroboration or publication permission.';
