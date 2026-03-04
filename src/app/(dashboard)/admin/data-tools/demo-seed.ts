/**
 * Deterministic demo data generator for investor demo.
 * Uses stable UUIDs derived from user_id + prefix + index so re-runs upsert instead of duplicating.
 */
import { createHash } from 'crypto'

export function demoUuid(userId: string, prefix: string, index: number): string {
  const seed = `${userId}:demo:${prefix}:${index}`
  const h = createHash('sha256').update(seed).digest()
  const bytes = Array.from(h.slice(0, 16))
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  return bytes
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
}

export const DEMO_COACH_NAMES = [
  'Marcus Reid', 'Elena Vasquez', 'James Okonkwo', 'Sophie Bergström', 'David Chen',
  'Isabella Rossi', 'Thomas Müller', 'Yuki Tanaka', 'Olivia Nkosi', 'Lucas Silva',
  'Emma Kowalski', 'Ahmed Hassan',
]

export const DEMO_NATIONALITIES = [
  'British', 'Spanish', 'Nigerian', 'Swedish', 'Chinese', 'Italian', 'German',
  'Japanese', 'South African', 'Brazilian', 'Polish', 'Egyptian',
]

export const DEMO_BASE_LOCATIONS = [
  'London', 'Madrid', 'Lagos', 'Stockholm', 'Shanghai', 'Milan', 'Munich',
  'Tokyo', 'Johannesburg', 'São Paulo', 'Warsaw', 'Cairo',
]

export const DEMO_LANGUAGES: string[][] = [
  ['English'], ['Spanish', 'English'], ['English', 'French'], ['Swedish', 'English'],
  ['Mandarin', 'English'], ['Italian', 'English'], ['German', 'English'],
  ['Japanese', 'English'], ['English', 'Zulu'], ['Portuguese', 'Spanish'],
  ['Polish', 'English'], ['Arabic', 'English'],
]

export const AVAILABILITY_OPTIONS = ['Available', 'Open to offers', 'Under contract', 'In discussions']
export const REPUTATION_TIERS = ['Emerging', 'Established', 'Elite', 'World-class']
export const WAGE_BANDS = ['£500k - £1m/yr', '£1m - £2m/yr', '£2m - £4m/yr', '£4m+']
export const PRESSING_OPTIONS = ['Low', 'Medium', 'High', 'Very high']
export const BUILD_OPTIONS = ['Direct', 'Mixed', 'Build from back', 'Possession-dominant']
export const LEADERSHIP_OPTIONS = ['Authoritarian', 'Collaborative', 'Hands-off', 'Mentor']

export const INTEL_CATEGORIES = ['performance', 'leadership', 'tactics', 'recruitment', 'risk']
export const INTEL_TITLES: Record<string, string[]> = {
  performance: ['Strong run of results', 'Cup run', 'League form dipped', 'Promotion achieved', 'Relegation battle'],
  leadership: ['Dressing room support', 'Board alignment', 'Staff turnover', 'Player development focus', 'Media handling'],
  tactics: ['System change', 'Formation tweak', 'Pressing intensity', 'Set piece improvement', 'In-game adjustments'],
  recruitment: ['Transfer window activity', 'Academy integration', 'Loan market use', 'Agent relationship', 'Scouting network'],
  risk: ['Contract dispute', 'Injury crisis', 'Disciplinary issue', 'Board pressure', 'Fan unrest'],
}

/** Roles used for staff records and coach_staff_history (Staff Network tab). */
export const STAFF_NETWORK_ROLES = [
  'Assistant Coach',
  'First Team Coach',
  'Performance Analyst',
  'Goalkeeper Coach',
  'Set Piece Coach',
  'Sporting Director',
  'President',
] as const

/** Specialties for staff (2–4 per staff). */
export const STAFF_SPECIALTIES_POOL = [
  'Tactical analysis', 'Player development', 'Set pieces', 'Opposition analysis',
  'Data & video', 'Goalkeeping', 'Fitness & periodisation', 'Recruitment',
  'Match preparation', 'In-game adjustments', 'Academy pathway', 'Leadership',
] as const

/** Short profile notes for demo staff. */
export const STAFF_NOTES_POOL = [
  'Long-serving assistant with strong tactical input.',
  'Data-driven analyst; set piece and opposition focus.',
  'Former player; goalkeeper specialist and distribution.',
  'Set piece specialist; improved goals from dead balls.',
  'Aligned on recruitment and squad building.',
  'Trusted with in-game adjustments and bench communication.',
  'Collaborative on training design and periodisation.',
  'Led performance analysis and video review.',
  'Strong academy links and youth development.',
  'Board-level experience; strategic oversight.',
  'Hands-on first team coach; session delivery.',
  'Recruitment and scouting network.',
  'Match day operations and prep.',
  'Sports science and load management.',
  'Multi-club experience; adaptable.',
  'Language skills; international experience.',
  'Promotion and relegation battle experience.',
  'Cup run and knockout experience.',
  'Stable long-term partnerships with head coaches.',
  'Versatile across analysis and coaching.',
] as const

/** Legacy list for any other use; prefer STAFF_NETWORK_ROLES for demo staff. */
export const STAFF_ROLES = [...STAFF_NETWORK_ROLES]

export const IMPACT_SUMMARIES = [
  'Long term assistant trusted with tactical preparation and match planning.',
  'Key analyst for set pieces and opposition analysis; strong data-driven input.',
  'Goalkeeper coach with proven track record on shot-stopping and distribution.',
  'Set piece specialist; improved goals from dead balls and defensive organisation.',
  'Sporting director relationship; aligned on recruitment and squad building.',
  'Trusted with in-game adjustments and bench communication.',
  'Collaborative on training design and periodisation.',
  'Led performance analysis and video review processes.',
]

export const STAFF_NAMES = [
  'Paul Wright', 'Maria Santos', 'John Smith', 'Anna Lindqvist', 'Carlos Mendez',
  'Lisa Weber', 'Michael Brown', 'Eva Novak', 'Daniel Kim', 'Rachel Green',
  'Andrew Taylor', 'Sarah Connor', 'Chris Evans', 'Nina Patel', 'Mark Johnson',
  'Julia Roberts', 'Steve Wilson', 'Laura Davis', 'Kevin Lee', 'Emma Thompson',
]

export const CLUB_NAMES = ['Northgate FC', 'Riverside Athletic', 'Metro United']
export const CLUB_LEAGUES = ['Championship', 'League One', 'Premier League']
export const CLUB_COUNTRIES = ['United Kingdom', 'United Kingdom', 'United Kingdom']
