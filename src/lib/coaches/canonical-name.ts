import identities from './deep-identity-map.json' with { type: 'json' }

const CANONICAL = new Map((identities as { coachId: string; canonicalName?: string | null; status?: string }[])
  .filter(row => row.status === 'verified' && row.canonicalName)
  .map(row => [row.coachId, row.canonicalName as string]))

/** Provider records sometimes carry legal full names; the football world uses the working name. */
const DISPLAY_NAMES: Record<string, string> = {
  'Jürgen Norbert Klopp': 'Jürgen Klopp',
  'Jurgen Norbert Klopp': 'Jürgen Klopp',
  'F. Lampard': 'Frank Lampard',
  'S. Dyche': 'Sean Dyche',
  'T. Frank': 'Thomas Frank',
  'G. Potter': 'Graham Potter',
  'Marcelino Garcia Toral': 'Marcelino García Toral',
  'Danny Rohl': 'Danny Röhl',
  'Carlos Corberan': 'Carlos Corberán',
}

/** The reviewed full name for a coach record, so "A. Crosby" and "Danny Rohl" display properly. */
export function canonicalCoachName(coachId: string, stored: string | null | undefined): string {
  const name = CANONICAL.get(coachId) ?? stored ?? 'Coach'
  return DISPLAY_NAMES[name] ?? name
}
