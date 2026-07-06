// GBE (Governing Body Endorsement) work-permit calculator for managers.
// Deterministic assessment from coaching stints: cumulative months as a
// first-team manager in banded leagues over the last 5 years, plus licence.
//
// Banded thresholds (managers criteria, simplified auto-pass routes):
//   Band 1: >= 12 cumulative months in the last 5 years
//   Band 1-2: >= 24 cumulative months
//   Band 1-5: >= 36 cumulative months
// Plus: holds (or is enrolled on) a UEFA Pro Licence.

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

// League name -> GBE band lookup. Matched case-insensitively on substrings so
// common data variants ("Premier League", "English Premier League") resolve.
const LEAGUE_BANDS: Array<{ pattern: RegExp; band: number }> = [
  // Band 1
  { pattern: /premier league(?! ?2)(?!.*(scot|welsh|irish|academy|u21|u23))/i, band: 1 },
  { pattern: /la ?liga(?! ?2)/i, band: 1 },
  { pattern: /bundesliga(?! ?2)|(?<!2\. )bundesliga/i, band: 1 },
  { pattern: /serie a/i, band: 1 },
  { pattern: /ligue 1/i, band: 1 },
  // Band 2
  { pattern: /championship/i, band: 2 },
  { pattern: /eredivisie/i, band: 2 },
  { pattern: /primeira liga|liga portugal/i, band: 2 },
  { pattern: /pro league|belgian/i, band: 2 },
  { pattern: /s(ü|u)per lig/i, band: 2 },
  // Band 3
  { pattern: /2\. ?bundesliga/i, band: 3 },
  { pattern: /serie b/i, band: 3 },
  { pattern: /ligue 2/i, band: 3 },
  { pattern: /la ?liga ?2|segunda/i, band: 3 },
  { pattern: /scottish prem/i, band: 3 },
  { pattern: /mls|major league soccer/i, band: 3 },
  { pattern: /liga mx/i, band: 3 },
  { pattern: /austrian bundesliga/i, band: 3 },
  { pattern: /swiss super league/i, band: 3 },
  // Band 4
  { pattern: /league one/i, band: 4 },
  { pattern: /2\. liga/i, band: 4 },
  { pattern: /allsvenskan|eliteserien|superligaen|danish/i, band: 4 },
  { pattern: /czech|croatian|hnl|ekstraklasa/i, band: 4 },
  // Band 5
  { pattern: /league two/i, band: 5 },
  { pattern: /greek|super league greece/i, band: 5 },
  { pattern: /brasileir(ã|a)o|serie a brazil/i, band: 5 },
  { pattern: /argentin/i, band: 5 },
]

const MANAGER_ROLE = /head coach|first.?team manager|^manager\b|team manager/i
const NON_MANAGER_ROLE = /assistant|interim|caretaker|academy|youth|u\d{2}|reserve|development squad|\beds\b|technical director|sporting director|fitness|goalkeep/i

export function leagueBand(league: string | null | undefined): number | null {
  if (!league) return null
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

  const hasProLicence = coachingLicence === null || coachingLicence === undefined
    ? null
    : /pro/i.test(coachingLicence)

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
