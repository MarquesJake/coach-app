import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { CoachDataTab } from './_components/coach-data-tab'

export default async function CoachDataPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(user.id, params.id)
  if (error || !coach) notFound()

  const { data: profile } = await supabase
    .from('coach_data_profiles')
    .select('*')
    .eq('coach_id', params.id)
    .maybeSingle()

  const { data: recruitment } = await supabase
    .from('coach_recruitment_history')
    .select('*')
    .eq('coach_id', params.id)
    .order('created_at', { ascending: false })

  const { data: mediaEvents } = await supabase
    .from('coach_media_events')
    .select('*')
    .eq('coach_id', params.id)
    .order('severity_score', { ascending: false, nullsFirst: false })
    .order('occurred_at', { ascending: false, nullsFirst: true })

  return (
    <CoachDataTab
      coachId={params.id}
      profile={profile ?? null}
      recruitment={recruitment ?? []}
      mediaEvents={mediaEvents ?? []}
    />
  )
}
