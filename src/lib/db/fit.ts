import { db } from './client'

/** Fetch coach row with scoring and fit-relevant fields for mandate fit. */
export async function getCoachForFit(userId: string, coachId: string) {
  const supabase = db()
  const { data, error } = await supabase
    .from('coaches')
    .select(
      'id, name, preferred_name, availability_status, market_status, base_location, languages, relocation_flexibility, tactical_identity, pressing_intensity, build_preference, leadership_style, tactical_fit_score, leadership_score, recruitment_fit_score, media_risk_score, overall_manual_score, intelligence_confidence, legal_risk_flag, integrity_risk_flag, safeguarding_risk_flag, due_diligence_summary'
    )
    .eq('id', coachId)
    .eq('user_id', userId)
    .single()
  return { data, error }
}

/** Evidence (intelligence) count for a coach. */
export async function getEvidenceCountForCoach(userId: string, coachId: string): Promise<number> {
  const supabase = db()
  const { count, error } = await supabase
    .from('intelligence_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('entity_type', 'coach')
    .eq('entity_id', coachId)
  if (error) return 0
  return count ?? 0
}

/** Upsert one longlist entry. Returns error message or null. */
export async function upsertLonglistEntry(
  userId: string,
  mandateId: string,
  coachId: string,
  rankingScore: number | null,
  fitExplanation: string | null
): Promise<string | null> {
  const supabase = db()
  const { data: mandate } = await supabase
    .from('mandates')
    .select('id')
    .eq('id', mandateId)
    .eq('user_id', userId)
    .single()
  if (!mandate) return 'Mandate not found'

  const { error } = await supabase.from('mandate_longlist').upsert(
    {
      mandate_id: mandateId,
      coach_id: coachId,
      ranking_score: rankingScore,
      fit_explanation: fitExplanation,
    },
    { onConflict: 'mandate_id,coach_id' }
  )
  return error?.message ?? null
}

/** Insert shortlist entry. Returns error message or null. Duplicate = "Already on shortlist". */
export async function insertShortlistEntry(
  userId: string,
  mandateId: string,
  coachId: string,
  notes: string | null,
  status: string = 'Under Review'
): Promise<string | null> {
  const supabase = db()
  const { data: mandate } = await supabase
    .from('mandates')
    .select('id')
    .eq('id', mandateId)
    .eq('user_id', userId)
    .single()
  if (!mandate) return 'Mandate not found'

  const { error } = await supabase.from('mandate_shortlist').insert({
    mandate_id: mandateId,
    coach_id: coachId,
    placement_probability: 50,
    risk_rating: 'Medium',
    status,
    notes,
  })
  if (error) {
    if (error.code === '23505') return 'Coach is already on this shortlist'
    return error.message
  }
  return null
}
