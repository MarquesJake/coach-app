import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { CareerTab } from './_components/career-tab'

export default async function CoachCareerPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(user.id, params.id)
  if (error || !coach) notFound()

  const { data: stints } = await supabase
    .from('coach_stints')
    .select('id, club_name, role_title, started_on, ended_on, appointment_context, exit_context, points_per_game, win_rate, notable_outcomes, source_type, source_name, source_link, source_notes, confidence, verified, verified_at, verified_by')
    .eq('coach_id', params.id)
    .order('started_on', { ascending: false, nullsFirst: false })

  return <CareerTab coachId={params.id} stints={stints ?? []} />
}
