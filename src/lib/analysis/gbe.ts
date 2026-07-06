// GBE (Governing Body Endorsement) work-permit calculator for managers.
// Deterministic assessment from coaching stints: cumulative months as a
// first-team manager in banded leagues over the last 5 years, plus licence.
//
// Banded thresholds (managers criteria, simplified auto-pass routes):
//   Band 1: >= 12 cumulative months in the last 5 years
//   Band 1-2: >= 24 cumulative months
//   Band 1-5: >= 36 cumulative months
// Plus: currently holds a UEFA Pro Licence. Being enrolled on or working towards
// the Pro Licence does NOT satisfy the requirement and does not pass.

export type GbeStatus = 'Pass' | 'Fail' | 'Insufficient data'

export type GbeStintBreakdown = {
  clubName: string
  league: string | null
  band: number | null
  roleTitle: string
  monthsCounted: number
  countsAsManager: boolean
}

export type GbeResult = {
  status: GbeStatus
  monthsBand1: number
  monthsBand1to2: number
  monthsBand1to5: number
  hasProLicence: boolean | null
  passRoute: string | null
  notes: string[]
  breakdown: GbeStintBreakdown[]
}

// Leagues that never count for GBE regardless of name overlap with banded leagues:
// women's, youth/reserve, and non-league competitions (cups, playoffs, friendlies).
// Kept multilingual because football data mixes languages — "Frauen-Bundesliga",
// "Serie A Femminile", "Primera Femenina", "Primavera" must all be excluded.
const DISQUALIFIED_LEAGUE = new RegExp(
  [
    // women's football
    'women', 'ladies', 'girls', 'frauen', 'femmin', 'f(é|e)minin', 'femenin', 'dames', 'kvinn',
    // youth / development / reserve
    'youth', 'juvenil', 'primavera', 'jugend', 'academy', 'academ(i|í)a', 'reserve', 'reserv',
    'development', 'u-?\\d{2}', 'under[-\\s]?\\d{2}', 'sub-?\\d{2}',
    // second-tier developmental leagues that share a top-flight name
    'premier league 2', 'pl2',
    // non-league competitions
    '\\bcup\\b', 'copa', 'coupe', 'coppa', 'pokal', 'trophy', 'troph(é|e)e', 'super ?cup',
    'shield', 'friendly', 'amistoso', 'play.?off', 'play.?out', 'relegation',
  ].join('|'),
  'i'
)

// League name -> GBE band lookup. Matched case-insensitively on substrings so
// common data variants ("Premier League", "English Premier League") resolve.
// Order matters: more specific patterns must come before generic ones
// (e.g. "Austrian Bundesliga" before "Bundesliga", "Serie A Brazil" before "Serie A").
const LEAGUE_BANDS: Array<{ pattern: RegExp; band: number }> = [
  // Specific overrides first
  { pattern: /austrian bundesliga|(?:ö|o)sterreichische bundesliga/i, band: 3 },
  { pattern: /2\. ?bundesliga/i, band: 3 },
  { pattern: /serie b/i, band: 3 },
  { pattern: /ligue 2/i, band: 3 },
  { pattern: /la ?liga ?2|segunda/i, band: 3 },
  { pattern: /brasileir|serie a brazil|brazilian serie a|serie a \(brazil\)/i, band: 5 },
  { pattern: /scottish prem/i, band: 3 },
  { pattern: /mls|major league soccer/i, band: 3 },
  { pattern: /liga mx/i, band: 3 },
  { pattern: /swiss super league/i, band: 3 },
  // Band 1
  { pattern: /premier league(?!.*(scot|welsh|irish))/i, band: 1 },
  { pattern: /la ?liga/i, band: 1 },
  { pattern: /bundesliga/i, band: 1 },
  { pattern: /serie a/i, band: 1 },
  { pattern: /ligue 1/i, band: 1 },
  // Band 2
  { pattern: /championship/i, band: 2 },
  { pattern: /eredivisie/i, band: 2 },
  { pattern: /primeira liga|liga portugal/i, band: 2 },
  { pattern: /jupiler|belgian pro league|belgian first division/i, band: 2 },
  { pattern: /s(ü|u)per lig\b/i, band: 2 },
  // Band 4
  { pattern: /league one/i, band: 4 },
  { pattern: /2\. liga/i, band: 4 },
  { pattern: /allsvenskan|eliteserien|danish superliga|superligaen/i, band: 4 },
  { pattern: /czech first league|fortuna liga|\bhnl\b|ekstraklasa/i, band: 4 },
  // Band 5
  { pattern: /league two/i, band: 5 },
  { pattern: /super league greece|greek super league/i, band: 5 },
  { pattern: /argentin/i, band: 5 },
]

const MANAGER_ROLE = /head coach|first.?team manager|^manager\b|team manager/i
const NON_MANAGER_ROLE = /assistant|interim|caretaker|academy|youth|u\d{2}|reserve|development squad|\beds\b|technical director|sporting director|fitness|goalkeep/i

export function leagueBand(league: string | null | undefined): number | null {
  if (!league) return null
  if (DISQUALIFIED_LEAGUE.test(league)) return null
  for (const { pattern, band } of LEAGUE_BANDS) {
    if (pattern.test(league)) return band
  }
  return null
}

function overlapMonths(start: Date, end: Date, windowStart: Date, windowEnd: Date): number {
  const from = start > windowStart ? start : windowStart
  const to = end < windowEnd ? end : windowEnd
  if (to <= from) return 0
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
}

export type GbeStintInput = {
  club_name: string
  league: string | null
  role_title: string
  started_on: string | null
  ended_on: string | null
}

export function calculateGbe(
  stints: GbeStintInput[],
  coachingLicence: string | null,
  today: Date = new Date()
): GbeResult {
  const windowStart = new Date(today)
  windowStart.setFullYear(windowStart.getFullYear() - 5)

  const notes: string[] = []
  const breakdown: GbeStintBreakdown[] = []
  let monthsBand1 = 0
  let monthsBand1to2 = 0
  let monthsBand1to5 = 0
  let anyUnbandedManagerMonths = false
  let anyUndatedManagerStint = false

  for (const stint of stints) {
    const countsAsManager = MANAGER_ROLE.test(stint.role_title) && !NON_MANAGER_ROLE.test(stint.role_title)
    const band = leagueBand(stint.league)

    let months = 0
    if (stint.started_on) {
      const start = new Date(stint.started_on)
      const end = stint.ended_on ? new Date(stint.ended_on) : today
      months = overlapMonths(start, end, windowStart, today)
    } else if (countsAsManager) {
      anyUndatedManagerStint = true
    }

    if (countsAsManager && months > 0) {
      if (band === 1) monthsBand1 += months
      if (band !== null && band <= 2) monthsBand1to2 += months
      if (band !== null && band <= 5) monthsBand1to5 += months
      if (band === null) anyUnbandedManagerMonths = true
    }

    breakdown.push({
      clubName: stint.club_name,
      league: stint.league,
      band,
      roleTitle: stint.role_title,
      monthsCounted: countsAsManager ? Math.round(months) : 0,
      countsAsManager,
    })
  }

  // "UEFA Pro" / "Pro Licence" count; negated phrasings ("No Pro Licence",
  // "working towards Pro") must not.
  // Requires a held Pro Licence. Negation ("No Pro Licence") and in-progress
  // phrasing ("working towards the Pro Licence") must fail — but an unrelated "no"
  // elsewhere ("Pro Licence, no restrictions") must NOT count as negation, so the
  // negator has to sit immediately before the pro/licence token.
  const licenceText = coachingLicence?.trim() || null
  const licenceLower = licenceText?.toLowerCase() ?? null
  const hasProLicence = licenceLower === null
    ? null
    : /\bpro\b/.test(licenceLower)
      && !/\b(no|not|without|lacks?|awaiting|pending|missing)\s+(the\s+)?(uefa\s+)?(pro\b|a[-\s]?licen|licen)/.test(licenceLower)
      && !/\b(working\s+towards?|towards?|studying|enrolled|in\s+progress|pursuing|candidate\s+for|expected|completing)\b/.test(licenceLower)

  let passRoute: string | null = null
  if (monthsBand1 >= 12) passRoute = '≥ 12 months in a Band 1 league in the last 5 years'
  else if (monthsBand1to2 >= 24) passRoute = '≥ 24 months in Band 1–2 leagues in the last 5 years'
  else if (monthsBand1to5 >= 36) passRoute = '≥ 36 months in Band 1–5 leagues in the last 5 years'

  if (hasProLicence === null) notes.push('Coaching licence not recorded — UEFA Pro Licence is required for GBE.')
  else if (!hasProLicence) notes.push('No UEFA Pro Licence recorded — required for the managers GBE route.')
  if (anyUnbandedManagerMonths) notes.push('Some managerial experience is in leagues outside GBE Bands 1–5 and does not count.')
  if (anyUndatedManagerStint) notes.push('Some managerial stints have no dates recorded and could not be counted.')

  let status: GbeStatus
  if (passRoute && hasProLicence) status = 'Pass'
  else if (passRoute && hasProLicence === null) status = 'Insufficient data'
  else if (!passRoute && (anyUndatedManagerStint || stints.length === 0)) status = 'Insufficient data'
  else status = 'Fail'

  if (status === 'Fail') {
    notes.push('Does not meet an auto-pass route on recorded data. A points-based or exceptions panel assessment may still be possible.')
  }

  return {
    status,
    monthsBand1: Math.round(monthsBand1),
    monthsBand1to2: Math.round(monthsBand1to2),
    monthsBand1to5: Math.round(monthsBand1to5),
    hasProLicence,
    passRoute,
    notes,
    breakdown,
  }
}
