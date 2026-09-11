import type { Database, Json } from '../types/db.ts'

export const BRIEF_FIELD_LABELS = {
  title: 'Brief title',
  role_title: 'Role',
  appointment_context: 'Appointment context',
  football_identity: 'Football identity',
  in_possession_requirements: 'In possession',
  out_of_possession_requirements: 'Out of possession',
  transition_requirements: 'Transitions',
  set_piece_requirements: 'Set pieces',
  squad_context: 'Squad context',
  player_development_priorities: 'Player development',
  leadership_and_culture: 'Leadership and culture',
  budget_parameters: 'Financial parameters',
  availability_timeline: 'Availability and timeline',
  location_requirements: 'Location and language',
  work_permit_position: 'Eligibility note',
  process_requirements: 'Decision process',
  confidentiality_notes: 'Confidentiality protocol',
} as const
export type BriefField = keyof typeof BRIEF_FIELD_LABELS
export type BriefSnapshot = Record<BriefField, string | null>
export type BriefAmendment = Database['public']['Tables']['club_brief_amendments']['Row']
export const BRIEF_FIELDS = Object.keys(BRIEF_FIELD_LABELS) as BriefField[]

export function briefSnapshot(value: unknown): BriefSnapshot {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return Object.fromEntries(BRIEF_FIELDS.map(key => [key, typeof record[key] === 'string' ? record[key] : null])) as BriefSnapshot
}

export function effectiveBrief(original: unknown, amendments: readonly BriefAmendment[]) {
  const accepted = amendments.filter(a => a.status === 'accepted' && a.accepted_version !== null)
    .sort((a, b) => b.accepted_version! - a.accepted_version!)[0]
  return { version: accepted?.accepted_version ?? 1, snapshot: briefSnapshot(accepted?.after_snapshot ?? original) }
}

export function amendmentChanges(before: unknown, after: unknown) {
  const original = briefSnapshot(before)
  const revised = briefSnapshot(after)
  return BRIEF_FIELDS.filter(key => original[key] !== revised[key])
    .map(key => ({ key, label: BRIEF_FIELD_LABELS[key], before: original[key], after: revised[key] }))
}

export function parseAmendmentForm(form: FormData): { changes: Record<string, Json>; reason: string; baseVersion: number } {
  const reason = String(form.get('request_reason') ?? '').trim()
  const baseVersion = Number(form.get('base_version'))
  const selected = form.getAll('changed_fields').map(String)
  if (!reason || reason.length > 4000) throw new Error('Explain why the brief needs to change (up to 4,000 characters).')
  if (!Number.isSafeInteger(baseVersion) || baseVersion < 1) throw new Error('Reload the agreed brief before requesting changes.')
  if (!selected.length || selected.some(key => !BRIEF_FIELDS.includes(key as BriefField))) throw new Error('Select the fields you want to change.')
  const changes: Record<string, Json> = {}
  for (const key of selected) {
    const value = String(form.get(key) ?? '').trim()
    if (value.length > 12000) throw new Error('Each field must be no longer than 12,000 characters.')
    if (['title', 'role_title'].includes(key) && !value) throw new Error('Brief title and role cannot be empty.')
    changes[key] = value || null
  }
  return { changes, reason, baseVersion }
}
