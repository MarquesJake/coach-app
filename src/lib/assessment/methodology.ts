import { ASSESSMENT_CRITERIA, EVIDENCE_METHODS, type CriterionKey, type EvidenceMethodKey } from './criteria.ts'
import { AREA_METHODS } from '../coach-assessment-coverage.ts'
import { INTERVIEW_QUESTIONS, REFERENCE_QUESTIONS, type ReferenceStakeholderGroup } from './question-banks.ts'

/** Rasmus's four dimensions: the questions the nine areas answer. */
export const DIMENSIONS = [
  { key: 'track_record', label: 'Track record', question: 'What has he achieved?', areas: ['coach_profile', 'performance_impact'] },
  { key: 'methodology', label: 'Methodology', question: 'How does he work?', areas: ['tactical_proposal', 'match_management', 'training_management', 'players_development'] },
  { key: 'leadership', label: 'Leadership & personality', question: 'Who is he?', areas: ['media_comms', 'personality_profile'] },
  { key: 'context', label: 'Contextual performance', question: 'Why has he succeeded or failed?', areas: ['cultural_org_fit'] },
] as const satisfies readonly { key: string; label: string; question: string; areas: readonly CriterionKey[] }[]

export function dimensionFor(area: CriterionKey) {
  return DIMENSIONS.find(dimension => (dimension.areas as readonly string[]).includes(area)) ?? DIMENSIONS[0]
}

/** Which of the eight methods have produced checked evidence for an area, and which are still to do. */
export function methodCoverage(area: CriterionKey, contributed: ReadonlySet<string>) {
  const expected = AREA_METHODS[area]
  const label = (key: string) => EVIDENCE_METHODS.find(method => method.key === key)?.label ?? key
  return {
    contributed: EVIDENCE_METHODS.filter(method => contributed.has(method.key)).map(method => method.label),
    outstanding: expected.filter(key => !contributed.has(key)).map(label),
  }
}

/** The board's one-word answer, from the analyst's five-step verdict. */
export function boardCall(verdict: string | null | undefined): { call: 'Proceed' | 'Hold' | 'Pass' | 'Undecided'; meaning: string } {
  switch (verdict) {
    case 'Proceed': return { call: 'Proceed', meaning: 'Open talks, subject to the checks listed.' }
    case 'Target': case 'Shortlist': case 'Monitor': return { call: 'Hold', meaning: `Keep him in the picture (${verdict.toLowerCase()}); not a recommendation to approach yet.` }
    case 'Dismiss': return { call: 'Pass', meaning: 'Not for this appointment.' }
    default: return { call: 'Undecided', meaning: 'No verdict recorded yet.' }
  }
}

export type InterviewStatus = 'not_started' | 'prepared' | 'completed' | 'reviewed' | 'follow_up'
export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  not_started: 'Not started',
  prepared: 'Prepared — questions ready, interview not yet held',
  completed: 'Completed — answers recorded, review outstanding',
  reviewed: 'Reviewed — answers checked and counted',
  follow_up: 'Follow-up needed — some answers still unchecked',
}

/** Derived from the recorded answers, never set by hand. */
export function interviewStatus(answers: readonly { verification_status: string | null }[]): InterviewStatus {
  if (!answers.length) return 'prepared'
  const verified = answers.filter(answer => answer.verification_status === 'verified').length
  if (verified === 0) return 'completed'
  return verified === answers.length ? 'reviewed' : 'follow_up'
}

export const STAKEHOLDER_GROUPS: readonly ReferenceStakeholderGroup[] = ['owners_ceos', 'coaching_staff', 'players', 'industry_network', 'journalists']
export const PRIORITY_REFERENCE_KEYS = ['rq_three_strengths', 'rq_three_weaknesses', 'rq_hire_again', 'rq_environment_fit', 'rq_biggest_risk'] as const

export function referenceQuestionsFor(group: ReferenceStakeholderGroup) {
  return REFERENCE_QUESTIONS.filter(question => question.stakeholderGroup === group)
}

/** Patterns across independent references: agreement, conflict and silence on the five priority questions. */
export function referencePatterns(answers: readonly { question_key: string; reference_name: string | null; would_hire_again: string | null; verification_status: string | null; risk_flag: boolean | null }[]) {
  const reviewed = answers.filter(answer => answer.verification_status === 'verified')
  const references = new Set(reviewed.map(answer => answer.reference_name ?? 'unnamed'))
  const hire = reviewed.filter(answer => answer.would_hire_again && answer.would_hire_again !== 'unknown').map(answer => answer.would_hire_again as string)
  const hireYes = hire.filter(value => value === 'yes').length, hireNo = hire.filter(value => value === 'no').length, hireMixed = hire.filter(value => value === 'mixed').length
  const priorityCovered = PRIORITY_REFERENCE_KEYS.filter(key => reviewed.some(answer => answer.question_key === key))
  return {
    independentReferences: references.size,
    reviewedAnswers: reviewed.length,
    unreviewedAnswers: answers.length - reviewed.length,
    priorityAnswered: priorityCovered.length,
    priorityUnanswered: PRIORITY_REFERENCE_KEYS.filter(key => !priorityCovered.includes(key)).map(key => REFERENCE_QUESTIONS.find(question => question.key === key)?.question ?? key),
    hireAgain: hireYes + hireNo + hireMixed === 0 ? 'No reviewed answer yet' : hireNo && hireYes ? `Conflicting — ${hireYes} yes, ${hireNo} no${hireMixed ? `, ${hireMixed} mixed` : ''}` : hireYes ? `${hireYes} yes${hireMixed ? `, ${hireMixed} mixed` : ''}` : hireNo ? `${hireNo} no` : `${hireMixed} mixed`,
    risksFlagged: reviewed.filter(answer => answer.risk_flag).length,
    oneVoice: references.size === 1,
  }
}

export const INTERVIEW_PLAN = {
  standard: INTERVIEW_QUESTIONS.filter(question => question.focus === 'standard'),
  revealing: INTERVIEW_QUESTIONS.filter(question => question.focus === 'three_revealing'),
  clubSpecific: INTERVIEW_QUESTIONS.filter(question => question.focus === 'club_specific'),
}

export const AREA_LABELS = Object.fromEntries(ASSESSMENT_CRITERIA.map(criterion => [criterion.key, criterion.label])) as Record<CriterionKey, string>
export type { EvidenceMethodKey }
