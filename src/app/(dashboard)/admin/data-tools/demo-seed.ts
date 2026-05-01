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
  'Adrian Vale', 'Lucia Serrano', 'Kofi Mensah', 'Freja Lindholm', 'Daniel Cho',
  'Matteo Conti', 'Jonas Keller', 'Ren Ito', 'Nadia Mokoena', 'Rafael Teixeira',
  'Marta Nowak', 'Omar Farouk',
]

export const DEMO_NATIONALITIES = [
  'British', 'Spanish', 'Nigerian', 'Swedish', 'Chinese', 'Italian', 'German',
  'Japanese', 'South African', 'Brazilian', 'Polish', 'Egyptian',
]

export const DEMO_BASE_LOCATIONS = [
  'London', 'Madrid', 'Lisbon', 'Stockholm', 'Seoul', 'Milan', 'Munich',
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
  'Long-serving assistant with strong tactical periodisation input.',
  'Data-led analyst focused on opposition detail and rest-defence triggers.',
  'Former professional goalkeeper coach with strong distribution work.',
  'Set-piece specialist with repeat improvement in attacking dead-ball return.',
  'Recruitment liaison with credible links across UK and Iberia markets.',
  'Trusted match-day lieutenant responsible for in-game adaptation.',
  'Collaborative trainer with strong detail on recovery and load management.',
  'Leads video review workflows and post-match debrief process.',
  'Strong academy connector with pathway integration track record.',
  'Executive football operations experience and board-facing communication.',
  'Hands-on first-team coach known for session quality and detail.',
  'Scouting and market intelligence profile; efficient shortlisting process.',
  'Organised match operations profile with calm high-pressure delivery.',
  'High-standard sports science partner focused on availability.',
  'Multi-league background with proven adaptability in transition phases.',
  'Bilingual coach profile with strong dressing-room communication.',
  'Experienced in promotion and survival environments.',
  'Cup competition specialist with strong knockout prep routines.',
  'Stable long-term technical partnership history with head coaches.',
  'Versatile staff profile spanning analysis, coaching, and recruitment.',
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
  'Paul Wright', 'Maria Santos', 'John Holden', 'Anna Lindqvist', 'Carlos Mendez',
  'Lisa Weber', 'Michael Browne', 'Eva Novak', 'Daniel Kim', 'Rachel Hargreaves',
  'Andrew Taylor', 'Sarah Malik', 'Chris ONeill', 'Nina Patel', 'Mark Johnston',
  'Julia Romano', 'Steve Wilson', 'Laura Davies', 'Kevin Lee', 'Emma Thompson',
]

export const CLUB_NAMES = ['Chelsea', 'Tottenham Hotspur', 'West Ham United']
export const CLUB_LEAGUES = ['Premier League', 'Premier League', 'Premier League']
export const CLUB_COUNTRIES = ['England', 'England', 'England']

export const CLUB_DEMO_BRIEFS = [
  {
    ownership_model: 'Private equity ownership',
    tactical_model: 'Possession dominant with high pressing and aggressive rest defence',
    pressing_model: 'High press with counter press triggers after central losses',
    build_model: 'Build from back through goalkeeper and inverted full back rotations',
    board_risk_tolerance: 'Moderate. Board wants upside but needs early proof of control',
    strategic_priority: 'Restore Champions League qualification while protecting the young squad pathway',
    market_reputation: 'Elite resources, high scrutiny, impatient media cycle',
    media_pressure: 'Very high',
    development_vs_win_now: 'Win now with a protected development lane',
    environment_assessment: 'High ceiling environment with intense scrutiny, large squad complexity and strong expectations around style. The next appointment needs authority, clarity and a staff model that can stabilise quickly.',
    instability_risk: 'Board patience is the central risk. Contract structure and sporting director alignment should be agreed before appointment.',
  },
  {
    ownership_model: 'Long tenure private ownership',
    tactical_model: 'Front foot attacking football with structured press',
    pressing_model: 'High to medium high press depending on opponent build shape',
    build_model: 'Progressive build through thirds with vertical runners',
    board_risk_tolerance: 'Moderate to low. Cultural fit and supporter trust matter',
    strategic_priority: 'Return to consistent European qualification and rebuild a durable identity',
    market_reputation: 'Top six platform with strong commercial profile',
    media_pressure: 'High',
    development_vs_win_now: 'Balanced. Immediate table improvement with squad progression',
    environment_assessment: 'Ambitious mandate with strong public emotion around playing style. The board needs a coach who can communicate clearly and handle pressure without destabilising recruitment.',
    instability_risk: 'Supporter narrative can turn quickly if identity is unclear in the first quarter of the season.',
  },
  {
    ownership_model: 'Owner led board',
    tactical_model: 'Compact, transition capable side with improved possession control',
    pressing_model: 'Mid block with selective high press triggers',
    build_model: 'Mixed build with direct options and wide progression',
    board_risk_tolerance: 'Low to moderate. Premier League security remains non negotiable',
    strategic_priority: 'Modernise playing style without losing physical edge and league resilience',
    market_reputation: 'Established Premier League club with strong London pull',
    media_pressure: 'Medium high',
    development_vs_win_now: 'Stability first, then style evolution',
    environment_assessment: 'Pragmatic mandate. The right coach needs to raise technical ceiling while respecting the club appetite for resilience, set pieces and transition threat.',
    instability_risk: 'Style change must be staged. An abrupt tactical reset would create early table risk.',
  },
]

/** Demo agent full names (8). */
export const DEMO_AGENT_FULL_NAMES = [
  'James Walsh', 'Sarah Chen', 'Marc Dubois', 'Elena Rodrigues', 'Thomas Berg',
  'Laura van Dijk', 'Oliver Nielsen', 'Sophie Laurent',
]
/** Demo agent agencies (some null for independents). */
export const DEMO_AGENT_AGENCIES = [
  'Summit Sports', 'Elite Talent Group', null, 'Prime Represents', 'Apex Football',
  'Pinnacle Agency', null, 'Elite Talent Group',
] as (string | null)[]
export const DEMO_AGENT_MARKETS: string[][] = [
  ['UK', 'France'], ['UK', 'Portugal'], ['France', 'Belgium'], ['Portugal', 'Spain'],
  ['UK', 'Netherlands'], ['Netherlands', 'Belgium'], ['Scandinavia', 'UK'], ['France', 'Portugal'],
]
export const DEMO_AGENT_LANGUAGES: string[][] = [
  ['English', 'French'], ['English', 'Mandarin'], ['French', 'English'], ['Portuguese', 'Spanish', 'English'],
  ['English', 'Dutch'], ['Dutch', 'English'], ['English', 'Norwegian'], ['French', 'English'],
]
export const DEMO_AGENT_CONTACT_CHANNELS = ['WhatsApp', 'Email', 'WhatsApp', 'Email', 'Phone', 'WhatsApp', 'Email', 'WhatsApp']
