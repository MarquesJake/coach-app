'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/db/activity'
import {
  buildSuccessionRadar,
  type SuccessionClub,
  type SuccessionCoach,
  type SuccessionInboxSignal,
  type SuccessionIntelSignal,
  type SuccessionMandateSignal,
} from '@/lib/succession/radar'

function toText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
}

export async function convertSuccessionPlanToMandateAction(formData: FormData) {
  const clubId = toText(formData.get('club_id'))
  if (!clubId) redirect('/succession?error=Missing+club')

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: existingMandate } = await supabase
    .from('mandates')
    .select('id')
    .eq('user_id', user.id)
    .eq('club_id', clubId)
    .neq('pipeline_stage', 'closed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingMandate?.id) {
    redirect(`/mandates/${existingMandate.id}/workspace?success=Succession+plan+already+has+an+active+mandate`)
  }

  const [clubRes, mandatesRes, intelRes, inboxRes, coachesRes] = await Promise.all([
    supabase
      .from('clubs')
      .select('id, name, league, country, tier, current_manager, board_risk_tolerance, strategic_priority, media_pressure, development_vs_win_now, environment_assessment, instability_risk, tactical_model, pressing_model, build_model, market_reputation')
      .eq('user_id', user.id)
      .eq('id', clubId)
      .single(),
    supabase
      .from('mandates')
      .select('id, club_id, pipeline_stage, status, strategic_objective, succession_timeline, created_at')
      .eq('user_id', user.id)
      .eq('club_id', clubId)
      .limit(20),
    supabase
      .from('intelligence_items')
      .select('id, entity_id, title, category, direction, confidence, occurred_at, verified')
      .eq('user_id', user.id)
      .eq('entity_type', 'club')
      .eq('entity_id', clubId)
      .eq('is_deleted', false)
      .limit(100),
    supabase
      .from('intelligence_inbox_items')
      .select('id, club_id, review_status, verification_status, direction, source_recorded_at, created_at')
      .eq('user_id', user.id)
      .eq('club_id', clubId)
      .limit(100),
    supabase
      .from('coaches')
      .select('id, name, club_current, nationality, available_status, availability_status, market_status, tactical_identity, preferred_style, pressing_intensity, build_preference, player_development_model, academy_integration, leadership_style, overall_manual_score, intelligence_confidence')
      .eq('user_id', user.id)
      .limit(500),
  ])

  if (clubRes.error || !clubRes.data) redirect('/succession?error=Club+not+found')

  const [plan] = buildSuccessionRadar({
    clubs: [clubRes.data as SuccessionClub],
    mandates: (mandatesRes.data ?? []) as SuccessionMandateSignal[],
    intelligence: (intelRes.data ?? []) as SuccessionIntelSignal[],
    inbox: (inboxRes.data ?? []) as SuccessionInboxSignal[],
    coaches: (coachesRes.data ?? []) as SuccessionCoach[],
  })

  const defaults = plan.mandateDefaults
  const today = new Date().toISOString().slice(0, 10)
  const targetDays = defaults.succession_timeline === 'Immediate / within 30 days' ? 30 : 120

  const { data: mandate, error } = await supabase
    .from('mandates')
    .insert({
      user_id: user.id,
      club_id: clubId,
      pipeline_stage: 'identified',
      status: 'Active',
      priority: defaults.priority,
      engagement_date: today,
      target_completion_date: daysFromNow(targetDays),
      ownership_structure: 'Succession planning - ownership and decision group to verify',
      key_stakeholders: [],
      confidentiality_level: defaults.confidentiality_level,
      strategic_objective: defaults.strategic_objective,
      tactical_model_required: defaults.tactical_model_required,
      pressing_intensity_required: defaults.pressing_intensity_required,
      build_preference_required: defaults.build_preference_required,
      leadership_profile_required: defaults.leadership_profile_required,
      budget_band: defaults.budget_band,
      succession_timeline: defaults.succession_timeline,
      board_risk_appetite: defaults.board_risk_appetite,
      risk_tolerance: plan.archetype,
      language_requirements: clubRes.data.country === 'England' ? ['English'] : [],
      relocation_required: true,
    })
    .select('id')
    .single()

  if (error || !mandate) {
    redirect(`/succession/${clubId}?error=${encodeURIComponent(error?.message ?? 'Could not convert plan')}`)
  }

  const longlistRows = plan.suggestedCoaches.slice(0, 5).map((coach) => ({
    mandate_id: mandate.id,
    coach_id: coach.id,
    ranking_score: coach.fitScore,
    fit_explanation: JSON.stringify({
      source: 'succession_radar',
      summary: `${coach.name} matches the ${plan.archetype} profile for this club.`,
      strengths: coach.fitReasons,
      concerns: plan.openInboxCount > 0 ? ['Open club intelligence still needs triage before recommendation.'] : [],
      dims: coach.fitBreakdown,
      combined: coach.fitScore,
      fitLabel: coach.fitScore >= 75 ? 'Strong succession fit' : coach.fitScore >= 60 ? 'Viable succession fit' : 'Monitor',
    }),
  }))

  if (longlistRows.length > 0) {
    await supabase
      .from('mandate_longlist')
      .upsert(longlistRows, { onConflict: 'mandate_id,coach_id', ignoreDuplicates: false })
  }

  await supabase.from('mandate_deliverables').insert([
    {
      mandate_id: mandate.id,
      item: 'Verify board mood, current manager security and decision timeline',
      due_date: daysFromNow(7),
      status: 'Not Started',
    },
    {
      mandate_id: mandate.id,
      item: 'Reference the top three shadow shortlist candidates through football network',
      due_date: daysFromNow(14),
      status: 'Not Started',
    },
    {
      mandate_id: mandate.id,
      item: 'Prepare first Head Coach Assessment Pack recommendation structure',
      due_date: daysFromNow(21),
      status: 'Not Started',
    },
  ])

  await logActivity({
    entityType: 'mandate',
    entityId: mandate.id,
    actionType: 'created',
    description: 'Mandate created from succession plan',
    metadata: { club_id: clubId, succession_score: plan.score, archetype: plan.archetype },
  })

  revalidatePath('/succession')
  revalidatePath(`/succession/${clubId}`)
  revalidatePath('/mandates')
  revalidatePath(`/mandates/${mandate.id}`)
  revalidatePath(`/mandates/${mandate.id}/workspace`)
  revalidatePath(`/mandates/${mandate.id}/longlist`)
  redirect(`/mandates/${mandate.id}/workspace?success=Succession+plan+converted+to+mandate`)
}
