import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { LeadershipSection } from '../_components/leadership-section'

export default async function CoachLeadershipPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(user.id, params.id)
  if (error || !coach) notFound()

  return <LeadershipSection coachId={params.id} coach={coach as Record<string, unknown>} />
}
