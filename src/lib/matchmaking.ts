import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/db'
import { computeMatchScores } from '@/lib/scoring/engine'

type Vacancy = Database['public']['Tables']['vacancies']['Row']
type Coach = Database['public']['Tables']['coaches']['Row']
type MatchRow = Database['public']['Tables']['matches']['Row']

/** Shape used when inserting/upserting matches (no risk_level/confidence_level; those are derived in UI). */
export interface MatchScores {
  tactical_fit_score: number
  cultural_fit_score: number
  availability_score: number
  board_compatibility_score: number
  risk_score: number
  overall_score: number
  confidence_score: number
  financial_fit_score: number
}

/**
 * Calculate match scores for one vacancy–coach pair (e.g. on vacancy creation).
 * Uses updateCount: 0 when no intelligence update count is available.
 */
export function calculateMatchScores(vacancy: Vacancy, coach: Coach): MatchScores {
  const result = computeMatchScores(vacancy, coach, { updateCount: 0 })
  return {
    tactical_fit_score: result.tactical_fit_score,
    cultural_fit_score: result.cultural_fit_score,
    availability_score: result.availability_score,
    board_compatibility_score: result.board_compatibility_score,
    risk_score: result.risk_score,
    overall_score: result.overall_score,
    confidence_score: result.confidence_score,
    financial_fit_score: result.financial_fit_score,
  }
}

/** @deprecated Use getScoreColorClass from @/lib/scoring/engine */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-400/10 border-emerald-400/30'
  if (score >= 60) return 'bg-yellow-400/10 border-yellow-400/30'
  if (score >= 40) return 'bg-orange-400/10 border-orange-400/30'
  return 'bg-red-400/10 border-red-400/30'
}

/**
 * Run matching for a vacancy: score all user's coaches and upsert into matches.
 * Uses the modular scoring engine (tactical, cultural, availability, board compatibility, risk, confidence).
 */
export async function runMatchingForVacancy(
  supabase: SupabaseClient<Database>,
  vacancyId: string,
  userId: string
): Promise<MatchRow[]> {
  const { data: clubs } = await supabase.from('clubs').select('id').eq('user_id', userId)
  const clubIds = (clubs ?? []).map((c) => c.id)
  if (clubIds.length === 0) throw new Error('No clubs found for user')

  const { data: vacancy, error: vacError } = await supabase
    .from('vacancies')
    .select('*')
    .eq('id', vacancyId)
    .single()

  if (vacError || !vacancy) throw new Error('Vacancy not found')
  if (!clubIds.includes(vacancy.club_id)) throw new Error('Vacancy not found')

  const { data: coaches, error: coachesError } = await supabase
    .from('coaches')
    .select('*')
    .eq('user_id', userId)

  if (coachesError) throw new Error(coachesError.message)
  const coachList = coaches ?? []
  if (coachList.length === 0) throw new Error('No coaches found')

  const coachIds = coachList.map((c) => c.id)
  const { data: updateCounts } = await supabase
    .from('coach_updates')
    .select('coach_id')
    .in('coach_id', coachIds)

  const countByCoachId: Record<string, number> = {}
  for (const id of coachIds) countByCoachId[id] = 0
  for (const row of updateCounts ?? []) {
    const id = (row as { coach_id: string }).coach_id
    countByCoachId[id] = (countByCoachId[id] ?? 0) + 1
  }

  const rows = coachList.map((coach) => {
    const result = computeMatchScores(vacancy as Vacancy, coach as Coach, {
      updateCount: countByCoachId[coach.id] ?? 0,
    })
    return {
      vacancy_id: vacancyId,
      coach_id: coach.id,
      tactical_fit_score: result.tactical_fit_score,
      cultural_fit_score: result.cultural_fit_score,
      availability_score: result.availability_score,
      board_compatibility_score: result.board_compatibility_score,
      risk_score: result.risk_score,
      overall_score: result.overall_score,
      confidence_score: result.confidence_score,
      financial_fit_score: result.financial_fit_score,
    }
  })

  const { data: inserted, error: upsertError } = await supabase
    .from('matches')
    .upsert(rows, { onConflict: 'vacancy_id,coach_id' })
    .select()

  if (upsertError) throw new Error(upsertError.message)
  return (inserted ?? []) as MatchRow[]
}
