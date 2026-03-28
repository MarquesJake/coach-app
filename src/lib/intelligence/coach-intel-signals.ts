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

  const cutoff = new Date()
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
