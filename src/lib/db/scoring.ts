import { db } from './client'
import type { Database } from '@/lib/types/db'

type CoachScoreTableRow = Database['public']['Tables']['coach_scores']['Row']

export type CoachScoreRow = Pick<
  CoachScoreTableRow,
  | 'id'
  | 'coach_id'
  | 'scoring_model_id'
  | 'overall_score'
  | 'tactical_score'
  | 'leadership_score'
  | 'recruitment_score'
  | 'risk_score'
  | 'media_score'
  | 'confidence_score'
  | 'computed_at'
> & {
  scoring_model_name?: string
  scoring_model_version?: string
}

/**
 * Fetch the latest coach_scores row for a coach (by computed_at).
 * RLS: user must own the coach.
 */
export async function getLatestCoachScore(
  _userId: string,
  coachId: string
): Promise<{ data: CoachScoreRow | null; error: string | null }> {
  const supabase = db()
  const { data: scoreRow, error: scoreErr } = await supabase
    .from('coach_scores')
    .select('id, coach_id, scoring_model_id, overall_score, tactical_score, leadership_score, recruitment_score, risk_score, media_score, confidence_score, computed_at')
    .eq('coach_id', coachId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (scoreErr) return { data: null, error: scoreErr.message }
  if (!scoreRow) return { data: null, error: null }

  return {
    data: {
      ...scoreRow,
      scoring_model_name: undefined,
      scoring_model_version: undefined,
    },
    error: null,
  }
}
