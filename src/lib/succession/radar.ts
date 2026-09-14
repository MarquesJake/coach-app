import { clubResearchRequirements, successionResearchRequirements, rankReviewedCoaches, type ClubResearchRequirements, type ReviewedSuccessionCoach } from './research-fit.ts'
import { isActiveAppointment } from '../coaches/route-audit.ts'
export { scoreCoachForClub } from './research-fit.ts'

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
  tactical_model_required?: string | null
  pressing_intensity_required?: string | null
  build_preference_required?: string | null
  decision_brief?: unknown
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
  requirements: ClubResearchRequirements
  researchCoverage: { reviewed: number; unreviewed: number; ambiguous: number }
  incumbentBenchmark: ReviewedSuccessionCoach | null
  excludedCoaches: ReviewedSuccessionCoach[]
  suggestedCoaches: ReviewedSuccessionCoach[]
}

export type SuccessionMandateDefaults = {
  strategic_objective: string
  tactical_model_required: string
  pressing_intensity_required: string
  build_preference_required: string
  leadership_profile_required: string
  budget_band: string
  succession_timeline: string
  board_risk_appetite: 'Conservative' | 'Moderate' | 'Aggressive' | ''
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

/** Draft defaults only. Unanswered fields stay empty; no league-derived budgets or inferred personal traits. */
export function mandateDefaultsForClub(club: SuccessionClub): SuccessionMandateDefaults {
  const { brief } = clubResearchRequirements(club)
  const boardRisk = text(club.board_risk_tolerance).trim()
  return {
    strategic_objective: brief.strategic_objective ?? '',
    tactical_model_required: brief.tactical_model_required ?? '',
    pressing_intensity_required: brief.pressing_intensity_required ?? '',
    build_preference_required: brief.build_preference_required ?? '',
    leadership_profile_required: '', budget_band: '', succession_timeline: '',
    board_risk_appetite: ['high', 'extreme', 'aggressive'].includes(boardRisk) ? 'Aggressive'
      : ['low', 'conservative'].includes(boardRisk) ? 'Conservative'
        : ['moderate', 'medium'].includes(boardRisk) ? 'Moderate' : '',
    priority: 'Medium', confidentiality_level: 'High',
  }
}

export function buildSuccessionRadar(params: {
  clubs: SuccessionClub[]
  mandates: SuccessionMandateSignal[]
  intelligence: SuccessionIntelSignal[]
  inbox: SuccessionInboxSignal[]
  coaches: SuccessionCoach[]
  plans?: SuccessionPlan[]
  selectedMandateIds?: Record<string, string | undefined>
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
    const savedLink = clubMandates.find(m => m.id === savedPlan?.linked_mandate_id && isActiveAppointment(m))?.id
    const requirements = successionResearchRequirements(club, clubMandates, params.selectedMandateIds?.[club.id] ?? savedLink)
    const mandateDefaults = mandateDefaultsForClub(club)
    const ranking = rankReviewedCoaches(params.coaches, club, requirements)
    const suggestedCoaches = ranking.matches

    const band: RadarClub['band'] = score >= 55 ? 'urgent' : score >= 30 ? 'watch' : 'nurture'
    const nextAction = requirements.source.kind === 'needs-choice'
      ? requirements.source.message
      : !requirements.ready
      ? `Agree at least two supported football requirements in the ${requirements.source.kind === 'mandate' ? 'linked mandate brief' : 'club profile'} before comparing coaches.`
      : ranking.coverage.reviewed === 0
        ? 'Add reviewed, sourced coach research before comparing names.'
        : openInbox.length > 0
      ? 'Triage open intelligence before creating a mandate.'
      : intel.length === 0
        ? 'Capture first succession signal: board mood, manager security, target profile.'
        : staleIntelCount > 0
          ? 'Refresh stale sources before recommending names.'
          : 'Review the sourced football comparisons and confirm appointment constraints.'

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
      requirements,
      researchCoverage: ranking.coverage,
      incumbentBenchmark: ranking.incumbent,
      excludedCoaches: ranking.excluded,
      suggestedCoaches,
    }
  }).sort((a, b) => b.score - a.score)
}
