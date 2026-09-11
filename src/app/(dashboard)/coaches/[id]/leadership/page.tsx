import { CoachAssessment } from '../_components/coach-assessment'
import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { LeadershipSection } from '../_components/leadership-section'

export const metadata = { title: 'Leadership' }


export default async function CoachLeadershipPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(params.id)
  if (error) throw new Error('Coach profile could not be loaded. Reload before making changes.')
  if (!coach) notFound()

  return <div className="space-y-5"><CoachAssessment coachId={params.id} areas={['personality_profile', 'media_comms', 'cultural_org_fit']}/><LeadershipSection coachId={params.id} coach={coach as Record<string, unknown>} /></div>
}
