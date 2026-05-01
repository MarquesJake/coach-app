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
  CLUB_DEMO_BRIEFS,
  DEMO_AGENT_FULL_NAMES,
  DEMO_AGENT_AGENCIES,
  DEMO_AGENT_MARKETS,
  DEMO_AGENT_LANGUAGES,
  DEMO_AGENT_CONTACT_CHANNELS,
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
  mandate_deliverables: number
  coach_tactical_reports: number
  coach_data_profiles: number
  coach_due_diligence_items: number
  coach_background_checks: number
  coach_recruitment_history: number
  activity_log?: number
  coach_updates?: number
  alerts?: number
  agents?: number
  coach_agents?: number
  agent_club_relationships?: number
  agent_interactions?: number
  agent_deals?: number
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
    mandate_deliverables: 0,
    coach_tactical_reports: 0,
    coach_data_profiles: 0,
    coach_due_diligence_items: 0,
    coach_background_checks: 0,
    coach_recruitment_history: 0,
    activity_log: 0,
    coach_updates: 0,
    alerts: 0,
    agents: 0,
    coach_agents: 0,
    agent_club_relationships: 0,
    agent_interactions: 0,
    agent_deals: 0,
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
    const brief = CLUB_DEMO_BRIEFS[i]!
    const { error } = await supabase.from('clubs').upsert(
      {
        id,
        user_id: userId,
        name: CLUB_NAMES[i]!,
        league: CLUB_LEAGUES[i]!,
        country: CLUB_COUNTRIES[i]!,
        ownership_model: brief.ownership_model,
        tactical_model: brief.tactical_model,
        pressing_model: brief.pressing_model,
        build_model: brief.build_model,
        board_risk_tolerance: brief.board_risk_tolerance,
        strategic_priority: brief.strategic_priority,
        market_reputation: brief.market_reputation,
        media_pressure: brief.media_pressure,
        development_vs_win_now: brief.development_vs_win_now,
        environment_assessment: brief.environment_assessment,
        instability_risk: brief.instability_risk,
        notes: `${brief.strategic_priority}. ${brief.instability_risk}`,
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

  // 7c) Coach updates – feed Intelligence page timeline and summary cards (This Week, High Priority, Availability, Contract)
  const UPDATE_TYPES = ['availability', 'appointment', 'contract', 'reputation', 'transfer', 'general', 'sacking'] as const
  const UPDATE_NOTES: Record<string, string[]> = {
    availability: ['Coach now open to offers; contract expires summer.', 'Availability status updated; interested in right project.', 'No longer in discussions; back on market.'],
    appointment: ['Appointed head coach; three-year deal.', 'New role confirmed; starts next month.', 'Official announcement; contract signed.'],
    contract: ['Contract extension agreed; two further years.', 'Terms renegotiated; improved package.', 'Option triggered; one more season.'],
    reputation: ['Strong run of results; stock rising.', 'Board and fans aligned; positive coverage.', 'Media narrative shifted after cup run.'],
    transfer: ['Active in winter window; two key signings.', 'Recruitment aligned with style; profile fit.', 'Loan market used; squad depth improved.'],
    general: ['Training intensity and standards noted by sources.', 'Staff delegation and match prep structure observed.', 'Dressing room and board relationship stable.'],
    sacking: ['Departure confirmed; mutual consent.', 'Role ended; club seeking replacement.', 'Contract terminated; search underway.'],
  }
  for (let c = 0; c < 12; c++) {
    const numUpdates = 12 + (c % 7)
    for (let u = 0; u < numUpdates; u++) {
      const id = demoUuid(userId, `coach-update-${c}`, u)
      const type = UPDATE_TYPES[(c + u) % UPDATE_TYPES.length]!
      const notes = UPDATE_NOTES[type]
      const updateNote = notes?.[u % (notes?.length ?? 1)] ?? 'Market update; source confident.'
      const daysAgo = u < 4 ? u : 7 + (u % 25)
      const occurredDate = (() => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString().slice(0, 10) + 'T12:00:00.000Z' })()
      const { error } = await supabase.from('coach_updates').upsert(
        {
          id,
          coach_id: coachIds[c]!,
          update_type: type,
          update_note: updateNote,
          occurred_at: occurredDate,
          confidence: type === 'sacking' || type === 'appointment' ? 'High' : (u % 3 === 0 ? 'High' : u % 3 === 1 ? 'Medium' : 'Low'),
          source_tier: ['A', 'B', 'C'][(c + u) % 3]!,
          source_note: 'Internal source.',
        },
        { onConflict: 'id' }
      )
      if (!error) counts.coach_updates = (counts.coach_updates ?? 0) + 1
    }
  }

  // 7d) Agents (8) + coach_agents, agent_club_relationships, agent_interactions, agent_deals
  const agentIds: string[] = []
  for (let i = 0; i < 8; i++) {
    const id = demoUuid(userId, 'agent', i)
    agentIds.push(id)
    const influence = 50 + (i % 45) + (i < 4 ? 10 : 0)
    const reliability = 55 + (i % 40)
    const responsiveness = i % 3 === 0 ? 85 : 60 + (i % 30)
    const { error } = await supabase.from('agents').upsert(
      {
        id,
        user_id: userId,
        full_name: DEMO_AGENT_FULL_NAMES[i]!,
        agency_name: DEMO_AGENT_AGENCIES[i] ?? null,
        base_location: DEMO_BASE_LOCATIONS[i % DEMO_BASE_LOCATIONS.length]!,
        markets: DEMO_AGENT_MARKETS[i] ?? [],
        languages: DEMO_AGENT_LANGUAGES[i] ?? ['English'],
        preferred_contact_channel: DEMO_AGENT_CONTACT_CHANNELS[i] ?? 'Email',
        email: `agent${i + 1}@demo.co`,
        whatsapp: i % 2 === 0 ? `+44${7000000000 + i}` : null,
        reliability_score: Math.min(100, reliability),
        influence_score: Math.min(100, influence),
        responsiveness_score: Math.min(100, responsiveness),
        risk_flag: i === 7,
        risk_notes: i === 7 ? 'Monitor conflict of interest.' : null,
      },
      { onConflict: 'id' }
    )
    if (!error) counts.agents = (counts.agents ?? 0) + 1
  }
  for (let c = 0; c < 12; c++) {
    const agentIdx = c % 8
    const linkId = demoUuid(userId, 'coach-agent', c)
    const { error } = await supabase.from('coach_agents').upsert(
      {
        id: linkId,
        user_id: userId,
        coach_id: coachIds[c]!,
        agent_id: agentIds[agentIdx]!,
        relationship_type: 'Primary',
        relationship_strength: 65 + (c % 30),
        confidence: 70 + (c % 25),
        started_on: pastDate(24),
      },
      { onConflict: 'coach_id,agent_id' }
    )
    if (!error) counts.coach_agents = (counts.coach_agents ?? 0) + 1
    if (c % 3 === 1 && c < 10) {
      const secondAgentIdx = (agentIdx + 2) % 8
      const linkId2 = demoUuid(userId, 'coach-agent-2', c)
      const { error: err2 } = await supabase.from('coach_agents').upsert(
        {
          id: linkId2,
          user_id: userId,
          coach_id: coachIds[c]!,
          agent_id: agentIds[secondAgentIdx]!,
          relationship_type: 'Secondary',
          relationship_strength: 40 + (c % 30),
          confidence: 50 + (c % 30),
        },
        { onConflict: 'coach_id,agent_id' }
      )
      if (!err2) counts.coach_agents = (counts.coach_agents ?? 0) + 1
    }
  }
  for (let cl = 0; cl < 3; cl++) {
    const numLinks = 2 + (cl % 3)
    for (let a = 0; a < numLinks; a++) {
      const agentIdx = (cl * 2 + a) % 8
      const relId = demoUuid(userId, 'agent-club', cl * 10 + a)
      const { error } = await supabase.from('agent_club_relationships').upsert(
        {
          id: relId,
          user_id: userId,
          agent_id: agentIds[agentIdx]!,
          club_id: clubIds[cl]!,
          relationship_type: a === 0 ? 'Preferred' : 'Intermediary',
          relationship_strength: 50 + (cl + a) * 15,
          last_active_on: pastDate(2 + (cl + a) % 6),
        },
        { onConflict: 'agent_id,club_id' }
      )
      if (!error) counts.agent_club_relationships = (counts.agent_club_relationships ?? 0) + 1
    }
  }
  const INTERACTION_TOPICS = ['Mandate', 'Availability', 'Compensation', 'Staff', 'Reputation', 'Other']
  const INTERACTION_CHANNELS = ['Phone', 'WhatsApp', 'Email', 'In person', 'Video call']
  const INTERACTION_SUMMARIES = [
    'Discussed mandate fit and timeline for final shortlist.',
    'Availability confirmed for summer process window.',
    'Compensation expectations aligned to current mandate budget.',
    'Backroom staffing package and role split discussed in detail.',
    'Reputation and dressing-room references reviewed; mostly positive.',
    'Quarterly relationship touchpoint to keep channel warm.',
    'Follow-up after shortlist review; next contact agreed.',
    'Initial intro call with club decision makers completed.',
  ]
  for (let a = 0; a < 8; a++) {
    const numInt = 8 + (a % 13)
    for (let i = 0; i < numInt; i++) {
      const intId = demoUuid(userId, 'agent-int', a * 50 + i)
      const monthsAgo = i % 12
      const occurredAt = (() => { const d = new Date(); d.setMonth(d.getMonth() - monthsAgo); d.setDate(1 + (i % 20)); return d.toISOString() })()
      const { error } = await supabase.from('agent_interactions').upsert(
        {
          id: intId,
          user_id: userId,
          agent_id: agentIds[a]!,
          occurred_at: occurredAt,
          channel: INTERACTION_CHANNELS[i % INTERACTION_CHANNELS.length],
          direction: i % 2 === 0 ? 'Inbound' : 'Outbound',
          topic: INTERACTION_TOPICS[i % INTERACTION_TOPICS.length],
          summary: INTERACTION_SUMMARIES[i % INTERACTION_SUMMARIES.length]!,
          detail: `${CLUB_NAMES[(a + i) % CLUB_NAMES.length]!} context discussed with focus on ${INTERACTION_TOPICS[i % INTERACTION_TOPICS.length]!.toLowerCase()}.`,
          sentiment: ['Positive', 'Neutral', 'Negative'][i % 3]!,
          confidence: 60 + (i % 35),
        },
        { onConflict: 'id' }
      )
      if (!error) counts.agent_interactions = (counts.agent_interactions ?? 0) + 1
    }
  }
  const DEAL_TYPES = ['Appointment', 'Extension', 'Termination', 'Settlement', 'Advisory']
  for (let a = 0; a < 8; a++) {
    const numDeals = 1 + (a % 4)
    for (let d = 0; d < numDeals; d++) {
      const dealId = demoUuid(userId, 'agent-deal', a * 10 + d)
      const coachId = a < 12 ? coachIds[a % 12]! : null
      const clubId = d % 3 === 0 ? clubIds[d % 3]! : null
      const { error } = await supabase.from('agent_deals').upsert(
        {
          id: dealId,
          user_id: userId,
          agent_id: agentIds[a]!,
          coach_id: coachId,
          club_id: clubId,
          deal_type: DEAL_TYPES[d % DEAL_TYPES.length]!,
          season: `202${3 + (d % 2)}/${4 + (d % 2)}`,
          value_band: d % 2 === 0 ? '£1m - £2m' : null,
          occurred_on: pastDate(6 + d * 2),
        },
        { onConflict: 'id' }
      )
      if (!error) counts.agent_deals = (counts.agent_deals ?? 0) + 1
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('coach_similarity').upsert(
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
  const mandateBriefs = [
    {
      status: 'Active',
      priority: 'High',
      pipeline_stage: 'interviews',
      targetMonths: 2,
      budget_band: '£8M to £12M total staff package',
      strategic_objective: 'Appoint a high authority head coach who can restore Champions League qualification while protecting the young squad pathway.',
      board_risk_appetite: 'Moderate. The board will accept tactical ambition if the first 100 day plan is credible.',
      succession_timeline: 'Appointment before the 2026 pre season block',
      key_stakeholders: ['Ownership group', 'Sporting directors', 'Performance leadership', 'Senior player group'],
      confidentiality_level: 'Board Only',
      tactical_model_required: 'Possession dominant with aggressive rest defence',
      pressing_intensity_required: 'High',
      build_preference_required: 'Build from back',
      leadership_profile_required: 'High authority communicator with elite staff standards',
      risk_tolerance: 'Medium',
      language_requirements: ['English'],
      relocation_required: true,
    },
    {
      status: 'Active',
      priority: 'High',
      pipeline_stage: 'shortlisting',
      targetMonths: 3,
      budget_band: '£4M to £7M annual package',
      strategic_objective: 'Identify a durable identity coach who can return the club to Europe and reconnect supporter belief with the football model.',
      board_risk_appetite: 'Low to moderate. Cultural fit and supporter trust carry heavy weight.',
      succession_timeline: 'Decision window aligned to summer 2026 planning',
      key_stakeholders: ['Chairman', 'Chief football officer', 'Recruitment lead', 'Supporter advisory group'],
      confidentiality_level: 'Restricted',
      tactical_model_required: 'Front foot attacking football with structured press',
      pressing_intensity_required: 'High',
      build_preference_required: 'Progressive through thirds',
      leadership_profile_required: 'Clear identity builder with public communication strength',
      risk_tolerance: 'Low',
      language_requirements: ['English'],
      relocation_required: true,
    },
    {
      status: 'Active',
      priority: 'High',
      pipeline_stage: 'board_approved',
      targetMonths: 4,
      budget_band: '£2M to £4M annual package',
      strategic_objective: 'Modernise the playing model without compromising Premier League resilience, set piece edge or transition threat.',
      board_risk_appetite: 'Low. The club wants measured evolution rather than ideological reset.',
      succession_timeline: 'Shadow process through the final quarter of 2026',
      key_stakeholders: ['Owner', 'Vice chair', 'Technical director', 'Academy director'],
      confidentiality_level: 'Standard',
      tactical_model_required: 'Compact transition capable side with improved possession control',
      pressing_intensity_required: 'Medium',
      build_preference_required: 'Mixed',
      leadership_profile_required: 'Pragmatic moderniser with strong player relationships',
      risk_tolerance: 'Low',
      language_requirements: ['English'],
      relocation_required: true,
    },
  ] as const
  const mandateIds: string[] = []
  for (let m = 0; m < 3; m++) {
    const id = demoUuid(userId, 'mandate', m)
    mandateIds.push(id)
    const mandate = mandateBriefs[m]!
    const { error } = await supabase.from('mandates').upsert(
      {
        id,
        user_id: userId,
        club_id: clubIds[m]!,
        status: mandate.status,
        priority: mandate.priority,
        pipeline_stage: mandate.pipeline_stage,
        engagement_date: pastDate(1 + m),
        target_completion_date: pastDate(-mandate.targetMonths),
        ownership_structure: CLUB_DEMO_BRIEFS[m]!.ownership_model,
        budget_band: mandate.budget_band,
        strategic_objective: mandate.strategic_objective,
        board_risk_appetite: mandate.board_risk_appetite,
        succession_timeline: mandate.succession_timeline,
        key_stakeholders: [...mandate.key_stakeholders],
        confidentiality_level: mandate.confidentiality_level,
        tactical_model_required: mandate.tactical_model_required,
        pressing_intensity_required: mandate.pressing_intensity_required,
        build_preference_required: mandate.build_preference_required,
        leadership_profile_required: mandate.leadership_profile_required,
        risk_tolerance: mandate.risk_tolerance,
        language_requirements: [...mandate.language_requirements],
        relocation_required: mandate.relocation_required,
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

  // 13b) Mandate deliverables – enough operating texture for the command centre and workspace.
  const deliverableTemplates = [
    [
      'Board alignment pack with scoring rationale and risk register',
      'First round reference calls with former sporting directors',
      'Compensation and staff package benchmark',
      'Preferred candidate interview agenda and evaluation rubric',
    ],
    [
      'Supporter narrative and communication risk brief',
      'Longlist calibration against attacking identity requirement',
      'Agent contact plan for top five candidates',
      'Final shortlist readout for football committee',
    ],
    [
      'Premier League survival risk model by candidate profile',
      'Set piece and transition coaching capability review',
      'Academy pathway fit assessment',
      'Board decision memo with appointment trade offs',
    ],
  ]
  const deliverableStatuses = ['In Progress', 'Not Started', 'In Progress', 'Blocked'] as const
  for (let m = 0; m < 3; m++) {
    for (let d = 0; d < deliverableTemplates[m]!.length; d++) {
      const id = demoUuid(userId, `deliverable-${m}`, d)
      const dueDate = pastDate(-(d + 1 + m))
      const { error } = await supabase.from('mandate_deliverables').upsert(
        {
          id,
          mandate_id: mandateIds[m]!,
          item: deliverableTemplates[m]![d]!,
          due_date: dueDate,
          status: deliverableStatuses[d % deliverableStatuses.length]!,
        },
        { onConflict: 'id' }
      )
      if (!error) counts.mandate_deliverables++
    }
  }

  // 13c) Mandate activity and alerts – make the dashboard proactive immediately after seeding.
  const mandateActivities = [
    'Board mandate opened and decision criteria agreed.',
    'Longlist refreshed with scoring model output.',
    'Shortlist reviewed with risk and relationship notes.',
  ]
  for (let m = 0; m < 3; m++) {
    for (let a = 0; a < mandateActivities.length; a++) {
      const id = demoUuid(userId, `mandate-activity-${m}`, a)
      const { error } = await supabase.from('activity_log').insert({
        id,
        user_id: userId,
        entity_type: 'mandate',
        entity_id: mandateIds[m]!,
        action_type: ['mandate_opened', 'longlist_reviewed', 'shortlist_reviewed'][a]!,
        description: mandateActivities[a]!,
        metadata: null,
        created_at: pastDate(a) + 'T10:00:00.000Z',
      })
      if (!error) counts.activity_log = (counts.activity_log ?? 0) + 1
    }
  }

  const alertTemplates = [
    {
      entity_type: 'mandate',
      entityIndex: 0,
      alert_type: 'decision_needed',
      title: 'Interview decision needed',
      detail: 'Chelsea mandate has three shortlisted coaches and needs a board decision on interview order.',
    },
    {
      entity_type: 'mandate',
      entityIndex: 1,
      alert_type: 'shortlist_gap',
      title: 'Shortlist needs one safer option',
      detail: 'Tottenham search has strong upside profiles but lacks a lower risk continuity candidate.',
    },
    {
      entity_type: 'coach',
      entityIndex: 1,
      alert_type: 'availability_change',
      title: 'High fit coach open to conversation',
      detail: 'Lucia Serrano is now open to the right Premier League project according to a high confidence source.',
    },
    {
      entity_type: 'coach',
      entityIndex: 6,
      alert_type: 'relationship_signal',
      title: 'Agent route is warm',
      detail: 'Jonas Keller has a strong intermediary connection through an agent already active with the club.',
    },
  ] as const
  for (let i = 0; i < alertTemplates.length; i++) {
    const alert = alertTemplates[i]!
    const entityId = alert.entity_type === 'mandate' ? mandateIds[alert.entityIndex]! : coachIds[alert.entityIndex]!
    const alertHour = String(8 + i).padStart(2, '0')
    const { error } = await supabase.from('alerts').upsert(
      {
        id: demoUuid(userId, 'alert', i),
        user_id: userId,
        entity_type: alert.entity_type,
        entity_id: entityId,
        alert_type: alert.alert_type,
        title: alert.title,
        detail: alert.detail,
        is_seen: false,
        created_at: pastDate(0) + `T${alertHour}:15:00.000Z`,
      },
      { onConflict: 'id' }
    )
    if (!error) counts.alerts = (counts.alerts ?? 0) + 1
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
    const playerPool = [
      'Marco Silva', 'Leo Duarte', 'Tariq Bello', 'Ivan Petrovic', 'Mateo Alvarez', 'Noah Jensen',
      'Ruben Costa', 'Yannis Pappas', 'Milan Kovac', 'Victor Hugo', 'Sami Kader', 'Aiden Price',
      'Luca Marino', 'Gabriel Soares', 'Tommy Hart', 'Adem Yilmaz', 'Nico Pereira', 'Hugo Mendes',
      'Ben Kavanagh', 'Yuri Sato', 'Samuel Reed', 'Mikael Lund', 'Karim Benali', 'Jonas Eriksen',
    ]
    for (let r = 0; r < n; r++) {
      const id = demoUuid(userId, `recruit-${c}`, r)
      const agent = agentPool[r % agentPool.length]!
      const repeatedSigning = r < 2 || (c % 4 === 0 && r === 5)
      const { error } = await supabase.from('coach_recruitment_history').upsert(
        {
          id,
          coach_id: coachIds[c]!,
          player_name: playerPool[(c * 3 + r) % playerPool.length]!,
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
