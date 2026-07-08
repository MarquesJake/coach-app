export type SuccessionClub = {
  id: string
  name: string
  league: string | null
  country: string | null
  tier: string | null
  current_manager: string | null
  board_risk_tolerance: string | null
  strategic_priority: string | null
  media_pressure: string | null
  development_vs_win_now: string | null
  environment_assessment: string | null
  instability_risk: string | null
  tactical_model: string | null
  pressing_model: string | null
  build_model: string | null
  market_reputation: string | null
}

export type SuccessionMandateSignal = {
  id: string
  club_id: string | null
  pipeline_stage: string | null
  status: string | null
  strategic_objective: string | null
  succession_timeline: string | null
  created_at: string
}

export type SuccessionIntelSignal = {
  id: string
  entity_id: string | null
  title: string
  category: string | null
  direction: string | null
  confidence: number | null
  occurred_at: string | null
  verified?: boolean | null
}

export type SuccessionInboxSignal = {
  id: string
  club_id: string | null
  review_status: string
  verification_status: string
  direction: string | null
  source_recorded_at: string | null
  created_at: string
}

export type SuccessionCoach = {
  id: string
  name: string
  club_current: string | null
  nationality: string | null
  available_status: string | null
  availability_status: string | null
  market_status: string | null
  tactical_identity: string | null
  preferred_style: string | null
  pressing_intensity: string | null
  build_preference: string | null
  player_development_model: string | null
  academy_integration: string | null
  leadership_style: string | null
  overall_manual_score: number | null
  intelligence_confidence: number | null
}

export type SuccessionPlan = {
  id: string
  club_id: string
  linked_mandate_id: string | null
  status: string
  priority: string
  owner_name: string | null
  next_review_date: string | null
  manager_security: string | null
  succession_timeline: string | null
  desired_archetype: string | null
  board_signal: string | null
  risk_triggers: string[]
  target_profile: unknown
  notes: string | null
  last_signal_at: string | null
  updated_at: string
}

export type RadarClub = {
  club: SuccessionClub
  plan: SuccessionPlan | null
  score: number
  band: 'urgent' | 'watch' | 'nurture'
  archetype: string
  mandateDefaults: SuccessionMandateDefaults
  rationale: string[]
  nextAction: string
  intelCount: number
  staleIntelCount: number
  openInboxCount: number
  warmMandate: SuccessionMandateSignal | null
  suggestedCoaches: Array<SuccessionCoach & { fitScore: number; fitReasons: string[]; fitBreakdown: SuccessionFitBreakdown }>
}

export type SuccessionFitBreakdown = {
  tactical: number
  development: number
  environment: number
  availability: number
  evidence: number
}

export type SuccessionMandateDefaults = {
  strategic_objective: string
  tactical_model_required: string
  pressing_intensity_required: string
  build_preference_required: string
  leadership_profile_required: string
  budget_band: string
  succession_timeline: string
  board_risk_appetite: 'Conservative' | 'Moderate' | 'Aggressive'
  priority: 'High' | 'Medium' | 'Low'
  confidentiality_level: 'Standard' | 'High' | 'Board Only'
}

function text(value: string | null | undefined) {
  return value?.toLowerCase() ?? ''
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term))
}

function daysSince(value: string | null | undefined) {
  if (!value) return Number.POSITIVE_INFINITY
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return Number.POSITIVE_INFINITY
  return Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24))
}

export function successionArchetype(club: SuccessionClub) {
  const brief = [
    club.strategic_priority,
    club.development_vs_win_now,
    club.tactical_model,
    club.pressing_model,
    club.build_model,
    club.environment_assessment,
  ].map(text).join(' ')

  if (includesAny(brief, ['academy', 'youth', 'development', 'player value', 'long-term'])) {
    return 'Development builder'
  }
  if (includesAny(brief, ['relegation', 'survival', 'stability', 'stabilise'])) {
    return 'Stabiliser'
  }
  if (includesAny(brief, ['promotion', 'top four', 'champions league', 'win now'])) {
    return 'Pressure operator'
  }
  if (includesAny(brief, ['press', 'intensity', 'front-foot'])) {
    return 'High-intensity identity coach'
  }
  if (includesAny(brief, ['possession', 'build', 'technical'])) {
    return 'Possession/build-out coach'
  }
  return 'Environment-fit head coach'
}

export function mandateDefaultsForClub(club: SuccessionClub, archetype = successionArchetype(club)): SuccessionMandateDefaults {
  const brief = [
    club.strategic_priority,
    club.development_vs_win_now,
    club.tactical_model,
    club.pressing_model,
    club.build_model,
    club.environment_assessment,
    club.instability_risk,
    club.media_pressure,
  ].map(text).join(' ')

  const isElite = includesAny(brief, ['champions league', 'europe', 'trophy', 'elite', 'top four'])
  const isSurvival = includesAny(brief, ['relegation', 'survival', 'stability', 'stabilise'])
  const isPromotion = includesAny(brief, ['promotion', 'promote'])
  const isDevelopment = archetype === 'Development builder'
  const highPressure = includesAny(brief, ['high', 'extreme', 'pressure', 'sack', 'unstable'])

  const strategic_objective = isElite
    ? 'Win trophies / Champions League'
    : isSurvival
      ? 'Avoid relegation / stabilise'
      : isPromotion
        ? 'Achieve promotion'
        : isDevelopment
          ? 'Develop youth / academy focus'
          : 'Rebuild / new identity'

  const tactical_model_required = includesAny(brief, ['possession', 'build', 'technical'])
    ? 'Possession / build-out'
    : includesAny(brief, ['counter', 'compact', 'direct'])
      ? 'Counter-attack / compact'
      : includesAny(brief, ['press', 'intensity', 'front-foot'])
        ? 'High press / dominant'
        : 'Hybrid / flexible'

  const pressing_intensity_required = includesAny(brief, ['high press', 'intense', 'front-foot'])
    ? 'High'
    : includesAny(brief, ['low block', 'compact', 'low press'])
      ? 'Low'
      : 'Medium'

  const build_preference_required = includesAny(brief, ['short', 'build', 'possession'])
    ? 'Short build'
    : includesAny(brief, ['direct', 'long ball'])
      ? 'Long ball / direct'
      : 'Mixed'

  const leadership_profile_required = archetype === 'Development builder'
    ? 'Developer'
    : archetype === 'Stabiliser'
      ? 'Pragmatic'
      : archetype === 'Pressure operator'
        ? 'Demanding'
        : includesAny(brief, ['culture', 'environment', 'alignment'])
          ? 'Collaborative'
          : 'Strategic'

  const boardRisk = text(club.board_risk_tolerance)
  const board_risk_appetite: SuccessionMandateDefaults['board_risk_appetite'] = includesAny(boardRisk, ['high', 'aggressive', 'extreme'])
    ? 'Aggressive'
    : includesAny(boardRisk, ['low', 'conservative'])
      ? 'Conservative'
      : 'Moderate'

  const league = text(`${club.league} ${club.tier}`)
  const budget_band = includesAny(league, ['premier league', 'champions league'])
    ? '£30m - £60m'
    : includesAny(league, ['championship'])
      ? '£5m - £15m'
      : includesAny(league, ['league one', 'league two'])
        ? '£1m - £5m'
        : '£5m - £15m'

  return {
    strategic_objective,
    tactical_model_required,
    pressing_intensity_required,
    build_preference_required,
    leadership_profile_required,
    budget_band,
    succession_timeline: highPressure ? 'Immediate / within 30 days' : 'End of season / 6+ months',
    board_risk_appetite,
    priority: highPressure ? 'High' : 'Medium',
    confidentiality_level: highPressure ? 'Board Only' : 'High',
  }
}

export function scoreCoachForClub(coach: SuccessionCoach, club: SuccessionClub, archetype: string) {
  const coachText = [
    coach.tactical_identity,
    coach.preferred_style,
    coach.pressing_intensity,
    coach.build_preference,
    coach.player_development_model,
    coach.academy_integration,
    coach.leadership_style,
    coach.available_status,
    coach.availability_status,
    coach.market_status,
  ].map(text).join(' ')
  const clubText = [
    club.strategic_priority,
    club.development_vs_win_now,
    club.tactical_model,
    club.pressing_model,
    club.build_model,
  ].map(text).join(' ')
  const reasons: string[] = []
  const breakdown: SuccessionFitBreakdown = {
    tactical: 40,
    development: 40,
    environment: 40,
    availability: 35,
    evidence: 35,
  }

  if (archetype === 'Development builder' && includesAny(coachText, ['academy', 'youth', 'development', 'player'])) {
    breakdown.development += 35
    reasons.push('development pathway signal')
  }
  if (archetype === 'Stabiliser' && includesAny(coachText, ['organised', 'compact', 'stability', 'experience'])) {
    breakdown.environment += 30
    reasons.push('stability signal')
  }
  if (archetype === 'Pressure operator' && includesAny(coachText, ['promotion', 'elite', 'winner', 'pressure'])) {
    breakdown.environment += 30
    reasons.push('pressure environment signal')
  }
  if (includesAny(`${coachText} ${clubText}`, ['press', 'intensity']) && includesAny(coachText, ['press', 'intensity', 'front-foot'])) {
    breakdown.tactical += 24
    reasons.push('pressing identity fit')
  }
  if (includesAny(`${coachText} ${clubText}`, ['possession', 'build']) && includesAny(coachText, ['possession', 'build', 'technical'])) {
    breakdown.tactical += 24
    reasons.push('build-up identity fit')
  }
  if (includesAny(clubText, ['academy', 'development', 'youth']) && includesAny(coachText, ['academy', 'development', 'youth'])) {
    breakdown.development += 20
    reasons.push('academy pathway fit')
  }
  if (includesAny(clubText, ['culture', 'environment', 'alignment']) && includesAny(coachText, ['collaborative', 'culture', 'communication'])) {
    breakdown.environment += 18
    reasons.push('environment fit signal')
  }
  if (includesAny(coachText, ['available', 'open', 'unattached'])) {
    breakdown.availability += 30
    reasons.push('more executable availability')
  }
  if (coach.overall_manual_score != null) {
    breakdown.evidence += Math.round((coach.overall_manual_score - 50) / 2)
  }
  if (coach.intelligence_confidence != null && coach.intelligence_confidence >= 70) {
    breakdown.evidence += 25
    reasons.push('stronger intelligence confidence')
  }

  const bounded = Object.fromEntries(
    Object.entries(breakdown).map(([key, value]) => [key, Math.max(0, Math.min(100, value))])
  ) as SuccessionFitBreakdown
  const score = Math.round(
    bounded.tactical * 0.28 +
    bounded.development * 0.18 +
    bounded.environment * 0.24 +
    bounded.availability * 0.15 +
    bounded.evidence * 0.15
  )

  return { score: Math.max(0, Math.min(100, score)), reasons: reasons.slice(0, 4), breakdown: bounded }
}

export function buildSuccessionRadar(params: {
  clubs: SuccessionClub[]
  mandates: SuccessionMandateSignal[]
  intelligence: SuccessionIntelSignal[]
  inbox: SuccessionInboxSignal[]
  coaches: SuccessionCoach[]
  plans?: SuccessionPlan[]
}) {
  const mandatesByClub = new Map<string, SuccessionMandateSignal[]>()
  for (const mandate of params.mandates) {
    if (!mandate.club_id) continue
    mandatesByClub.set(mandate.club_id, [...(mandatesByClub.get(mandate.club_id) ?? []), mandate])
  }

  const intelByClub = new Map<string, SuccessionIntelSignal[]>()
  for (const item of params.intelligence) {
    if (!item.entity_id) continue
    intelByClub.set(item.entity_id, [...(intelByClub.get(item.entity_id) ?? []), item])
  }

  const inboxByClub = new Map<string, SuccessionInboxSignal[]>()
  for (const item of params.inbox) {
    if (!item.club_id) continue
    inboxByClub.set(item.club_id, [...(inboxByClub.get(item.club_id) ?? []), item])
  }

  const plansByClub = new Map<string, SuccessionPlan>()
  for (const plan of params.plans ?? []) {
    plansByClub.set(plan.club_id, plan)
  }

  return params.clubs.map((club): RadarClub => {
    const savedPlan = plansByClub.get(club.id) ?? null
    const clubMandates = mandatesByClub.get(club.id) ?? []
    const warmMandate = clubMandates.find((m) => ['identified', 'board_approved'].includes(m.pipeline_stage ?? '')) ?? null
    const intel = intelByClub.get(club.id) ?? []
    const inbox = inboxByClub.get(club.id) ?? []
    const openInbox = inbox.filter((item) => !['promoted', 'archived'].includes(item.review_status))
    const staleIntelCount = intel.filter((item) => daysSince(item.occurred_at) > 90).length
    const negativeIntel = intel.filter((item) => item.direction === 'Negative').length
    const rationale: string[] = []
    let score = 0

    const risk = text(club.instability_risk)
    const boardRisk = text(club.board_risk_tolerance)
    const mediaPressure = text(club.media_pressure)
    const planStatus = text(savedPlan?.status)
    const planPriority = text(savedPlan?.priority)
    const managerSecurity = text(savedPlan?.manager_security)

    if (warmMandate) {
      score += 28
      rationale.push('warm pre-vacancy mandate exists')
    }
    if (includesAny(risk, ['high', 'extreme', 'sack', 'pressure', 'unstable', 'ownership', 'dispute'])) {
      score += 26
      rationale.push('club environment shows instability signal')
    }
    if (includesAny(boardRisk, ['high', 'extreme'])) {
      score += 16
      rationale.push('board risk tolerance needs early alignment')
    }
    if (includesAny(mediaPressure, ['high', 'extreme'])) {
      score += 12
      rationale.push('media pressure raises appointment risk')
    }
    if (includesAny(planStatus, ['active_planning', 'mandate_ready'])) {
      score += 18
      rationale.push('saved succession plan is active')
    }
    if (includesAny(planPriority, ['urgent', 'high'])) {
      score += planPriority === 'urgent' ? 18 : 12
      rationale.push('saved plan priority requires attention')
    }
    if (includesAny(managerSecurity, ['at_risk', 'vacant'])) {
      score += managerSecurity === 'vacant' ? 24 : 18
      rationale.push('manager security signal is live')
    }
    if (!club.current_manager) {
      score += 10
      rationale.push('current manager not confirmed in platform data')
    }
    if (negativeIntel > 0) {
      score += Math.min(14, negativeIntel * 5)
      rationale.push('negative or cautionary club intelligence exists')
    }
    if (openInbox.length > 0) {
      score += Math.min(10, openInbox.length * 3)
      rationale.push('open intelligence needs triage')
    }
    if (intel.length === 0) {
      score += 8
      rationale.push('no club intelligence captured yet')
    }
    if (staleIntelCount > 0) {
      score += Math.min(10, staleIntelCount * 3)
      rationale.push('some source intelligence is stale')
    }

    const archetype = savedPlan?.desired_archetype || successionArchetype(club)
    const mandateDefaults = mandateDefaultsForClub(club, archetype)
    const suggestedCoaches = params.coaches
      .map((coach) => {
        const fit = scoreCoachForClub(coach, club, archetype)
        return { ...coach, fitScore: fit.score, fitReasons: fit.reasons, fitBreakdown: fit.breakdown }
      })
      .filter((coach) => coach.fitScore >= 50)
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 5)

    const band: RadarClub['band'] = score >= 55 ? 'urgent' : score >= 30 ? 'watch' : 'nurture'
    const nextAction = openInbox.length > 0
      ? 'Triage open intelligence before creating a mandate.'
      : intel.length === 0
        ? 'Capture first succession signal: board mood, manager security, target profile.'
        : staleIntelCount > 0
          ? 'Refresh stale sources before recommending names.'
          : 'Build shadow shortlist and keep monitoring.'

    return {
      club,
      score: Math.max(0, Math.min(100, score)),
      plan: savedPlan,
      band,
      archetype,
      mandateDefaults,
      rationale: rationale.slice(0, 4),
      nextAction,
      intelCount: intel.length,
      staleIntelCount,
      openInboxCount: openInbox.length,
      warmMandate,
      suggestedCoaches,
    }
  }).sort((a, b) => b.score - a.score)
}
