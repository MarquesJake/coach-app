import { db } from '@/lib/db/client'

const SOURCE_TIER_WEIGHT: Record<string, number> = {
  A: 1.5,
  B: 1.2,
  C: 1,
  D: 0.7,
}

const RECENCY_THRESHOLD_MONTHS = 18
const RECENCY_DECAY = 0.75

/** TODO: Future: replace simple decay with exponential time decay. */
function getTierWeight(tier: string | null): number {
  if (!tier) return 1
  return SOURCE_TIER_WEIGHT[tier.toUpperCase()] ?? 1
}

function getRecencyMultiplier(occurredAt: string | null): number {
  if (!occurredAt) return 1
  const date = new Date(occurredAt)
  if (Number.isNaN(date.getTime())) return 1
  const now = new Date()
  const months = (now.getTime() - date.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
  return months > RECENCY_THRESHOLD_MONTHS ? RECENCY_DECAY : 1
}

export type IntelligenceConfidenceResult = {
  weightedConfidence: number
  itemCount: number
}

/**
 * Compute intelligence confidence for a coach from intelligence_items.
 * Weights by source_tier (A=1.5, B=1.2, C=1, D=0.7) and applies recency decay (>18 months = 0.75).
 */
export async function computeIntelligenceConfidence(
  userId: string,
  coachId: string
): Promise<IntelligenceConfidenceResult> {
  const supabase = db()
  const { data: items } = await supabase
    .from('intelligence_items')
    .select('confidence, source_tier, occurred_at')
    .eq('user_id', userId)
    .eq('entity_type', 'coach')
    .eq('entity_id', coachId)

  const list = (items ?? []) as { confidence: number | null; source_tier: string | null; occurred_at: string | null }[]
  if (list.length === 0) return { weightedConfidence: 0, itemCount: 0 }

  let weightedSum = 0
  let weightSum = 0
  for (const item of list) {
    const conf = Math.max(0, Math.min(100, Number(item.confidence) || 0))
    const tierW = getTierWeight(item.source_tier)
    const recW = getRecencyMultiplier(item.occurred_at)
    const w = tierW * recW
    weightedSum += conf * w
    weightSum += w
  }
  const weightedConfidence = weightSum > 0 ? Math.round(Math.max(0, Math.min(100, weightedSum / weightSum))) : 0
  return { weightedConfidence, itemCount: list.length }
}
