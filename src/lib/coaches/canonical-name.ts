import identities from './deep-identity-map.json' with { type: 'json' }

const CANONICAL = new Map((identities as { coachId: string; canonicalName?: string | null; status?: string }[])
  .filter(row => row.status === 'verified' && row.canonicalName)
  .map(row => [row.coachId, row.canonicalName as string]))

/** The reviewed full name for a coach record, so "A. Crosby" and "Danny Rohl" display properly. */
export function canonicalCoachName(coachId: string, stored: string | null | undefined): string {
  return CANONICAL.get(coachId) ?? stored ?? 'Coach'
}
