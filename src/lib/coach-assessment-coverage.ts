import { ASSESSMENT_CRITERIA, EVIDENCE_METHODS, type CriterionKey } from './assessment/criteria.ts'
import { evidenceStatus, type EvidenceRecord } from './decision-workflow.ts'
import { isIllustrativeEvidence } from './assessment/evidence-integrity.ts'

export type CoverageQuestion = {
  id: string; assessment_area?: string | null; evidence_methods?: string[];
  mandate_id: string | null; status: string; answer: string; question: string;
  counter_evidence: string; decision_impact: string; evidence_claim_ids: string[]; updated_at: string;
}
export type CoverageFinding = EvidenceRecord & { id: string; claimed_value: string }

// Priorities for investigation, not a completeness score or a requirement that
// every method must be available. AI summaries never substitute for these.
export const AREA_METHODS: Record<CriterionKey, string[]> = {
  coach_profile: ['desktop_research', 'candidate_interview', 'references'],
  performance_impact: ['data_analysis', 'desktop_research'],
  tactical_proposal: ['match_analysis', 'candidate_interview', 'references'],
  match_management: ['match_analysis', 'data_analysis', 'references'],
  training_management: ['training_observation', 'candidate_interview', 'references'],
  players_development: ['data_analysis', 'candidate_interview', 'references'],
  media_comms: ['media_review', 'candidate_interview', 'references'],
  personality_profile: ['candidate_interview', 'references', 'media_review'],
  cultural_org_fit: ['desktop_research', 'candidate_interview', 'references'],
}

export function validateResearchClassification(area: string | null, methods: string[], findingIds: string[]) {
  if (area && !ASSESSMENT_CRITERIA.some(a => a.key === area)) return 'Choose a valid assessment area.'
  if (methods.length > 8 || methods.some(m => !EVIDENCE_METHODS.some(option => option.key === m))) return 'Choose valid evidence methods.'
  if (methods.length && !findingIds.length) return 'Link the findings from these methods before recording them as evidence used.'
  return null
}

export function assessmentCoverage(questions: CoverageQuestion[], findings: CoverageFinding[], now = Date.now()) {
  // Club-specific answers must never become general conclusions about a coach.
  const general = questions.filter(q => !q.mandate_id)
  return ASSESSMENT_CRITERIA.map(area => {
    const rows = general.filter(q => q.assessment_area === area.key).sort((a,b) => b.updated_at.localeCompare(a.updated_at))
    const answers = rows.filter(q => q.status === 'answered' && q.answer.trim() && !isIllustrativeEvidence(q)).map(q => {
      const linked = q.evidence_claim_ids.map(id => findings.find(f => f.id === id)).filter((f): f is CoverageFinding => !!f)
      const sources = linked.filter(f => evidenceStatus(f, now) !== 'Illustrative')
      return { ...q, sources, needsReview: sources.length !== q.evidence_claim_ids.length || sources.some(f => evidenceStatus(f, now) !== 'Verified record'), disputed: !!q.counter_evidence.trim() || sources.some(f => evidenceStatus(f, now) === 'Disputed') }
    }).filter(q => q.sources.length > 0)
    const methods = [...new Set(answers.filter(q => q.sources.length === q.evidence_claim_ids.length).flatMap(q => q.evidence_methods ?? []))]
    return {
      ...area, rows, answers, methods,
      open: rows.filter(q => q.status !== 'answered'),
      held: rows.filter(q => q.status === 'answered').length - answers.length,
      missingMethods: AREA_METHODS[area.key].filter(m => !methods.includes(m)),
    }
  })
}
