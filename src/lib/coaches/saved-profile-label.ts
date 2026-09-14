import { isIllustrativeEvidence } from '../assessment/evidence-integrity.ts'

export function savedProfileLabel(record: object, seeded = false): string {
  const values = record as Record<string, unknown>
  const provenance = [values.source_type, values.source_name, values.source_notes].filter(v => typeof v === 'string').join(' ')
  if (seeded || isIllustrativeEvidence(record) || /\b(?:demo|synthetic|fictional)\b/i.test(provenance)) return 'DEMO DATA · legacy example'
  return 'Saved record · source review needed'
}
