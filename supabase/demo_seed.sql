-- =============================================================================
-- DEMO SEED - Idempotent demo data for CoachMatch / Executive Search
-- =============================================================================
-- Safe to run multiple times: inserts only when matching rows do not exist.
--
-- USER_ID: If you have no existing clubs or coaches, replace the placeholder
-- below with a valid auth.users id (e.g. from Supabase Auth). Search for:
--   00000000-0000-0000-0000-000000000000
-- and replace with your DEMO_USER_ID so club, coach, intelligence_items and
-- mandate inserts succeed (all require user_id).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Resolve user_id: existing club or coach, else placeholder
-- -----------------------------------------------------------------------------
WITH demo_user AS (
  SELECT COALESCE(
    (SELECT user_id FROM public.clubs LIMIT 1),
    (SELECT user_id FROM public.coaches LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ) AS user_id
),

-- -----------------------------------------------------------------------------
-- 1) Club: Demo FC (only if not exists)
-- -----------------------------------------------------------------------------
-- public.clubs: country, league, name, ownership_model, user_id required; notes optional
ins_club AS (
  INSERT INTO public.clubs (name, country, league, notes, ownership_model, user_id)
  SELECT 'Demo FC', 'United Kingdom', 'Championship', 'Demo seed club.', 'Private', du.user_id
  FROM demo_user du
  WHERE NOT EXISTS (SELECT 1 FROM public.clubs WHERE name = 'Demo FC')
  RETURNING id
),

-- -----------------------------------------------------------------------------
-- 2) Coach: Demo Coach (only if not exists)
-- -----------------------------------------------------------------------------
-- public.coaches: name, build_preference, leadership_style, preferred_style,
-- pressing_intensity, staff_cost_estimate, wage_expectation required; user_id optional in app
ins_coach AS (
  INSERT INTO public.coaches (
    name,
    nationality,
    availability_status,
    market_status,
    base_location,
    user_id,
    build_preference,
    leadership_style,
    preferred_style,
    pressing_intensity,
    staff_cost_estimate,
    wage_expectation,
    available_status,
    reputation_tier,
    role_current,
    club_current
  )
  SELECT
    'Demo Coach',
    'British',
    'Available',
    'Open to discussion',
    'London',
    du.user_id,
    'Build from back',
    'Collaborative',
    'Possession-based',
    'High',
    '£500k - £1m',
    '£1m - £2m/yr',
    'Available',
    'Established',
    'Unemployed',
    NULL
  FROM demo_user du
  WHERE NOT EXISTS (SELECT 1 FROM public.coaches WHERE name = 'Demo Coach')
  RETURNING id
),

-- Single coach id for downstream (either existing or newly inserted)
demo_coach_id AS (
  SELECT id FROM public.coaches WHERE name = 'Demo Coach' LIMIT 1
),

-- -----------------------------------------------------------------------------
-- 3) Coach stint for Demo Coach (only if no stint exists for this coach)
-- -----------------------------------------------------------------------------
-- public.coach_stints: coach_id, club_name, role_title required
ins_stint AS (
  INSERT INTO public.coach_stints (
    coach_id,
    club_id,
    club_name,
    country,
    league,
    role_title,
    started_on,
    ended_on,
    points_per_game,
    win_rate,
    performance_summary,
    style_summary,
    notable_outcomes
  )
  SELECT
    dc.id,
    (SELECT id FROM public.clubs WHERE name = 'Demo FC' LIMIT 1),
    'Demo FC',
    'United Kingdom',
    'Championship',
    'Head Coach',
    '2022-07-01',
    '2024-06-30',
    1.85,
    58.5,
    'Strong league finish and cup run.',
    'Possession-based build-up, high press.',
    'Promotion push; cup semi-final.'
  FROM demo_coach_id dc
  WHERE NOT EXISTS (SELECT 1 FROM public.coach_stints WHERE coach_id = dc.id)
  LIMIT 1
  RETURNING id
),

-- -----------------------------------------------------------------------------
-- 4) Intelligence item for Demo Coach (only if none exist for this coach)
-- -----------------------------------------------------------------------------
-- public.intelligence_items: user_id, entity_type, entity_id, title required
demo_user_for_intel AS (
  SELECT COALESCE(
    (SELECT user_id FROM public.clubs LIMIT 1),
    (SELECT user_id FROM public.coaches LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ) AS user_id
),
ins_intel AS (
  INSERT INTO public.intelligence_items (
    user_id,
    entity_type,
    entity_id,
    category,
    title,
    detail,
    confidence,
    occurred_at
  )
  SELECT
    du.user_id,
    'coach',
    dc.id,
    'Performance',
    'Demo Coach – strong season review',
    'End-of-season review noted strong tactical consistency and squad development.',
    85,
    now() - interval '30 days'
  FROM demo_coach_id dc
  CROSS JOIN demo_user_for_intel du
  WHERE NOT EXISTS (
    SELECT 1 FROM public.intelligence_items
    WHERE entity_type = 'coach' AND entity_id = dc.id
  )
  LIMIT 1
  RETURNING id
),

-- -----------------------------------------------------------------------------
-- 5) Optional: demo mandate linked to Demo FC (only if no mandate named for Demo FC)
-- -----------------------------------------------------------------------------
demo_club_id AS (
  SELECT id FROM public.clubs WHERE name = 'Demo FC' LIMIT 1
),
demo_user_mandate AS (
  SELECT COALESCE(
    (SELECT user_id FROM public.clubs LIMIT 1),
    (SELECT user_id FROM public.coaches LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ) AS user_id
),
ins_mandate AS (
  INSERT INTO public.mandates (
    user_id,
    club_id,
    custom_club_name,
    status,
    pipeline_stage,
    priority,
    engagement_date,
    target_completion_date,
    ownership_structure,
    budget_band,
    strategic_objective,
    board_risk_appetite,
    succession_timeline,
    confidentiality_level
  )
  SELECT
    du.user_id,
    dc.id,
    'Demo FC',
    'Active',
    'identified',
    'Medium',
    CURRENT_DATE,
    (CURRENT_DATE + INTERVAL '90 days')::date,
    'Private',
    'Mid-market',
    'Demo mandate for seed data.',
    'Moderate',
    '90 days',
    'Standard'
  FROM demo_club_id dc
  CROSS JOIN demo_user_mandate du
  WHERE NOT EXISTS (
    SELECT 1 FROM public.mandates WHERE custom_club_name = 'Demo FC'
  )
  LIMIT 1
  RETURNING id
)

SELECT 1;
