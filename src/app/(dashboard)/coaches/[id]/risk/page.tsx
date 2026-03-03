import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { RiskSection } from '../_components/risk-section'

export default async function CoachRiskPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(user.id, params.id)
  if (error || !coach) notFound()

  const { data: evidence } = await supabase
    .from('intelligence_items')
    .select('id, title, detail, category, confidence, occurred_at, source_name, source_type, verified')
    .eq('entity_type', 'coach')
    .eq('entity_id', params.id)
    .order('occurred_at', { ascending: false, nullsFirst: true })
    .limit(50)

  const { data: dueDiligenceItems } = await supabase
    .from('coach_due_diligence_items')
    .select('*')
    .eq('coach_id', params.id)
    .order('created_at', { ascending: false })

  const categories = ['Tactical', 'Leadership', 'Recruitment', 'Media', 'Legal', 'Integrity', 'Staff', 'Performance', 'Market'] as const
  const evidenceList = (evidence ?? []) as { category: string | null; confidence: number | null }[]
  const coverageByCategory = categories.map((cat) => {
    const items = evidenceList.filter((e) => (e.category ?? '').toLowerCase() === cat.toLowerCase())
    const count = items.length
    const withConf = items.filter((e) => e.confidence != null)
    const avgConf = withConf.length ? Math.round(withConf.reduce((s, e) => s + (e.confidence ?? 0), 0) / withConf.length) : 0
    return { category: cat, itemCount: count, averageConfidence: avgConf }
  })

  return (
    <RiskSection
      coachId={params.id}
      coach={coach as Record<string, unknown>}
      evidence={evidence ?? []}
      dueDiligenceItems={dueDiligenceItems ?? []}
      coverageByCategory={coverageByCategory}
    />
  )
}
