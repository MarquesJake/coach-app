/**
 * Pure, deterministic intelligence signal computation.
 * No DB calls — takes raw intelligence_items rows and returns derived signals.
 */

export type IntelItem = {
  id: string
  direction: string | null
  confidence: number | null
  source_tier: string | null
  category: string | null
  title: string
  sensitivity: string
  occurred_at: string | null
  created_at: string
}

export type CoachIntelSignals = {
  /** Weighted avg: confidence × (6 − tier). Range 0–500. Normalised to 0–100. */
  overallScore: number | null
  /** 0–100. High = many negative signals from strong sources. */
  riskIndex: number | null
  /** 'High' | 'Medium' | 'Low' | 'None'. Based on item count and tier distribution. */
  profileReliability: 'High' | 'Medium' | 'Low' | 'None'
  /** True when both high-confidence positive AND negative signals coexist. */
  volatile: boolean
  /** Top 2 positive signals (weighted, highest first). */
  topPositive: IntelItem[]
  /** Top 2 negative signals (weighted, highest first). */
  topNegative: IntelItem[]
  /** Total non-deleted items. */
  count: number
  /** True if any item has sensitivity = 'High'. */
  hasSensitive: boolean
  /** Category → count map for pattern detection. */
  categoryGroups: Record<string, number>
}

function itemWeight(item: IntelItem): number {
  const conf = item.confidence ?? 50
  const tier = item.source_tier ? parseInt(item.source_tier, 10) : 3
  const t = isNaN(tier) ? 3 : Math.max(1, Math.min(5, tier))
  return Math.round(conf * (6 - t))
}

export function computeCoachIntelSignals(items: IntelItem[]): CoachIntelSignals {
  const active = items // caller should pre-filter is_deleted = false

  if (active.length === 0) {
    return {
      overallScore: null,
      riskIndex: null,
      profileReliability: 'None',
      volatile: false,
      topPositive: [],
      topNegative: [],
      count: 0,
      hasSensitive: false,
      categoryGroups: {},
    }
  }

  // Weighted scores
  const weighted = active.map((i) => ({ item: i, weight: itemWeight(i) }))
  const totalWeight = weighted.reduce((s, w) => s + w.weight, 0)

  // Overall score: normalised weighted average
  // Max possible weight per item: 100 × (6−1) = 500. Normalise to 0–100.
  const avgWeight = totalWeight / active.length
  const overallScore = Math.round(Math.min(100, avgWeight / 5))

  // Risk index: negative item weights / total weight
  const negWeighted = weighted.filter((w) => w.item.direction === 'Negative')
  const negTotal = negWeighted.reduce((s, w) => s + w.weight, 0)
  const riskIndex = totalWeight > 0 ? Math.round((negTotal / totalWeight) * 100) : 0

  // Profile reliability
  const tier1or2 = active.filter((i) => {
    const t = i.source_tier ? parseInt(i.source_tier, 10) : 5
    return t <= 2
  }).length
  let profileReliability: CoachIntelSignals['profileReliability'] = 'Low'
  if (active.length >= 5 && tier1or2 >= 2) profileReliability = 'High'
  else if (active.length >= 2 || tier1or2 >= 1) profileReliability = 'Medium'

  // Volatility: high-conf positive AND high-conf negative both exist
  const highConfPos = active.some((i) => i.direction === 'Positive' && (i.confidence ?? 0) >= 67)
  const highConfNeg = active.some((i) => i.direction === 'Negative' && (i.confidence ?? 0) >= 67)
  const volatile = highConfPos && highConfNeg

  // Top positive signals: highest weighted, direction = Positive
  const topPositive = weighted
    .filter((w) => w.item.direction === 'Positive')
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 2)
    .map((w) => w.item)

  // Top negative signals: highest weighted, direction = Negative
  const topNegative = weighted
    .filter((w) => w.item.direction === 'Negative')
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 2)
    .map((w) => w.item)

  // Sensitive flag
  const hasSensitive = active.some((i) => i.sensitivity === 'High')

  // Category groups
  const categoryGroups: Record<string, number> = {}
  for (const item of active) {
    const cat = item.category ?? 'Uncategorised'
    categoryGroups[cat] = (categoryGroups[cat] ?? 0) + 1
  }

  return {
    overallScore,
    riskIndex,
    profileReliability,
    volatile,
    topPositive,
    topNegative,
    count: active.length,
    hasSensitive,
    categoryGroups,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Intelligence Adjustment — scoring modifier for mandate fit engine
// ─────────────────────────────────────────────────────────────────────────────

export type IntelligenceAdjustment = {
  /** Clipped to −10…+10. Applied to combined score. */
  scoreAdj: number
  /** Clipped to −10…+5. Applied to appointability sub-score. */
  appointabilityAdj: number
  /** Short human-readable label for ranking output. */
  summaryLabel: string
  /** One-line explanation of what drove the adjustment. */
  adjustmentReason: string
  /** Confidence that the intelligence picture is reliable. */
  decisionConfidence: 'High' | 'Medium' | 'Low'
}

/**
 * Compute how intelligence signals should adjust a coach's mandate fit score.
 * Pure function — no DB calls.
 *
 * Adjustment formula:
 *   positiveAdj  = (overallScore − 50) / 10  capped at +5, floor 0
 *   negativeAdj  = −(riskIndex / 12.5)        capped at −8
 *   net          = positiveAdj + negativeAdj, clipped ±10
 *   volatility   = multiplies magnitude by 0.7 (conflicting signals = uncertainty)
 *   reliability  = High 1.0 | Medium 0.6 | Low 0.3 | None 0 (gates the whole adj)
 *
 * Negative weight is asymmetric: riskIndex / 12.5 vs overallScore / 10.
 * This means a coach with a 100 riskIndex loses more than one with a 100
 * overallScore gains — matching the spec "negative can pull down more than
 * positive can lift".
 */
export function computeIntelligenceAdjustment(
  signals: CoachIntelSignals,
  /** Number of IE (insufficient evidence) dimensions from the fit scoring, used for confidence. */
  ieCount = 0,
): IntelligenceAdjustment {
  if (signals.count === 0) {
    return {
      scoreAdj: 0,
      appointabilityAdj: 0,
      summaryLabel: 'Limited intelligence on file',
      adjustmentReason: 'No intelligence entries recorded for this coach.',
      decisionConfidence: ieCount >= 2 ? 'Low' : 'Medium',
    }
  }

  const reliabilityMult =
    signals.profileReliability === 'High' ? 1.0
    : signals.profileReliability === 'Medium' ? 0.6
    : signals.profileReliability === 'Low' ? 0.3
    : 0

  // Raw adjustments before reliability gating
  const rawPos = signals.overallScore != null
    ? Math.max(0, Math.min(5, Math.round((signals.overallScore - 50) / 10)))
    : 0
  const rawNeg = signals.riskIndex != null
    ? -Math.min(8, Math.round(signals.riskIndex / 12.5))
    : 0
  let rawNet = Math.max(-10, Math.min(10, rawPos + rawNeg))

  // Volatility: conflicting strong signals reduce the magnitude
  if (signals.volatile) rawNet = Math.round(rawNet * 0.7)

  const scoreAdj = Math.round(rawNet * reliabilityMult)

  // Appointability is risk-focused (sensitive data + high risk index hit harder)
  const rawApptNeg = signals.riskIndex != null
    ? -Math.min(10, Math.round(signals.riskIndex / 10))
    : 0
  const sensitiveHit = signals.hasSensitive ? -3 : 0
  const appointabilityAdj = Math.max(-10, Math.round((rawApptNeg + sensitiveHit) * reliabilityMult))

  // Summary label
  let summaryLabel: string
  if (signals.volatile) {
    summaryLabel = 'Mixed intelligence profile'
  } else if (scoreAdj >= 4) {
    summaryLabel = 'Strong backing from trusted sources'
  } else if (scoreAdj >= 2) {
    summaryLabel = 'Positive intelligence profile'
  } else if (scoreAdj <= -5) {
    summaryLabel = 'Repeated risk signals from direct sources'
  } else if (scoreAdj <= -2) {
    summaryLabel = 'Negative intelligence pattern'
  } else if (signals.profileReliability === 'Low') {
    summaryLabel = 'Thin intelligence coverage'
  } else {
    summaryLabel = 'Neutral intelligence profile'
  }

  // Adjustment reason (one-liner for the ranking panel)
  let adjustmentReason: string
  if (signals.volatile) {
    adjustmentReason = `${signals.count} entries present — conflicting strong signals from multiple sources.`
  } else if (scoreAdj >= 4) {
    const tier12Count = signals.topPositive.filter(i => {
      const t = i.source_tier ? parseInt(i.source_tier, 10) : 5
      return t <= 2
    }).length
    adjustmentReason = tier12Count > 0
      ? `Positive signals backed by ${tier12Count} first-hand or trusted source${tier12Count > 1 ? 's' : ''}.`
      : `Multiple positive intelligence entries supporting this candidate.`
  } else if (scoreAdj <= -4) {
    adjustmentReason = `Risk signals from ${signals.topNegative.length > 0 ? 'high-weight' : 'multiple'} sources pulling score down.`
  } else if (scoreAdj === 0 && signals.count > 0) {
    adjustmentReason = `${signals.count} entries on file; positive and negative signals roughly balanced.`
  } else if (scoreAdj > 0) {
    adjustmentReason = `Mild positive signal from ${signals.count} intelligence entr${signals.count === 1 ? 'y' : 'ies'}.`
  } else {
    adjustmentReason = `Some risk indicators present; limited high-tier sourcing.`
  }

  // Decision confidence
  const decisionConfidence = computeDecisionConfidence(signals, ieCount)

  return { scoreAdj, appointabilityAdj, summaryLabel, adjustmentReason, decisionConfidence }
}

/**
 * Compute overall decision confidence for a ranked candidate.
 * Not fake precision — just High / Medium / Low.
 *
 * High:   ≤1 IE dim AND intel count ≥3 AND High reliability AND not volatile
 * Low:    ≥2 IE dims AND intel count < 2, OR volatile with Low/None reliability
 * Medium: everything else
 */
export function computeDecisionConfidence(
  signals: CoachIntelSignals,
  ieCount = 0,
): 'High' | 'Medium' | 'Low' {
  const hasGoodIntel = signals.count >= 3 && signals.profileReliability !== 'None' && signals.profileReliability !== 'Low'
  const hasWeakIntel = signals.count < 2 || signals.profileReliability === 'None'

  if (ieCount >= 2 && hasWeakIntel) return 'Low'
  if (signals.volatile && signals.profileReliability === 'None') return 'Low'
  if (ieCount <= 1 && hasGoodIntel && !signals.volatile) return 'High'
  return 'Medium'
}

/**
 * Derive the primary decision tension for a candidate — the main trade-off a
 * decision-maker needs to understand.  Returns null when no meaningful tension
 * exists (consistently strong or consistently weak across dimensions).
 *
 * All inputs are from existing scoring results — no new data required.
 */
export function computeDecisionTension(opts: {
  tacticalScore: number | null
  levelScore: number | null
  leadershipScore: number | null
  budgetScore: number | null
  availabilityScore: number | null
  riskScore: number | null    // higher = more risk
  footballFit: number
  appointability: number
  intelAdj: IntelligenceAdjustment | null
  volatile: boolean
  hasSensitive: boolean
}): string | null {
  const {
    tacticalScore, levelScore, leadershipScore,
    budgetScore, availabilityScore, riskScore,
    footballFit, appointability,
    intelAdj, volatile, hasSensitive,
  } = opts

  const strong = (s: number | null) => s != null && s >= 75
  const weak   = (s: number | null) => s != null && s < 50
  const intelNeg = intelAdj && intelAdj.scoreAdj <= -4
  const intelPos = intelAdj && intelAdj.scoreAdj >= 4

  // Priority-ordered tension pairs
  if (strong(tacticalScore) && hasSensitive)
    return 'Strong tactical fit vs sensitive intelligence profile'
  if (strong(tacticalScore) && strong(riskScore))
    return 'Strong tactical fit vs behavioural risk signals'
  if (strong(levelScore) && weak(budgetScore))
    return 'Elite level experience vs budget complexity'
  if (strong(leadershipScore) && weak(levelScore))
    return 'Leadership profile fit vs limited experience at this level'
  if (appointability >= 70 && weak(leadershipScore))
    return 'Highly appointable vs partial leadership alignment'
  if (footballFit >= 70 && weak(availabilityScore))
    return 'Strong overall fit vs availability uncertainty'
  if (intelPos && strong(riskScore))
    return 'Strong trusted backing vs risk profile flags'
  if (intelNeg && strong(tacticalScore))
    return 'Tactical alignment vs negative intelligence signals'
  if (volatile)
    return 'Conflicting intelligence from multiple trusted sources'
  if (footballFit >= 70 && appointability < 45)
    return 'Strong football fit vs appointability barriers'
  if (appointability >= 70 && footballFit < 50)
    return 'Highly appointable but limited football fit data'

  return null
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect near-duplicate entries: same coach, same category, title overlap, within 30 days.
 * Returns the matching entry if one is found, else null.
 */
export function findPotentialDuplicate(
  items: IntelItem[],
  newTitle: string,
  newCategory: string | null,
  newDate: string | null
): IntelItem | null {
  if (!newTitle.trim()) return null
  const words = newTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 4)
  if (words.length === 0) return null

  const cutoff = new Date(newDate ?? Date.now())
  cutoff.setDate(cutoff.getDate() - 30)

  for (const item of items) {
    // Category must match if both set
    if (newCategory && item.category && item.category !== newCategory) continue
    // Must be within 30 days
    const d = new Date(item.occurred_at ?? item.created_at)
    if (d < cutoff) continue
    // Title overlap: 2+ matching long words
    const existWords = item.title.toLowerCase().split(/\s+/).filter((w) => w.length > 4)
    const overlap = words.filter((w) => existWords.includes(w))
    if (overlap.length >= 2) return item
  }
  return null
}
