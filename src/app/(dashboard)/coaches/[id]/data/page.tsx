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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const { data: profile } = await sb.from('coach_data_profiles').select('*').eq('coach_id', params.id).maybeSingle()
  const { data: recruitment } = await sb.from('coach_recruitment_history').select('*').eq('coach_id', params.id).order('created_at', { ascending: false })
  const { data: mediaEvents } = await sb.from('coach_media_events').select('*').eq('coach_id', params.id).order('severity_score', { ascending: false, nullsFirst: false }).order('occurred_at', { ascending: false, nullsFirst: true })

  return (
    <CoachDataTab
      coachId={params.id}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile={(profile ?? null) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recruitment={(recruitment ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mediaEvents={(mediaEvents ?? []) as any}
    />
  )
}
