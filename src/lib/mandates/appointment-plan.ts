export const SERVICE_MODELS = [
  'full_service_search',
  'curated_shortlist',
  'named_coach_diligence',
  'succession_intelligence',
  'confidential_dossier',
] as const

export type ServiceModel = (typeof SERVICE_MODELS)[number]

export const SERVICE_MODEL_LABELS: Record<ServiceModel, string> = {
  full_service_search: 'Full appointment process',
  curated_shortlist: 'Coach First shortlist',
  named_coach_diligence: 'Named-coach diligence',
  succession_intelligence: 'Succession planning',
  confidential_dossier: 'Confidential dossier',
}

export const SERVICE_MODEL_DESCRIPTIONS: Record<ServiceModel, string> = {
  full_service_search: 'Coach First runs identification, assessment, interviews, feasibility and appointment support.',
  curated_shortlist: 'Coach First builds and assesses a club-ready shortlist.',
  named_coach_diligence: 'The club supplies names; Coach First tests each option in depth.',
  succession_intelligence: 'Build options and intelligence before a vacancy becomes public.',
  confidential_dossier: 'Prepare and control release of one decision-ready coach dossier.',
}

export const ACTION_CATEGORIES = [
  'brief',
  'market',
  'diligence',
  'assessment',
  'interview_references',
  'feasibility',
  'board',
  'release',
  'commercial',
  'general',
] as const

export type ActionCategory = (typeof ACTION_CATEGORIES)[number]

export const ACTION_CATEGORY_LABELS: Record<ActionCategory, string> = {
  brief: 'Brief',
  market: 'Market',
  diligence: 'Diligence',
  assessment: 'Assessment',
  interview_references: 'Interviews & references',
  feasibility: 'Appointment feasibility',
  board: 'Board decision',
  release: 'Confidential release',
  commercial: 'Commercial',
  general: 'General',
}

export const ACTION_PRIORITIES = ['urgent', 'high', 'normal', 'low'] as const
export type ActionPriority = (typeof ACTION_PRIORITIES)[number]

export const ACTION_STATUSES = ['Not Started', 'In Progress', 'Blocked', 'Completed', 'Cancelled'] as const
export type ActionStatus = (typeof ACTION_STATUSES)[number]

export type AppointmentPlanFacts = {
  serviceModel: ServiceModel
  briefComplete: boolean
  candidateCount: number
  recommendationCount: number
  leadCoachId: string | null
  leadCoachName: string | null
  leadCriteriaComplete: number
  leadInterviewCount: number
  leadReferenceCount: number
  leadFeasibilityVerified: boolean
  releaseCount: number
}

export type AppointmentGate = {
  key: 'brief' | 'market' | 'assessment' | 'human_evidence' | 'feasibility' | 'board' | 'release'
  label: string
  status: 'complete' | 'attention' | 'not_started' | 'not_required'
  detail: string
  hrefSuffix: string
}

export type PlanWorkItem = {
  id: string
  item: string
  status: ActionStatus | string
  priority: ActionPriority | string
  due_date: string
  blocked_reason?: string | null
}

type ServiceTargets = {
  candidates: number
  recommendations: number
  humanEvidence: number
  criteria: number
  feasibilityRequired: boolean
  releaseRequired: boolean
}

const TARGETS: Record<ServiceModel, ServiceTargets> = {
  full_service_search: {
    candidates: 5,
    recommendations: 3,
    humanEvidence: 2,
    criteria: 7,
    feasibilityRequired: true,
    releaseRequired: true,
  },
  curated_shortlist: {
    candidates: 5,
    recommendations: 5,
    humanEvidence: 1,
    criteria: 6,
    feasibilityRequired: true,
    releaseRequired: true,
  },
  named_coach_diligence: {
    candidates: 1,
    recommendations: 1,
    humanEvidence: 2,
    criteria: 7,
    feasibilityRequired: true,
    releaseRequired: true,
  },
  succession_intelligence: {
    candidates: 3,
    recommendations: 1,
    humanEvidence: 1,
    criteria: 6,
    feasibilityRequired: false,
    releaseRequired: false,
  },
  confidential_dossier: {
    candidates: 1,
    recommendations: 1,
    humanEvidence: 2,
    criteria: 7,
    feasibilityRequired: true,
    releaseRequired: true,
  },
}

export function isServiceModel(value: string): value is ServiceModel {
  return SERVICE_MODELS.includes(value as ServiceModel)
}

export function calculateAppointmentGates(facts: AppointmentPlanFacts): AppointmentGate[] {
  const target = TARGETS[facts.serviceModel]
  const humanEvidenceCount = facts.leadInterviewCount + facts.leadReferenceCount
  const leadNamed = facts.leadCoachName ?? 'Lead candidate'

  return [
    {
      key: 'brief',
      label: 'Club brief',
      status: facts.briefComplete ? 'complete' : 'attention',
      detail: facts.briefComplete ? 'Football, leadership and appointment constraints recorded.' : 'Complete the football brief and operating constraints.',
      hrefSuffix: '/workspace',
    },
    {
      key: 'market',
      label: 'Candidate field',
      status: facts.candidateCount >= target.candidates ? 'complete' : facts.candidateCount > 0 ? 'attention' : 'not_started',
      detail: facts.candidateCount >= target.candidates
        ? `${facts.candidateCount} decision candidates in scope (minimum ${target.candidates}).`
        : `${facts.candidateCount} of ${target.candidates} decision candidates in scope.`,
      hrefSuffix: '/candidates',
    },
    {
      key: 'assessment',
      label: 'Assessment evidence',
      status: facts.leadCriteriaComplete >= target.criteria ? 'complete' : facts.leadCoachId ? 'attention' : 'not_started',
      detail: facts.leadCoachId
        ? `${leadNamed}: ${facts.leadCriteriaComplete} of 9 methodology criteria completed.`
        : 'No lead candidate is ready for evidence review.',
      hrefSuffix: facts.leadCoachId ? `/assessment/${facts.leadCoachId}` : '/assessment',
    },
    {
      key: 'human_evidence',
      label: 'Football insight',
      status: humanEvidenceCount >= target.humanEvidence ? 'complete' : facts.leadCoachId ? 'attention' : 'not_started',
      detail: facts.leadCoachId
        ? `${facts.leadReferenceCount} references and ${facts.leadInterviewCount} interview records for ${leadNamed}.`
        : 'Targeted conversations begin once a lead option is identified.',
      hrefSuffix: facts.leadCoachId ? `/assessment/${facts.leadCoachId}` : '/assessment',
    },
    {
      key: 'feasibility',
      label: 'Appointment feasibility',
      status: target.feasibilityRequired
        ? facts.leadFeasibilityVerified ? 'complete' : facts.leadCoachId ? 'attention' : 'not_started'
        : 'not_required',
      detail: target.feasibilityRequired
        ? facts.leadFeasibilityVerified
          ? `${leadNamed}'s contract, expectations, family and staff position are verified.`
          : 'Verify contract, compensation, salary, family, relocation and staff requirements.'
        : 'Full feasibility can wait until a live appointment process starts.',
      hrefSuffix: facts.leadCoachId ? `/assessment/${facts.leadCoachId}` : '/assessment',
    },
    {
      key: 'board',
      label: 'Board recommendation',
      status: facts.recommendationCount >= target.recommendations ? 'complete' : facts.recommendationCount > 0 ? 'attention' : 'not_started',
      detail: facts.recommendationCount >= target.recommendations
        ? `${facts.recommendationCount} decision recommendations completed (minimum ${target.recommendations}).`
        : `${facts.recommendationCount} of ${target.recommendations} decision recommendations completed.`,
      hrefSuffix: '/pack',
    },
    {
      key: 'release',
      label: 'Controlled release',
      status: target.releaseRequired
        ? facts.releaseCount > 0 ? 'complete' : facts.recommendationCount > 0 ? 'attention' : 'not_started'
        : 'not_required',
      detail: target.releaseRequired
        ? facts.releaseCount > 0
          ? `${facts.releaseCount} dossier release record${facts.releaseCount === 1 ? '' : 's'} created.`
          : 'Prepare the club preview and confidential release record.'
        : 'No dossier release is required for an internal succession view.',
      hrefSuffix: '/pack',
    },
  ]
}

export function getNextFootballAction(
  gates: AppointmentGate[],
  workItems: PlanWorkItem[],
  today = new Date()
): { label: string; detail: string; hrefSuffix: string; source: 'manual' | 'gate' } {
  const todayKey = today.toISOString().slice(0, 10)
  const openItems = workItems
    .filter((item) => !['Completed', 'Cancelled'].includes(item.status))
    .sort((a, b) => {
      const blockedDelta = Number(b.status === 'Blocked') - Number(a.status === 'Blocked')
      if (blockedDelta !== 0) return blockedDelta
      const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }
      const priorityDelta = (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
      if (priorityDelta !== 0) return priorityDelta
      return a.due_date.localeCompare(b.due_date)
    })

  const urgentManual = openItems.find((item) => item.status === 'Blocked' || item.priority === 'urgent' || item.due_date < todayKey)
  if (urgentManual) {
    return {
      label: urgentManual.item,
      detail: urgentManual.status === 'Blocked'
        ? urgentManual.blocked_reason || 'Resolve the recorded blocker before the process can move.'
        : urgentManual.due_date < todayKey ? `Manual action overdue since ${urgentManual.due_date}.` : 'Urgent manual action.',
      hrefSuffix: '#actions',
      source: 'manual',
    }
  }

  const gate = gates.find((item) => item.status === 'attention' || item.status === 'not_started')
  if (gate) {
    return { label: gate.label, detail: gate.detail, hrefSuffix: gate.hrefSuffix, source: 'gate' }
  }

  if (openItems[0]) {
    return {
      label: openItems[0].item,
      detail: `Due ${openItems[0].due_date}.`,
      hrefSuffix: '#actions',
      source: 'manual',
    }
  }

  return {
    label: 'Appointment plan complete',
    detail: 'No open gates or manual actions remain. Record the outcome and next review.',
    hrefSuffix: '/pack',
    source: 'gate',
  }
}
