import identities from './deep-identity-map.json' with { type: 'json' }
import { researchProfileForName } from '../scoring/research/catalogue.ts'

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

const words = (value: string) => value.trim().split(/\s+/)
const key = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * The working name for a coach record: the researched profile's name where one exists, otherwise
 * the reviewed name — trimmed of middle names when the stored two-word name already matches its
 * first and last words ("Scott Matthew Parker" → "Scott Parker"). "A. Crosby" and "Danny Rohl" still resolve.
 */
export function canonicalCoachName(coachId: string, stored: string | null | undefined): string {
  const canonical = CANONICAL.get(coachId) ?? stored ?? 'Coach'
  const profile = researchProfileForName(canonical) ?? (stored ? researchProfileForName(stored) : undefined)
  if (profile) return DISPLAY_NAMES[profile.name] ?? profile.name
  const c = words(canonical), s = stored ? words(stored) : []
  if (c.length >= 3 && s.length === 2 && key(s[0]) === key(c[0]) && key(s[1]) === key(c[c.length - 1])) return stored!
  return DISPLAY_NAMES[canonical] ?? canonical
}
