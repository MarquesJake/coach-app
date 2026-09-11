import { isIllustrativeEvidence } from './assessment/evidence-integrity.ts'

export type EvidenceRecord = {
  verification_status?: string | null; verified?: boolean | null; review_status?: string | null
  source_name?: string | null; source_label?: string | null; source_contact_id?: string | null
  occurred_at?: string | null; verified_at?: string | null; created_at?: string | null
  corroboration_status?: string | null; [key: string]: unknown
}

/** A populated field or confidence number never establishes verification. */
export function evidenceStatus(row: EvidenceRecord, now = Date.now()) {
  if (isIllustrativeEvidence(row)) return 'Illustrative'
  if (/contradict|disput/i.test(String(row.corroboration_status ?? row.verification_status ?? ''))) return 'Disputed'
  const source = row.source_contact_id || row.source_name?.trim() || row.source_label?.trim()
  if (!source) return 'Source missing'
  if (!(row.verified === true || row.verification_status === 'verified')) return 'Unverified'
  const date = row.verified_at || row.occurred_at
  if (!date || !Number.isFinite(Date.parse(date))) return 'Verification date missing'
  if (Date.parse(date) > now) return 'Check date'
  if (now - Date.parse(date) > 90 * 86_400_000) return 'Needs refresh'
  return 'Verified record'
}

export function summariseEvidence(rows: EvidenceRecord[], now = Date.now()) {
  const counts = { recorded: rows.length, verified: 0, illustrative: 0, disputed: 0, stale: 0, missingSource: 0 }
  for (const row of rows) {
    const state = evidenceStatus(row, now)
    if (state === 'Verified record') counts.verified++
    if (state === 'Illustrative') counts.illustrative++
    if (state === 'Disputed') counts.disputed++
    if (state === 'Needs refresh') counts.stale++
    if (state === 'Source missing') counts.missingSource++
  }
  return { ...counts, label: counts.disputed ? 'Conflicting evidence' : counts.verified ? `${counts.verified} current verified record${counts.verified === 1 ? '' : 's'}` : 'Research required' }
}

export const RESEARCH_DOMAINS = ['Conditions for success', 'Football methods', 'Career context', 'Leadership under pressure', 'Working relationships', 'Appointment feasibility', 'Counterargument'] as const
export const RESEARCH_STATUSES = ['open', 'in_progress', 'answered'] as const
export const RESEARCH_PROMPTS: Record<typeof RESEARCH_DOMAINS[number], string> = {
  'Conditions for success': 'What authority, resources and staff does this coach need, and can this club provide them?',
  'Football methods': 'Which dated examples show how the model adapts to different squads or opponents?',
  'Career context': 'What did they inherit, what changed, what failed and why did the appointment end?',
  'Leadership under pressure': 'How did they handle a poor run or a selection dispute? Which accounts disagree?',
  'Working relationships': 'Who held responsibility, how were disagreements resolved, and which staff would actually join?',
  'Appointment feasibility': 'Which confirmed start-date, contract, staff or relocation conditions could prevent this appointment?',
  'Counterargument': 'What is the strongest case against this appointment, and what evidence could change our view?',
}

export function validateResearchQuestion(input: { question: string; decision_impact: string; status: string; answer: string; evidence_claim_ids: string[] }) {
  if (input.question.trim().length < 8 || input.question.length > 2000) return 'Add a specific research question (8–2,000 characters).'
  if (!input.decision_impact.trim() || input.decision_impact.length > 4000) return 'Explain which decision the answer could change.'
  if (!(RESEARCH_STATUSES as readonly string[]).includes(input.status)) return 'Choose a valid research status.'
  if (input.answer.length > 12000) return 'Keep the answer within 12,000 characters.'
  if (input.status === 'answered' && (!input.answer.trim() || input.evidence_claim_ids.length === 0)) return 'An answered question needs a written conclusion and at least one linked finding.'
  return null
}
