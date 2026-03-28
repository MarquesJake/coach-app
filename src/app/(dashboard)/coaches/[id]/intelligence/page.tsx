import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { CoachIntelligenceClient } from './_components/coach-intelligence-client'

export default async function CoachIntelligencePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(user.id, params.id)
  if (error || !coach) notFound()

  const [intelligenceRes, mandatesRes] = await Promise.all([
    supabase
      .from('intelligence_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('entity_type', 'coach')
      .eq('entity_id', params.id)
      .order('occurred_at', { ascending: false, nullsFirst: false }),
    supabase
      .from('mandates')
      .select('id, custom_club_name, clubs(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const mandates = (mandatesRes.data ?? []).map((m) => {
    const clubName = (m.clubs as { name?: string } | null)?.name
    const label = m.custom_club_name || clubName || m.id
    return { id: m.id, label }
  })

  return (
    <CoachIntelligenceClient
      coachId={params.id}
      initialItems={intelligenceRes.data ?? []}
      mandates={mandates}
    />
  )
}
