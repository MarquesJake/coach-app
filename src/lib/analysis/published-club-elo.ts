/** Published ClubElo observations. This does not calculate or estimate Elo. */
export type PublishedEloPoint = { date: string; rating: number; segment: number }
export type EloSpell = { start: string; end: string | null }

export function summariseEloSpell(points: PublishedEloPoint[], spell: EloSpell, asOf: string) {
  const end = spell.end && spell.end < asOf ? spell.end : asOf
  const history = points.filter(p => p.date <= asOf).sort((a, b) => a.date.localeCompare(b.date))
  const inSpell = history.filter(p => p.date >= spell.start && p.date <= end)
  if (!inSpell.length) return null
  const prior = history.filter(p => p.date <= spell.start).at(-1)
  const baseline = prior ?? inSpell[0]
  const measured = [baseline, ...inSpell.filter(p => p.date > baseline.date)]
  const last = measured.at(-1)!
  const peak = measured.reduce((a, b) => b.rating > a.rating ? b : a)
  const partial = !prior
  return {
    baseline, last, peak, measured, partial,
    change: last.rating - baseline.rating,
    fullSpellChange: partial ? null : last.rating - baseline.rating,
    fromPeak: last.rating - peak.rating,
    discontinuous: new Set(measured.map(p => p.segment)).size > 1,
  }
}

/** Separate source segments: never draw a continuous line across a declared gap. */
export function eloSegments(points: PublishedEloPoint[]) {
  const segments: PublishedEloPoint[][] = []
  for (const point of points) {
    if (!segments.length || segments.at(-1)!.at(-1)!.segment !== point.segment) segments.push([])
    segments.at(-1)!.push(point)
  }
  return segments
}
