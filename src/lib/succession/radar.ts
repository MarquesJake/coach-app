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

export type RadarClub = {
  club: SuccessionClub
  score: number
  band: 'urgent' | 'watch' | 'nurture'
  archetype: string
  rationale: string[]
  nextAction: string
  intelCount: number
  staleIntelCount: number
  openInboxCount: number
  warmMandate: SuccessionMandateSignal | null
  suggestedCoaches: Array<SuccessionCoach & { fitScore: number; fitReasons: string[] }>
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
  let score = 40

  if (archetype === 'Development builder' && includesAny(coachText, ['academy', 'youth', 'development', 'player'])) {
    score += 22
    reasons.push('development pathway signal')
  }
  if (archetype === 'Stabiliser' && includesAny(coachText, ['organised', 'compact', 'stability', 'experience'])) {
    score += 18
    reasons.push('stability signal')
  }
  if (archetype === 'Pressure operator' && includesAny(coachText, ['promotion', 'elite', 'winner', 'pressure'])) {
    score += 18
    reasons.push('pressure environment signal')
  }
  if (includesAny(`${coachText} ${clubText}`, ['press', 'intensity']) && includesAny(coachText, ['press', 'intensity', 'front-foot'])) {
    score += 14
    reasons.push('pressing identity fit')
  }
  if (includesAny(`${coachText} ${clubText}`, ['possession', 'build']) && includesAny(coachText, ['possession', 'build', 'technical'])) {
    score += 14
    reasons.push('build-up identity fit')
  }
  if (includesAny(coachText, ['available', 'open', 'unattached'])) {
    score += 10
    reasons.push('more executable availability')
  }
  if (coach.overall_manual_score != null) score += Math.round((coach.overall_manual_score - 50) / 5)
  if (coach.intelligence_confidence != null && coach.intelligence_confidence >= 70) {
    score += 6
    reasons.push('stronger intelligence confidence')
  }

  return { score: Math.max(0, Math.min(100, score)), reasons: reasons.slice(0, 3) }
}

export function buildSuccessionRadar(params: {
  clubs: SuccessionClub[]
  mandates: SuccessionMandateSignal[]
  intelligence: SuccessionIntelSignal[]
  inbox: SuccessionInboxSignal[]
  coaches: SuccessionCoach[]
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

  return params.clubs.map((club): RadarClub => {
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

    const archetype = successionArchetype(club)
    const suggestedCoaches = params.coaches
      .map((coach) => {
        const fit = scoreCoachForClub(coach, club, archetype)
        return { ...coach, fitScore: fit.score, fitReasons: fit.reasons }
      })
      .filter((coach) => coach.fitScore >= 50)
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 3)

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
      band,
      archetype,
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
