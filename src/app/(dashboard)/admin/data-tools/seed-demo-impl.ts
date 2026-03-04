/**
 * Demo data seeding implementation. Called by seedDemoDataAction.
 * All records are linked to the current user and use deterministic IDs for idempotency.
 */
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  demoUuid,
  DEMO_COACH_NAMES,
  DEMO_NATIONALITIES,
  DEMO_BASE_LOCATIONS,
  DEMO_LANGUAGES,
  AVAILABILITY_OPTIONS,
  REPUTATION_TIERS,
  WAGE_BANDS,
  PRESSING_OPTIONS,
  BUILD_OPTIONS,
  LEADERSHIP_OPTIONS,
  STAFF_NETWORK_ROLES,
  STAFF_SPECIALTIES_POOL,
  STAFF_NOTES_POOL,
  IMPACT_SUMMARIES,
  STAFF_NAMES,
  CLUB_NAMES,
  CLUB_LEAGUES,
  CLUB_COUNTRIES,
} from './demo-seed'
import { buildCoachNarrative, RECRUITMENT_IMPACT_SUMMARIES, DEMO_AGENT_NAMES, INTEL_TITLE_DETAIL_PAIRS } from './demo-narrative'

const now = () => new Date().toISOString()
const pastDate = (monthsAgo: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsAgo)
  return d.toISOString().slice(0, 10)
}

export type SeedCounts = {
  clubs: number
  coaches: number
  staff: number
  coach_stints: number
  coach_staff_history: number
  staff_created: number
  staff_links_created: number
  intelligence_items: number
  scoring_models: number
  coach_scores: number
  coach_derived_metrics: number
  coach_similarity: number
  mandates: number
  mandate_longlist: number
  mandate_shortlist: number
  coach_tactical_reports: number
  coach_data_profiles: number
  coach_due_diligence_items: number
  coach_background_checks: number
  coach_recruitment_history: number
  activity_log?: number
}

export async function runDemoSeed(userId: string): Promise<{ counts: SeedCounts; coachIds: string[]; error?: string }> {
  const supabase = createServerSupabaseClient()
  const counts: SeedCounts = {
    clubs: 0,
    coaches: 0,
    staff: 0,
    coach_stints: 0,
    coach_staff_history: 0,
    staff_created: 0,
    staff_links_created: 0,
    intelligence_items: 0,
    scoring_models: 0,
    coach_scores: 0,
    coach_derived_metrics: 0,
    coach_similarity: 0,
    mandates: 0,
    mandate_longlist: 0,
    mandate_shortlist: 0,
    coach_tactical_reports: 0,
    coach_data_profiles: 0,
    coach_due_diligence_items: 0,
    coach_background_checks: 0,
    coach_recruitment_history: 0,
    activity_log: 0,
  }

  // 1) Demo seed marker
  const { error: seedErr } = await supabase.from('demo_seeds').upsert(
    { user_id: userId, updated_at: now(), version: 1 },
    { onConflict: 'user_id' }
  )
  if (seedErr) return { counts, coachIds: [], error: `demo_seeds: ${seedErr.message}` }

  // 2) Clubs (3)
  const clubIds: string[] = []
  for (let i = 0; i < 3; i++) {
    const id = demoUuid(userId, 'club', i)
    clubIds.push(id)
    const { error } = await supabase.from('clubs').upsert(
      {
        id,
        user_id: userId,
        name: CLUB_NAMES[i]!,
        league: CLUB_LEAGUES[i]!,
        country: CLUB_COUNTRIES[i]!,
        ownership_model: 'Private',
        notes: `Demo club ${i + 1}.`,
      },
      { onConflict: 'id' }
    )
    if (!error) counts.clubs++
  }

  // 3) Coaches (12) with narrative-driven fields
  const coachIds: string[] = []
  const narratives: ReturnType<typeof buildCoachNarrative>[] = []
  for (let i = 0; i < 12; i++) {
    const pressing = PRESSING_OPTIONS[i % PRESSING_OPTIONS.length]!
    const build = BUILD_OPTIONS[i % BUILD_OPTIONS.length]!
    const leadership = LEADERSHIP_OPTIONS[i % LEADERSHIP_OPTIONS.length]!
    const preferredSystems = ['4-3-3', '3-5-2'].slice(0, 1 + (i % 2)) as string[]
    const narrative = buildCoachNarrative(i, { pressing_intensity: pressing, build_preference: build, leadership_style: leadership, preferred_systems: preferredSystems })
    narratives.push(narrative)
    const id = demoUuid(userId, 'coach', i)
    coachIds.push(id)
    const hasRisk = i >= 10
    const { error } = await supabase.from('coaches').upsert(
      {
        id,
        user_id: userId,
        name: DEMO_COACH_NAMES[i]!,
        nationality: DEMO_NATIONALITIES[i]!,
        base_location: DEMO_BASE_LOCATIONS[i]!,
        languages: DEMO_LANGUAGES[i] ?? ['English'],
        available_status: AVAILABILITY_OPTIONS[i % AVAILABILITY_OPTIONS.length]!,
        reputation_tier: REPUTATION_TIERS[i % REPUTATION_TIERS.length]!,
        wage_expectation: WAGE_BANDS[i % WAGE_BANDS.length]!,
        staff_cost_estimate: '£300k - £800k',
        preferred_style: 'Possession-based',
        pressing_intensity: pressing,
        build_preference: build,
        leadership_style: leadership,
        role_current: i % 3 === 0 ? 'Unemployed' : 'Head Coach',
        club_current: i % 3 === 0 ? null : CLUB_NAMES[i % 3]!,
        last_updated: now(),
        legal_risk_flag: hasRisk && i === 10,
        integrity_risk_flag: false,
        safeguarding_risk_flag: hasRisk && i === 11,
        tactical_fit_score: 55 + (i % 40),
        leadership_score: 50 + (i % 45),
        development_score: 45 + (i % 50),
        recruitment_fit_score: 50 + (i % 45),
        media_risk_score: 20 + (i % 50),
        cultural_alignment_score: 55 + (i % 40),
        adaptability_score: 50 + (i % 45),
        overall_manual_score: 52 + (i % 42),
        intelligence_confidence: 40 + (i % 45),
        tactical_identity: narrative.tacticalIdentityText,
        preferred_systems: preferredSystems,
        transition_model: narrative.transitions,
        rest_defence_model: 'Compact mid-block',
        set_piece_approach: 'Mixed set-piece focus',
        training_methodology: narrative.trainingMethodologyText,
        staff_management_style: 'Collaborative',
        player_development_model: 'Integrated with first team',
        academy_integration: 'Pathway in use',
        comms_profile: narrative.mediaStyleText,
        media_style: narrative.mediaStyleText,
        due_diligence_summary: narrative.dueDiligenceSummaryText,
      },
      { onConflict: 'id' }
    )
    if (!error) counts.coaches++
  }

  // 4) Staff (20) – roles, 2–4 specialties, notes so Staff list and detail look rich
  const staffIds: string[] = []
  for (let i = 0; i < 20; i++) {
    const id = demoUuid(userId, 'staff', i)
    staffIds.push(id)
    const numSpec = 2 + (i % 3)
    const specialties = Array.from({ length: numSpec }, (_, j) => STAFF_SPECIALTIES_POOL[(i + j * 3) % STAFF_SPECIALTIES_POOL.length]!)
    const { error } = await supabase.from('staff').upsert(
      {
        id,
        user_id: userId,
        full_name: STAFF_NAMES[i]!,
        primary_role: STAFF_NETWORK_ROLES[i % STAFF_NETWORK_ROLES.length]!,
        specialties,
        notes: STAFF_NOTES_POOL[i % STAFF_NOTES_POOL.length]!,
      },
      { onConflict: 'id' }
    )
    if (!error) {
      counts.staff++
      counts.staff_created++
    }
  }

  // 5) Coach stints (3–6 per coach) – narrative-driven, fictional clubs
  const stintCountPerCoach = [4, 5, 3, 6, 4, 5, 3, 4, 5, 4, 3, 5]
  const leagues = ['Championship', 'League One', 'Premier League', 'La Liga', 'Bundesliga']
  for (let c = 0; c < 12; c++) {
    const nar = narratives[c]!
    const n = stintCountPerCoach[c]!
    for (let s = 0; s < n; s++) {
      const id = demoUuid(userId, `stint-${c}`, s)
      const startMonthsAgo = 60 - c * 4 - s * 10
      const endMonthsAgo = Math.max(0, startMonthsAgo - 24)
      const isCurrent = endMonthsAgo === 0
      const { error } = await supabase.from('coach_stints').upsert(
        {
          id,
          coach_id: coachIds[c]!,
          club_name: nar.fictionalClubName(s),
          league: leagues[(c + s) % leagues.length]!,
          country: 'United Kingdom',
          role_title: s === 0 ? 'Head Coach' : ['Assistant Coach', 'First-Team Coach', 'Caretaker'][s % 3]!,
          started_on: pastDate(startMonthsAgo),
          ended_on: isCurrent ? null : pastDate(endMonthsAgo),
          appointment_context: nar.appointmentContext,
          exit_context: isCurrent ? null : nar.exitContext,
          points_per_game: 1.2 + (c + s) * 0.06,
          win_rate: 38 + (c + s) % 38,
          performance_summary: nar.performanceSummary,
          style_summary: nar.styleSummary,
          notable_outcomes: nar.notableOutcomes,
          confidence: 70 + (s % 25),
          verified: s % 2 === 0,
        },
        { onConflict: 'id' }
      )
      if (!error) counts.coach_stints++
    }
  }

  // 6) Coach–staff history: 6–10 links per coach; club_name matches stint clubs; 1–2 current (ended_on null) per coach
  const STAFF_ROLES_EXTENDED = ['Assistant Coach', 'First Team Coach', 'Analyst', 'Goalkeeper Coach', 'Head of Performance', 'Set Piece Coach', 'Sporting Director', 'President']
  for (let c = 0; c < 12; c++) {
    const numLinks = 6 + (c % 5) // 6–10
    const nar = narratives[c]!
    const stintClubNames = Array.from({ length: stintCountPerCoach[c]! }, (_, s) => nar.fictionalClubName(s))
    for (let t = 0; t < numLinks; t++) {
      const staffIdx = (c * 5 + t * 3) % 20
      const staffId = staffIds[staffIdx]!
      const id = demoUuid(userId, `staffhist-${c}`, t)
      const isCurrentLink = t <= 1
      const startMonthsAgo = isCurrentLink ? 6 : 48 - c * 3 - t * 5
      const endMonthsAgo = isCurrentLink ? null : Math.max(0, startMonthsAgo - 18)
      const clubName = stintClubNames[t % stintClubNames.length] ?? nar.fictionalClubName(0)
      const { error } = await supabase.from('coach_staff_history').upsert(
        {
          id,
          coach_id: coachIds[c]!,
          staff_id: staffId,
          club_name: clubName,
          club_id: null,
          role_title: STAFF_ROLES_EXTENDED[t % STAFF_ROLES_EXTENDED.length]!,
          started_on: pastDate(startMonthsAgo),
          ended_on: endMonthsAgo != null ? pastDate(endMonthsAgo) : null,
          followed_from_previous: t === 1 || (c + t) % 4 === 0,
          times_worked_together: 1 + ((c + t) % 3),
          relationship_strength: 55 + ((c + t) % 41),
          impact_summary: IMPACT_SUMMARIES[(c + t) % IMPACT_SUMMARIES.length]!,
          before_after_observation: nar.beforeAfterObservation,
          confidence: 60 + ((c + t) % 31),
          verified: t % 3 !== 1,
        },
        { onConflict: 'id' }
      )
      if (!error) {
        counts.coach_staff_history++
        counts.staff_links_created++
      }
    }
  }

  // 7) Intelligence items (10–14 per coach), realistic football intel, spread over 18 months
  const INTEL_SOURCE_NAMES = ['Scouting team', 'Internal network', 'Match observer', 'Club contact', 'Agent source', 'Media review', 'Reference check']
  for (let c = 0; c < 12; c++) {
    const n = 10 + (c % 5)
    for (let i = 0; i < n; i++) {
      const id = demoUuid(userId, `intel-${c}`, i)
      const pair = INTEL_TITLE_DETAIL_PAIRS[(c + i) % INTEL_TITLE_DETAIL_PAIRS.length]!
      const monthsAgo = 18 - (i % 14)
      const sourceIdx = (c + i) % INTEL_SOURCE_NAMES.length
      const { error } = await supabase.from('intelligence_items').upsert(
        {
          id,
          user_id: userId,
          entity_type: 'coach',
          entity_id: coachIds[c]!,
          category: pair.category,
          title: pair.title,
          detail: pair.detail,
          source_type: 'Internal',
          source_name: INTEL_SOURCE_NAMES[sourceIdx]!,
          source_link: i % 4 === 0 ? 'https://example.com/source' : null,
          source_tier: ['A', 'B', 'C'][(c + i) % 3]!,
          confidence: 60 + ((c + i) % 36),
          occurred_at: pastDate(monthsAgo),
          verified: i % 3 !== 1,
        },
        { onConflict: 'id' }
      )
      if (!error) counts.intelligence_items++
    }
  }

  // 7b) Activity log (6–10 per coach), spread over last 12 months. Delete existing for idempotency (no update policy).
  await supabase.from('activity_log').delete().eq('user_id', userId)
  const ACTIVITY_TYPES = [
    { action_type: 'profile_created', description: 'Coach profile created in system.' },
    { action_type: 'intel_added', description: 'Tactical observation added following match review.' },
    { action_type: 'staff_linked', description: 'Assistant coach relationship recorded from previous spell.' },
    { action_type: 'score_updated', description: 'Scoring model run; overall and dimension scores updated.' },
    { action_type: 'added_to_longlist', description: 'Coach added to mandate longlist; fit rationale recorded.' },
    { action_type: 'added_to_shortlist', description: 'Coach shortlisted for mandate; notes added.' },
    { action_type: 'mandate_reviewed', description: 'Mandate fit reviewed; alignment checked.' },
    { action_type: 'risk_assessment_updated', description: 'Risk and due diligence fields updated.' },
  ]
  for (let c = 0; c < 12; c++) {
    const numActivity = 6 + (c % 5)
    for (let a = 0; a < numActivity; a++) {
      const id = demoUuid(userId, `activity-${c}`, a)
      const monthsAgo = 12 - (a % 10)
      const act = ACTIVITY_TYPES[a % ACTIVITY_TYPES.length]!
      const { error } = await supabase.from('activity_log').insert({
        id,
        user_id: userId,
        entity_type: 'coach',
        entity_id: coachIds[c]!,
        action_type: act.action_type,
        description: act.description,
        metadata: null,
        created_at: pastDate(monthsAgo) + 'T12:00:00.000Z',
      })
      if (!error) counts.activity_log = (counts.activity_log ?? 0) + 1
    }
  }

  // 8) Scoring models (3) + coach_scores (3 per coach)
  const modelIds: string[] = []
  for (let v = 0; v < 3; v++) {
    const id = demoUuid(userId, 'scoring-model', v)
    modelIds.push(id)
    const { error: modelErr } = await supabase.from('scoring_models').upsert(
      { id, name: 'Default model', version: `v${v + 1}`, weights: {} },
      { onConflict: 'id' }
    )
    if (!modelErr) counts.scoring_models++
  }
  for (let ci = 0; ci < coachIds.length; ci++) {
    const coachId = coachIds[ci]!
    const pressing = PRESSING_OPTIONS[ci % PRESSING_OPTIONS.length]!
    const tacticalBoost = (pressing === 'High' || pressing === 'Very high') ? 8 : 0
    const riskPenalty = ci >= 10 ? -10 : 0
    for (let v = 0; v < 3; v++) {
      const base = 50 + (ci + v * 5) % 40
      const tacticalScore = Math.min(95, base - 3 + tacticalBoost)
      const leadershipScore = base + 2
      const riskScore = Math.max(20, 100 - base + riskPenalty)
      const { error } = await supabase.from('coach_scores').upsert(
        {
          coach_id: coachId,
          scoring_model_id: modelIds[v]!,
          overall_score: base,
          tactical_score: tacticalScore,
          leadership_score: leadershipScore,
          recruitment_score: base - 3,
          risk_score: riskScore,
          media_score: base,
          confidence_score: 65,
          computed_at: pastDate(6 - v * 2),
        },
        { onConflict: 'coach_id,scoring_model_id' }
      )
      if (!error) counts.coach_scores++
    }
  }

  // 9) Coach derived metrics – aligned to recruitment narrative (repeat agents/signings, loan, network)
  for (let c = 0; c < 12; c++) {
    const repeatSignings = 1 + (c % 4)
    const repeatAgents = (c % 3) + 1
    const { error } = await supabase.from('coach_derived_metrics').upsert(
      {
        coach_id: coachIds[c]!,
        avg_squad_age: 25 + (c % 5),
        pct_minutes_u23: 20 + (c % 35),
        pct_minutes_30plus: 15 + (c % 25),
        rotation_index: 1.2 + (c % 8) / 10,
        avg_signing_age: 24 + (c % 4),
        repeat_signings_count: repeatSignings,
        repeat_agents_count: repeatAgents,
        loan_reliance_score: 10 + (c % 30),
        network_density_score: 40 + (c % 50),
        computed_at: now(),
        raw: {},
      },
      { onConflict: 'coach_id' }
    )
    if (!error) counts.coach_derived_metrics++
  }

  // 10) Coach similarity (pairwise) – score 70–92, breakdown with narrative
  for (let i = 0; i < coachIds.length; i++) {
    for (let j = i + 1; j < coachIds.length; j++) {
      const a = coachIds[i]!
      const b = coachIds[j]!
      const score = 70 + (i + j) % 23
      const narI = narratives[i]!
      const { error } = await supabase.from('coach_similarity').upsert(
        {
          coach_a_id: a,
          coach_b_id: b,
          similarity_score: score,
          breakdown: {
            tactical: score - 4,
            leadership: score + 1,
            style: score - 2,
            explanation: narI.similarityBreakdown,
          },
          computed_at: now(),
        },
        { onConflict: 'coach_a_id,coach_b_id' }
      )
      if (!error) counts.coach_similarity++
    }
  }

  // 11) Mandates (3)
  const mandateIds: string[] = []
  for (let m = 0; m < 3; m++) {
    const id = demoUuid(userId, 'mandate', m)
    mandateIds.push(id)
    const { error } = await supabase.from('mandates').upsert(
      {
        id,
        user_id: userId,
        club_id: clubIds[m]!,
        status: 'Active',
        priority: ['High', 'Medium', 'High'][m]!,
        pipeline_stage: 'shortlist',
        engagement_date: pastDate(2),
        target_completion_date: pastDate(-3),
        ownership_structure: 'Private',
        budget_band: '£2M to £4M annual package',
        strategic_objective: 'Secure head coach appointment',
        board_risk_appetite: 'Moderate',
        succession_timeline: '90 days',
        key_stakeholders: ['Chair', 'CEO', 'Sporting Director'],
        confidentiality_level: 'Standard',
      },
      { onConflict: 'id' }
    )
    if (!error) counts.mandates++
  }

  // 12) Mandate longlist – fit_explanation from narrative
  for (let m = 0; m < 3; m++) {
    const coachesOnLonglist = coachIds.slice(m * 3, m * 3 + 6)
    for (let k = 0; k < coachesOnLonglist.length; k++) {
      const coachIdx = m * 3 + k
      const nar = narratives[coachIdx]!
      const id = demoUuid(userId, `longlist-${m}`, k)
      const { error } = await supabase.from('mandate_longlist').upsert(
        {
          id,
          mandate_id: mandateIds[m]!,
          coach_id: coachesOnLonglist[k]!,
          ranking_score: 70 + (m + k) % 25,
          fit_explanation: nar.fitExplanation,
        },
        { onConflict: 'mandate_id,coach_id' }
      )
      if (!error) counts.mandate_longlist++
    }
  }

  // 13) Mandate shortlist – only allowed statuses; notes from narrative
  const shortlistStatuses = ['Under Review', 'Shortlisted', 'In Negotiations', 'Declined'] as const
  for (let m = 0; m < 3; m++) {
    const coachesOnShortlist = coachIds.slice(m * 4, m * 4 + 3)
    for (let k = 0; k < coachesOnShortlist.length; k++) {
      const coachIdx = m * 4 + k
      const nar = narratives[coachIdx]!
      const id = demoUuid(userId, `shortlist-${m}`, k)
      const { error } = await supabase.from('mandate_shortlist').upsert(
        {
          id,
          mandate_id: mandateIds[m]!,
          coach_id: coachesOnShortlist[k]!,
          placement_probability: 60 + (m + k) * 5,
          risk_rating: 'Medium',
          status: shortlistStatuses[k % 4]!,
          notes: nar.shortlistNote,
        },
        { onConflict: 'mandate_id,coach_id' }
      )
      if (!error) counts.mandate_shortlist++
    }
  }

  // 14) Coach tactical reports (1 per coach) – aligned to preferred_systems, pressing, build
  for (let c = 0; c < 12; c++) {
    const nar = narratives[c]!
    const id = demoUuid(userId, 'tactical', c)
    const { error } = await supabase.from('coach_tactical_reports').upsert(
      {
        id,
        coach_id: coachIds[c]!,
        formation_used: nar.formationUsed,
        out_of_possession_shape: nar.outPossessionShape,
        in_possession_shape: nar.inPossessionShape,
        pressing_height: nar.pressingHeight,
        build_up_pattern: nar.buildUpPattern,
        defensive_structure: nar.defensiveStructure,
        transitions: nar.transitions,
        overall_tactical_score: 65 + (c % 25),
        notes: nar.tacticalNotes,
      },
      { onConflict: 'id' }
    )
    if (!error) counts.coach_tactical_reports++
  }

  // 15) Coach data profiles (1 per coach)
  for (let c = 0; c < 12; c++) {
    const id = demoUuid(userId, 'dataprofile', c)
    const { error } = await supabase.from('coach_data_profiles').upsert(
      {
        id,
        coach_id: coachIds[c]!,
        avg_squad_age: 25.5 + (c % 4),
        avg_starting_xi_age: 26 + (c % 3),
        minutes_u21: 15 + (c % 20),
        minutes_21_24: 25 + (c % 25),
        minutes_25_28: 30 + (c % 25),
        minutes_29_plus: 20 + (c % 20),
        recruitment_avg_age: 24 + (c % 4),
        recruitment_repeat_player_count: c % 4,
        recruitment_repeat_agent_count: c % 3,
        media_pressure_score: 50 + (c % 40),
        media_accountability_score: 55 + (c % 35),
        media_confrontation_score: 45 + (c % 40),
        social_presence_level: 'Moderate',
        narrative_risk_summary: 'Low narrative risk.',
        confidence_score: 70,
      },
      { onConflict: 'id' }
    )
    if (!error) counts.coach_data_profiles++
  }

  // 16) Coach due diligence – 2–4 for risk-flag coaches, 1–2 otherwise; professional wording
  const ddTitles = ['Background check', 'Reference verification', 'Media and legal check', 'Board reference']
  const ddDetails = ['Routine checks complete. No concerns. References positive.', 'All clear. No issues identified. Professional references.', 'Due diligence complete. Reputation in order.', 'References and dressing room feedback positive.']
  for (let c = 0; c < 12; c++) {
    const hasRisk = c >= 10
    const numDD = hasRisk ? 2 + (c % 3) : 1 + (c % 2)
    for (let d = 0; d < numDD; d++) {
      const id = demoUuid(userId, `dd-${c}`, d)
      const { error } = await supabase.from('coach_due_diligence_items').upsert(
        {
          id,
          coach_id: coachIds[c]!,
          title: ddTitles[d % ddTitles.length]!,
          detail: hasRisk && d === numDD - 1 ? 'One reference flagged for follow-up. Otherwise clear.' : ddDetails[d % ddDetails.length]!,
          confidence: 80 + (c + d) % 15,
          verified: true,
        },
        { onConflict: 'id' }
      )
      if (!error) counts.coach_due_diligence_items++
    }
  }

  // 17) Coach background checks (1 per coach)
  for (let c = 0; c < 12; c++) {
    const id = demoUuid(userId, 'bgcheck', c)
    const { error } = await supabase.from('coach_background_checks').upsert(
      {
        id,
        coach_id: coachIds[c]!,
        dressing_room_reputation: 'Positive. Standards clear; players and staff respect boundaries.',
        media_reputation: 'Professional. Handles pressure and scrutiny well.',
        board_relationship_history: 'Constructive. Alignment on style and recruitment.',
        overall_risk_rating: c >= 10 ? 35 : 15 + (c % 25),
      },
      { onConflict: 'id' }
    )
    if (!error) counts.coach_background_checks++
  }

  // 18) Coach recruitment history (8–15 per coach), repeat agents/signings, impact summaries
  for (let c = 0; c < 12; c++) {
    const n = 8 + (c % 8)
    const agentPool = DEMO_AGENT_NAMES.slice(0, 3 + (c % 3))
    for (let r = 0; r < n; r++) {
      const id = demoUuid(userId, `recruit-${c}`, r)
      const agent = agentPool[r % agentPool.length]!
      const repeatedSigning = r < 2 || (c % 4 === 0 && r === 5)
      const { error } = await supabase.from('coach_recruitment_history').upsert(
        {
          id,
          coach_id: coachIds[c]!,
          player_name: `Player ${String.fromCharCode(65 + (c + r) % 12)}`,
          club_name: narratives[c]!.fictionalClubName(r),
          transfer_window: ['Summer', 'Winter'][r % 2]!,
          transfer_fee_band: ['Free', 'Under £1m', '£1m–5m', '£5m+'][r % 4]!,
          player_age_at_signing: 22 + (c + r) % 6,
          repeated_signing: repeatedSigning,
          agent_name: agent,
          impact_summary: RECRUITMENT_IMPACT_SUMMARIES[r % RECRUITMENT_IMPACT_SUMMARIES.length]!,
          confidence: 70 + (c + r) % 25,
          verified: r % 2 === 0,
        },
        { onConflict: 'id' }
      )
      if (!error) counts.coach_recruitment_history++
    }
  }

  return { counts, coachIds }
}
