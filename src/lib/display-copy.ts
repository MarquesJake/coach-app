/** Display labels only. Stored research areas and evidence rules stay unchanged. */
const researchLabels: Record<string, string> = {
  'Conditions for success': 'What this coach needs',
  'Football methods': 'Football approach',
  'Career context': 'Career context',
  'Leadership under pressure': 'Leadership under pressure',
  'Working relationships': 'Working relationships',
  'Appointment feasibility': 'Availability and terms',
  'Counterargument': 'Case against',
}
const evidenceLabels: Record<string, string> = {
  Illustrative: 'Example data',
  Disputed: 'Conflicting accounts',
  'Needs refresh': 'Needs updating',
  'Verification date missing': 'Check date missing',
  'Verified record': 'Source checked',
}
export const researchAreaLabel = (value: string) => researchLabels[value] ?? value
export const evidenceLabel = (value: string) => evidenceLabels[value] ?? value
