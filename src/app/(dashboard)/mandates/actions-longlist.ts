'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'

async function requireUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function generateLonglistAction(mandateId: string) {
  const { supabase, user } = await requireUser()
  const { data: mandate } = await supabase.from('mandates').select('id, tactical_model_required, pressing_intensity_required, build_preference_required, leadership_profile_required').eq('id', mandateId).eq('user_id', user.id).single()
  if (!mandate) return { data: null, error: 'Mandate not found' }

  const { data: coaches } = await supabase.from('coaches').select('id, overall_manual_score, tactical_fit_score, leadership_score, pressing_intensity, build_preference, leadership_style, media_risk_score').eq('user_id', user.id)
  if (!coaches?.length) return { data: [], error: null }

  const rows: { coach_id: string; ranking_score: number; fit_explanation: string }[] = []
  for (const c of coaches) {
    const base = c.overall_manual_score ?? (c.tactical_fit_score != null && c.leadership_score != null ? (c.tactical_fit_score + c.leadership_score) / 2 : 50)
    let score = base
    const reasons: string[] = []
    if (c.pressing_intensity && (mandate as { pressing_intensity_required?: string }).pressing_intensity_required && c.pressing_intensity === (mandate as { pressing_intensity_required?: string }).pressing_intensity_required) {
      score += 5
      reasons.push('Pressing match')
    }
    if (c.build_preference && (mandate as { build_preference_required?: string }).build_preference_required && c.build_preference === (mandate as { build_preference_required?: string }).build_preference_required) {
      score += 5
      reasons.push('Build preference match')
    }
    if (c.leadership_style && (mandate as { leadership_profile_required?: string }).leadership_profile_required) reasons.push('Leadership profile')
    if (c.media_risk_score != null && c.media_risk_score > 70) score -= 10
    score = Math.max(0, Math.min(100, Math.round(score)))
    rows.push({
      coach_id: c.id,
      ranking_score: score,
      fit_explanation: reasons.slice(0, 3).join('; ') || 'Base score',
    })
  }
  rows.sort((a, b) => b.ranking_score - a.ranking_score)

  const toUpsert = rows.map((r) => ({ mandate_id: mandateId, coach_id: r.coach_id, ranking_score: r.ranking_score, fit_explanation: r.fit_explanation }))
  await supabase.from('mandate_longlist').upsert(toUpsert, { onConflict: 'mandate_id,coach_id', ignoreDuplicates: false })
  revalidatePath(`/mandates/${mandateId}`)
  revalidatePath(`/mandates/${mandateId}/longlist`)
  const { data: updated } = await supabase.from('mandate_longlist').select('id, coach_id, ranking_score, fit_explanation').eq('mandate_id', mandateId).order('ranking_score', { ascending: false })
  return { data: updated ?? [], error: null }
}

export async function saveLonglistAction(mandateId: string, payload: { coach_id: string; ranking_score: number | null; fit_explanation: string | null }[]) {
  const { supabase, user } = await requireUser()
  const { data: mandate } = await supabase.from('mandates').select('id').eq('id', mandateId).eq('user_id', user.id).single()
  if (!mandate) return { error: 'Mandate not found' }
  for (const row of payload) {
    await supabase.from('mandate_longlist').upsert(
      { mandate_id: mandateId, coach_id: row.coach_id, ranking_score: row.ranking_score, fit_explanation: row.fit_explanation },
      { onConflict: 'mandate_id,coach_id' }
    )
  }
  revalidatePath(`/mandates/${mandateId}`)
  revalidatePath(`/mandates/${mandateId}/longlist`)
  return { error: null }
}
