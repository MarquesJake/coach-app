/**
 * explanation.ts
 * Deterministic explanation generator for mandate fit results.
 * All text is template-driven — no AI, no randomness.
 */

import type { MandateContext, LeadershipArchetype } from './mandate-adapter'

// ——————————————————————————————————————————————————
// Types
// ——————————————————————————————————————————————————

export interface DimScore {
  score: number | null  // null = IE (insufficient evidence)
  label: 'Strong' | 'Moderate' | 'Weak' | 'IE'
}

export interface MandateDimScores {
  tactical: DimScore
  level: DimScore
  leadership: DimScore
  budget: DimScore
  availability: DimScore
  risk: DimScore  // higher score = more risk
}

export interface ExclusionReason {
  code:
    | 'SAFEGUARDING_FLAG'
    | 'NOT_AVAILABLE_URGENT'
    | 'STRETCH_URGENT_FILTER'
    | 'LEGAL_CONSERVATIVE_BOARD'
    | 'RELOCATION_MISMATCH'
    | 'INSUFFICIENT_PROFILE'
  label: string
  detail?: string
}

export interface Explanation {
  summary: string
  strengths: string[]        // up to 2
  concerns: string[]         // up to 2
  fitLabel: string           // from Football Fit / Appointability split
  comparisonNote?: string    // top 5 only
  ieFlags: string[]          // dimension names with IE flag
  footballFit: number
  appointability: number
}

export type ComparisonType = 'CLEAR' | 'NEAR_TIE' | 'MARGINAL' | 'TIED' | 'TIE_BROKEN_BY_PENALTY'

export interface ComparisonResult {
  type: ComparisonType
  dimension?: string
  delta?: number
}

// ——————————————————————————————————————————————————
// Dimension thresholds
// ——————————————————————————————————————————————————

export const DIM_THRESHOLDS: Record<
  keyof MandateDimScores,
  { strong: number; moderate: number }
> = {
  tactical:     { strong: 75, moderate: 50 },
  level:        { strong: 75, moderate: 50 },
  leadership:   { strong: 75, moderate: 50 },
  budget:       { strong: 80, moderate: 50 },
  availability: { strong: 75, moderate: 40 },
  risk:         { strong: 30, moderate: 67 },  // inverted: lower risk score = better
}

export function getDimLabel(
  dim: keyof MandateDimScores,
  score: number | null
): DimScore['label'] {
  if (score === null) return 'IE'
  if (dim === 'risk') {
    if (score <= DIM_THRESHOLDS.risk.strong) return 'Strong'
    if (score <= DIM_THRESHOLDS.risk.moderate) return 'Moderate'
    return 'Weak'
  }
  const t = DIM_THRESHOLDS[dim]
  if (score >= t.strong) return 'Strong'
  if (score >= t.moderate) return 'Moderate'
  return 'Weak'
}

// ——————————————————————————————————————————————————
// Football Fit & Appointability sub-scores
// ——————————————————————————————————————————————————

export function computeSubScores(dims: MandateDimScores): {
  footballFit: number
  appointability: number
} {
  const t = dims.tactical.score ?? 50
  const l = dims.level.score ?? 50
  const ld = dims.leadership.score ?? 50
  const b = dims.budget.score ?? 50
  const a = dims.availability.score ?? 50
  const r = dims.risk.score ?? 25

  // appointability: average of budget + availability (0–100), then subtract risk drag
  // Using (b+a)/2 ensures the scale reaches 100 for a perfect candidate, unlike the
  // previous 0.33+0.33 weighting that capped at 66.
  const baseAp = (b + a) / 2
  const riskDrag = r * 0.33

  return {
    footballFit: Math.round(t * 0.43 + l * 0.29 + ld * 0.29),
    appointability: Math.max(0, Math.round(baseAp - riskDrag)),
  }
}

function fitLabel(ff: number, ap: number): string {
  if (ff >= 70 && ap >= 70) return 'Strong across both tracks'
  if (ff >= 70 && ap < 70) return 'Tactically strong. Appointment carries practical complexity.'
  if (ff < 70 && ap >= 70) return 'Accessible and low-risk. Tactical alignment is partial.'
  if (ff < 50 && ap < 50) return 'Significant concerns across both tracks.'
  return 'Partial fit across both tracks.'
}

// ——————————————————————————————————————————————————
// Comparison note generation
// ——————————————————————————————————————————————————

const DIM_LABELS: Record<keyof MandateDimScores, string> = {
  tactical: 'Tactical Alignment',
  level: 'Level Suitability',
  leadership: 'Leadership Match',
  budget: 'Budget Feasibility',
  availability: 'Availability',
  risk: 'Risk Profile',
}

export function getComparisonResult(
  higherScores: MandateDimScores,
  lowerScores: MandateDimScores
): ComparisonResult {
  const deltas: { dim: keyof MandateDimScores; delta: number }[] = []

  for (const dim of Object.keys(higherScores) as (keyof MandateDimScores)[]) {
    const h = higherScores[dim].score ?? 50
    const l = lowerScores[dim].score ?? 50
    const delta = dim === 'risk' ? (l - h) : (h - l)  // risk is inverted
    deltas.push({ dim, delta })
  }

  const positive = deltas.filter((d) => d.delta > 0).sort((a, b) => b.delta - a.delta)

  if (positive.length === 0) return { type: 'TIE_BROKEN_BY_PENALTY' }

  const leading = positive[0]
  if (leading.delta >= 15) return { type: 'CLEAR', dimension: DIM_LABELS[leading.dim], delta: leading.delta }
  if (leading.delta >= 9) return { type: 'NEAR_TIE', dimension: DIM_LABELS[leading.dim], delta: leading.delta }
  if (leading.delta >= 3) return { type: 'MARGINAL', dimension: DIM_LABELS[leading.dim], delta: leading.delta }
  return { type: 'TIED' }
}

export function buildComparisonNote(
  rank: number,
  result: ComparisonResult,
  nameAbove?: string,
  combinedAbove?: number,
  combinedThis?: number
): string {
  const gap = combinedAbove != null && combinedThis != null
    ? combinedAbove - combinedThis
    : result.delta ?? 0

  if (rank === 1) {
    // If combined gap is tiny, don't imply a decisive lead based on dimension analysis
    if (gap < 3) return 'Effectively leads by the slimmest of margins. Treat top candidates as equivalent at current mandate specification.'
    if (gap < 9) return `${gap} points ahead. No decisive separation — both top candidates merit board consideration.`
    if (result.type === 'NEAR_TIE') return `${gap} points clear. Marginal overall lead — differentiation is narrow.`
    if (result.type === 'CLEAR') return `${gap} points clear. Primary differentiation: ${result.dimension}.`
    return 'Leads the ranked list at current mandate specification.'
  }

  // For ranks 2–5, if combined gap is small, override dimension type with combined-gap language
  if (gap < 3) return `Effectively equivalent to ${nameAbove}. ${gap === 0 ? 'Identical combined score.' : `${gap}-point margin.`} Both are viable — select on factors outside the model.`
  if (gap < 9 && (result.type === 'CLEAR' || result.type === 'NEAR_TIE')) {
    return `${gap} points behind ${nameAbove}. Gap is narrow — ${result.dimension ?? 'dimension advantage'} is the differentiator.`
  }

  switch (result.type) {
    case 'CLEAR':
      return `${gap} points behind ${nameAbove}. ${result.dimension} is the primary gap.`
    case 'NEAR_TIE':
      return `${gap} points behind ${nameAbove}. Gap is real but narrow — driven by ${result.dimension}.`
    case 'MARGINAL':
      return `Within ${gap} points of ${nameAbove}. Profiles are comparable — ranked on ${result.dimension} only.`
    case 'TIED':
      return `Effectively equivalent to ${nameAbove}. Both are viable. Select on off-model factors.`
    case 'TIE_BROKEN_BY_PENALTY':
      return `Equal combined score. Ranked lower due to risk penalties. Remove the flag and ranking reverses.`
    default:
      return ''
  }
}

// ——————————————————————————————————————————————————
// Strength templates
// ——————————————————————————————————————————————————

interface CoachContext {
  preferred_style?: string | null
  pressing_intensity?: string | null
  build_preference?: string | null
  reputation_tier?: string | null
  leadership_style?: string | null
  wage_expectation?: string | null
  available_status?: string | null
  media_risk_score?: number | null
  // From stints
  recentLeague?: string | null
  recentWinRate?: number | null
  recentPpg?: number | null
}

function strengthForDim(
  dim: keyof MandateDimScores,
  score: number,
  ctx: CoachContext,
  mandate: MandateContext
): string | null {
  switch (dim) {
    case 'tactical':
      if (score >= 90) return `${ctx.preferred_style ?? 'Style'} matches exactly. Pressing confirmed at ${ctx.pressing_intensity ?? 'required'} level. No tactical compromise required.`
      if (score >= 75) return `${ctx.preferred_style ?? 'Style'} compatible with mandate. ${ctx.build_preference ?? 'Build'} is a secondary match. Minor transition adjustment expected.`
      if (score >= 60) return `${ctx.preferred_style ?? 'Style'} adjacent to mandate requirement. Pressing within one tier. Workable but not native.`
      return null

    case 'level':
      if (score >= 80) {
        const wr = ctx.recentWinRate != null ? `${Math.round(ctx.recentWinRate * 100)}%` : 'N/A'
        const ppg = ctx.recentPpg != null ? ctx.recentPpg.toFixed(1) : 'N/A'
        return `Proven at this level. Recent win rate ${wr}, ${ppg} PPG in ${ctx.recentLeague ?? 'last role'}.`
      }
      if (score >= 60) return `Sufficient level exposure. ${ctx.recentLeague ?? 'Top-tier'} experience present. Form metrics acceptable, not exceptional.`
      return null

    case 'leadership':
      if (score >= 80) return `${ctx.leadership_style ?? 'Leadership style'} profile aligns directly with ${archetypeLabel(mandate.primaryArchetype)} mandate demands. ${archetypeDemand(mandate.primaryArchetype)}`
      if (score >= 60) return `${ctx.leadership_style ?? 'Leadership style'} profile is workable within a ${archetypeLabel(mandate.primaryArchetype)} context. No structural board conflict anticipated.`
      return null

    case 'budget':
      if (score >= 85) return `Wage expectation within budget band. No financial barrier.`
      if (score >= 70) return `Financially viable — package within mandate range.`
      return null

    case 'availability':
      if (ctx.available_status === 'Available') return `Unattached. Appointment executable without compensation or notice period.`
      if (ctx.available_status === 'Open to offers' || ctx.available_status === 'Under contract - interested')
        return `Under contract but has signalled interest. Compensation required. Timeline: 2–4 weeks.`
      return null

    case 'risk':
      if (score <= 20) return `Clean background check. No legal, integrity, or safeguarding flags. Media profile is manageable.`
      return null
  }
}

// ——————————————————————————————————————————————————
// Concern templates
// ——————————————————————————————————————————————————

function concernForDim(
  dim: keyof MandateDimScores,
  score: number,
  ctx: CoachContext,
  mandate: MandateContext,
  flags: { legal?: boolean; integrity?: boolean; safeguarding?: boolean }
): string | null {
  switch (dim) {
    case 'tactical':
      if (score < 40) return `${ctx.preferred_style ?? 'Coach style'} versus mandate's ${mandate.styleRequired ?? 'required style'}. Direct conflict. No compatible middle ground.`
      if (score < 60) return `${ctx.preferred_style ?? 'Style'} sits outside the mandate's compatible range. Significant adaptation required from day one.`
      return null

    case 'level':
      if (score < 40) {
        if (!ctx.recentLeague) return `No qualifying senior head coaching stints on record. Level suitability cannot be verified from career data.`
        const wr = ctx.recentWinRate != null ? `${Math.round(ctx.recentWinRate * 100)}% win rate` : null
        const ppg = ctx.recentPpg != null ? `${ctx.recentPpg.toFixed(1)} PPG` : null
        const metrics = [wr, ppg].filter(Boolean).join(', ')
        return `Last senior role: ${ctx.recentLeague}${metrics ? ` (${metrics})` : ''}. Form record is the primary concern at this mandate level.`
      }
      if (score < 60) {
        if (!ctx.recentLeague) return `Insufficient recent data to confirm level fit. Suitability is based on reputation anchor only.`
        const wr = ctx.recentWinRate != null ? ` — ${Math.round(ctx.recentWinRate * 100)}% win rate` : ''
        return `${ctx.recentLeague} experience present${wr}. Form metrics leave questions at the required level.`
      }
      return null

    case 'leadership':
      if (score < 40) return `${ctx.leadership_style ?? 'Leadership style'} profile not suited to ${archetypeLabel(mandate.primaryArchetype)} requirements. Misalignment is likely to surface under pressure.`
      if (score < 60) return `${ctx.leadership_style ?? 'Leadership style'} profile is off-profile for a ${archetypeLabel(mandate.primaryArchetype)} mandate. Board expectations may diverge over time.`
      return null

    case 'budget':
      if (score < 40) return `Wage expectation likely exceeds budget. ${ctx.wage_expectation ?? 'Expected wage'} vs ${mandate.budgetBand ?? 'mandate budget'}.`
      if (score < 60) return `Budget stretch possible. Wage expectation is at upper limit of mandate band.`
      return null

    case 'availability':
      if (ctx.available_status === 'Under contract') return `Contracted and not publicly linked to exits. Formal approach required. Club may resist release.`
      if (ctx.available_status === 'Not available') return `Not available. Current situation removes this candidate from active consideration.`
      if (score < 40) return `Availability is constrained. Appointment timeline is at risk.`
      return null

    case 'risk':
      if (flags.safeguarding) return `Risk flag active: safeguarding. Board sign-off required before formal approach.`
      if (flags.legal) return `Risk flag active: legal. Board review required before formal approach.`
      if (flags.integrity) return `Risk flag active: integrity. Due diligence recommended.`
      if ((ctx.media_risk_score ?? 0) > 70) return `Media risk: ${ctx.media_risk_score}/100. History of press friction. High-profile appointment will attract scrutiny.`
      if (score >= 60) return `Elevated risk profile. Risk score ${score}/100. Board review recommended.`
      return null
  }
}

// ——————————————————————————————————————————————————
// Summary templates
// ——————————————————————————————————————————————————

function buildSummary(
  ff: number,
  ap: number,
  ieFlags: string[],
  topGap?: string,
  dims?: MandateDimScores
): string {
  if (ieFlags.length >= 2) {
    return `Profile gaps limit confidence on ${ieFlags.slice(0, 2).join(' and ')}.`
  }
  if (ff >= 70 && ap >= 70) {
    return 'Strong mandate fit. Tactical identity and appointment logistics both align. No blocking concerns identified.'
  }
  if (ff >= 70 && ap < 70) {
    // Disambiguate whether the drag is availability, budget, or both
    const availScore = dims?.availability.score ?? 50
    const budgetScore = dims?.budget.score ?? 50
    if (availScore < 65 && budgetScore >= 65) {
      return 'Tactically strong. Appointment will require negotiation — currently contracted or under active engagement elsewhere.'
    }
    if (budgetScore < 65 && availScore >= 65) {
      return 'Tactically strong. Budget headroom is limited — package negotiations are likely to be tight.'
    }
    return 'Tactically strong. Both availability and budget require attention before formal approach.'
  }
  if (ff < 70 && ap >= 70) {
    return 'Accessible and low appointment risk. Tactical alignment is partial — requires scrutiny before recommendation.'
  }
  if (ff < 50 && ap < 50 && topGap) {
    return `Below threshold on both tracks. ${topGap} is the primary concern at current mandate specification.`
  }
  return 'Partial fit across both tracks. One or two dimensions require due diligence before board recommendation.'
}

// ——————————————————————————————————————————————————
// Archetype display label + short demand descriptor
// ——————————————————————————————————————————————————

function archetypeLabel(a: LeadershipArchetype): string {
  switch (a) {
    case 'REBUILD': return 'Rebuild'
    case 'ELITE_PRESSURE': return 'Elite Pressure'
    case 'DEVELOPMENT': return 'Development'
    case 'STABILISATION': return 'Stabilisation'
    case 'PROMOTION': return 'Promotion'
  }
}

/** One-line description of what this mandate archetype demands from a coach */
function archetypeDemand(a: LeadershipArchetype): string {
  switch (a) {
    case 'REBUILD': return 'Long-term identity building and structural change management.'
    case 'ELITE_PRESSURE': return 'Delivering results under high accountability — titles, European football, board scrutiny.'
    case 'DEVELOPMENT': return 'Long-cycle thinking, youth integration, building from within.'
    case 'STABILISATION': return 'Galvanising a squad under pressure — points on the board immediately.'
    case 'PROMOTION': return 'Delivering results in a compressed window against a physical, direct brief.'
  }
}

// ——————————————————————————————————————————————————
// Main export: generateExplanation
// ——————————————————————————————————————————————————

export function generateExplanation(
  dims: MandateDimScores,
  mandate: MandateContext,
  coachCtx: CoachContext,
  flags: { legal?: boolean; integrity?: boolean; safeguarding?: boolean },
  options?: { rank?: number; comparisonResult?: ComparisonResult; nameAbove?: string; combinedThis?: number; combinedAbove?: number }
): Explanation {
  const { footballFit, appointability } = computeSubScores(dims)

  // Collect IE flags
  const ieFlags: string[] = []
  for (const [dim, d] of Object.entries(dims) as [keyof MandateDimScores, DimScore][]) {
    if (d.label === 'IE') ieFlags.push(dim)
  }

  // Build strengths: top 2 scored dimensions (non-IE, using effective display score)
  const scoredDims = (Object.keys(dims) as (keyof MandateDimScores)[])
    .filter((d) => dims[d].label !== 'IE' && dims[d].score !== null)
    .sort((a, b) => {
      const sa = a === 'risk' ? (100 - (dims[a].score ?? 50)) : (dims[a].score ?? 0)
      const sb = b === 'risk' ? (100 - (dims[b].score ?? 50)) : (dims[b].score ?? 0)
      return sb - sa
    })

  const strengths: string[] = []
  for (const dim of scoredDims) {
    if (strengths.length >= 2) break
    const score = dims[dim].score!
    const s = strengthForDim(dim, score, coachCtx, mandate)
    if (s) strengths.push(s)
  }

  // Build concerns: bottom 2 scored dimensions (or flagged)
  const weakDims = [...scoredDims].reverse()
  const concerns: string[] = []

  // Risk flags take priority as concerns
  if (flags.safeguarding || flags.legal || flags.integrity) {
    const c = concernForDim('risk', dims.risk.score ?? 0, coachCtx, mandate, flags)
    if (c && concerns.length < 2) concerns.push(c)
  }

  for (const dim of weakDims) {
    if (concerns.length >= 2) break
    const score = dims[dim].score!
    const label = dims[dim].label
    if (label === 'Weak' || (label === 'Moderate' && concerns.length < 2)) {
      const c = concernForDim(dim, score, coachCtx, mandate, flags)
      if (c && !concerns.includes(c)) concerns.push(c)
    }
  }

  // Top gap for summary (weakest non-IE dimension name)
  const topGapDim = weakDims.find((d) => dims[d].label === 'Weak')
  const topGapLabel = topGapDim ? DIM_LABELS[topGapDim] : undefined

  const summary = buildSummary(footballFit, appointability, ieFlags, topGapLabel, dims)
  const label = fitLabel(footballFit, appointability)

  // Comparison note
  let comparisonNote: string | undefined
  if (options?.rank != null && options.rank <= 5) {
    if (options.rank === 1) {
      comparisonNote = buildComparisonNote(1, options.comparisonResult ?? { type: 'CLEAR' }, undefined, undefined, undefined)
    } else if (options.comparisonResult && options.nameAbove) {
      comparisonNote = buildComparisonNote(
        options.rank,
        options.comparisonResult,
        options.nameAbove,
        options.combinedAbove,
        options.combinedThis
      )
    }
  }

  return {
    summary,
    strengths,
    concerns,
    fitLabel: label,
    comparisonNote,
    ieFlags,
    footballFit,
    appointability,
  }
}

// ——————————————————————————————————————————————————
// fit_explanation storage format (pipe-delimited)
// ——————————————————————————————————————————————————

export function serializeExplanation(exp: Explanation): string {
  const parts: string[] = [`SUMMARY: ${exp.summary}`]
  for (const s of exp.strengths) parts.push(`STRENGTH: ${s}`)
  for (const c of exp.concerns) parts.push(`CONCERN: ${c}`)
  return parts.join(' | ')
}

export function deserializeExplanation(raw: string): {
  summary: string
  strengths: string[]
  concerns: string[]
} {
  const parts = raw.split(' | ')
  const summary = parts.find((p) => p.startsWith('SUMMARY: '))?.replace('SUMMARY: ', '') ?? raw
  const strengths = parts.filter((p) => p.startsWith('STRENGTH: ')).map((p) => p.replace('STRENGTH: ', ''))
  const concerns = parts.filter((p) => p.startsWith('CONCERN: ')).map((p) => p.replace('CONCERN: ', ''))
  return { summary, strengths, concerns }
}

// Re-export for use in other modules
const DIM_LABELS_EXPORT: Record<keyof MandateDimScores, string> = {
  tactical: 'Tactical Alignment',
  level: 'Level Suitability',
  leadership: 'Leadership Match',
  budget: 'Budget Feasibility',
  availability: 'Availability',
  risk: 'Risk Profile',
}
export { DIM_LABELS_EXPORT as DIM_LABELS }
