import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { CoachingModelSection } from './_components/coaching-model-section'

export default async function CoachCoachingModelPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(user.id, params.id)
  if (error || !coach) notFound()

  // @ts-ignore - coach_derived_metrics table not yet in DB schema
  const { data: derivedRow } = await (supabase as any).from('coach_derived_metrics').select('avg_squad_age, pct_minutes_u23, pct_minutes_30plus, rotation_index, avg_signing_age, repeat_signings_count, repeat_agents_count, loan_reliance_score, network_density_score').eq('coach_id', params.id).maybeSingle()

  return (
    <CoachingModelSection
      coachId={params.id}
      coach={coach as Record<string, unknown>}
      derivedMetrics={derivedRow as import('./_components/coaching-model-section').DerivedMetricsRow | null}
    />
  )
}
