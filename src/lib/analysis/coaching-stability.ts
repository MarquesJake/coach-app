// ── Coaching stability analysis ───────────────────────────────────────────────
// Pure utility — no side effects, no external calls.
// Takes raw coaching history rows and returns structured stability metrics.

export type CoachingRowInput = {
  coach_name?: string
  start_date: string | null
  end_date: string | null
}

export type StabilityLabel = 'Stable' | 'Moderate turnover' | 'High turnover' | 'Insufficient data'
export type StabilityColor = 'emerald' | 'amber' | 'red' | 'muted'

export type StabilityMetrics = {
  // Raw counts
  total_with_dates: number
  coaches_last_5_years: number
  coaches_last_10_years: number
  // Tenure figures (in months)
  avg_tenure_months: number | null
  current_tenure_months: number | null
  // Classification
  stability_label: StabilityLabel
  stability_color: StabilityColor
  // Human-readable summary
  interpretation: string
  // Recruitment-facing risk note
  recruitment_note: string
  // Whether we had enough data to classify
  has_sufficient_data: boolean
}

// ── Internal helpers ──────────────────────────────────────────────────────────

const DAYS_PER_MONTH = 30.4375

function monthsBetween(a: Date, b: Date): number {
  return Math.max(0, (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * DAYS_PER_MONTH))
}

function wasActiveAfter(row: CoachingRowInput, cutoff: Date): boolean {
  // A coach "counts" in a window if their tenure ended after the cutoff date
  // (or is still ongoing — end_date IS NULL)
  const end = row.end_date ? new Date(row.end_date) : new Date()
  return end >= cutoff
}

// ── Main export ───────────────────────────────────────────────────────────────

export function computeCoachingStability(rows: CoachingRowInput[]): StabilityMetrics {
  const now = new Date()
  const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate())
  const tenYearsAgo = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate())

  // Only rows with a start_date can contribute to calculations
  const dated = rows.filter((r) => !!r.start_date)

  // ── Counts ────────────────────────────────────────────────────────────────
  const coaches_last_5_years = dated.filter((r) => wasActiveAfter(r, fiveYearsAgo)).length
  const coaches_last_10_years = dated.filter((r) => wasActiveAfter(r, tenYearsAgo)).length

  // ── Tenure computation ────────────────────────────────────────────────────
  const tenureMonths = dated.map((r) => {
    const start = new Date(r.start_date!)
    const end = r.end_date ? new Date(r.end_date) : now
    // Guard: if end is somehow before start (data error), treat as 0
    return monthsBetween(start, end)
  })

  const avg_tenure_months =
    tenureMonths.length >= 2
      ? tenureMonths.reduce((a, b) => a + b, 0) / tenureMonths.length
      : tenureMonths.length === 1
        ? tenureMonths[0]
        : null

  // Current coach: the entry with end_date IS NULL and the latest start_date
  const currentRows = dated.filter((r) => !r.end_date)
  const currentCoach = currentRows.sort(
    (a, b) => new Date(b.start_date!).getTime() - new Date(a.start_date!).getTime()
  )[0]
  const current_tenure_months = currentCoach
    ? monthsBetween(new Date(currentCoach.start_date!), now)
    : null

  // ── Sufficient data guard ────────────────────────────────────────────────
  // Need at least 2 coaches with dates to make a meaningful classification
  const has_sufficient_data = dated.length >= 2

  // ── Classification ────────────────────────────────────────────────────────
  let stability_label: StabilityLabel
  let stability_color: StabilityColor
  let interpretation: string
  let recruitment_note: string

  if (!has_sufficient_data) {
    stability_label = 'Insufficient data'
    stability_color = 'muted'
    interpretation = 'Insufficient historical data to assess stability.'
    recruitment_note = 'Add coaching history entries to enable stability analysis.'
  } else {
    const avgYrs = avg_tenure_months != null ? avg_tenure_months / 12 : null

    const isStable =
      avg_tenure_months != null &&
      avg_tenure_months >= 30 && // ≥ 2.5 years
      coaches_last_5_years <= 3

    const isHighTurnover =
      (avg_tenure_months != null && avg_tenure_months < 18) || // < 1.5 years
      coaches_last_5_years >= 4

    if (isStable) {
      stability_label = 'Stable'
      stability_color = 'emerald'
      interpretation = `Stable environment with long-term appointments averaging ${avgYrs!.toFixed(1)} years per manager.`
      recruitment_note = 'Stable structure — suited to long-term project coaches with a clear mandate.'
    } else if (isHighTurnover) {
      stability_label = 'High turnover'
      stability_color = 'red'
      const cntStr = `${coaches_last_5_years} manager${coaches_last_5_years !== 1 ? 's' : ''} in the past 5 years`
      const tenureStr =
        avgYrs != null ? ` and an average tenure of ${avgYrs.toFixed(1)} years` : ''
      interpretation = `High turnover environment with ${cntStr}${tenureStr}.`
      recruitment_note = 'High turnover environment — increased risk of short-term appointment. Assess board patience carefully.'
    } else {
      stability_label = 'Moderate turnover'
      stability_color = 'amber'
      const tenureStr = avgYrs != null ? `averaging ${avgYrs.toFixed(1)} years` : ''
      interpretation = `Moderate turnover with managers ${tenureStr}. Periodic resets every 2–3 seasons are typical.`
      recruitment_note = 'Moderate stability — a coach with strong results culture can extend tenure beyond the average.'
    }
  }

  return {
    total_with_dates: dated.length,
    coaches_last_5_years,
    coaches_last_10_years,
    avg_tenure_months,
    current_tenure_months,
    stability_label,
    stability_color,
    interpretation,
    recruitment_note,
    has_sufficient_data,
  }
}

// ── Formatting helpers (shared by both UI surfaces) ───────────────────────────

export function fmtTenure(months: number | null): string {
  if (months === null) return '—'
  if (months < 1) return '<1m'
  if (months < 12) return `${Math.round(months)}m`
  const years = months / 12
  return `${years.toFixed(1)}y`
}
