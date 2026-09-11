import { CoachAssessment } from '../_components/coach-assessment'
import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { TacticalSection } from '../_components/tactical-section'

export const metadata = { title: 'Tactical' }


export default async function CoachTacticalPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(params.id)
  if (error) throw new Error('Coach profile could not be loaded. Reload before making changes.')
  if (!coach) notFound()

  return <div className="space-y-5"><CoachAssessment coachId={params.id} areas={['tactical_proposal', 'match_management']}/><TacticalSection coachId={params.id} coach={coach as Record<string, unknown>} /></div>
}
