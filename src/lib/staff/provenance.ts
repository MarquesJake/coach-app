import { isIllustrativeEvidence } from '../assessment/evidence-integrity.ts'

// Exact legacy seed identities confirmed by the saved changes.json audit:
// original staff.notes: "Demo data (illustrative). Identity deliberately withheld;
// no real staff member is represented." Names or anonymous status are not proof.
const fictionalStaffIds = new Set([
  'd7140001-0000-4000-9000-000000000001',
  'd7140002-0000-4000-9000-000000000002',
  'd7140003-0000-4000-9000-000000000003',
  'd7140004-0000-4000-9000-000000000004',
  'd7140005-0000-4000-9000-000000000005',
  'd7140006-0000-4000-9000-000000000006',
])

export function isIllustrativeStaff(record: object | null | undefined): boolean {
  if (!record) return false
  const row = record as Record<string, unknown>
  return fictionalStaffIds.has(String(row.staff_id ?? row.id)) || isIllustrativeEvidence(record)
    || isIllustrativeEvidence({ source_notes: row.notes, description: row.impact_summary, detail: row.before_after_observation, title: row.club_name })
}
