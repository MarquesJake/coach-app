import { CoachResearchContext } from '@/components/assessment/coach-research-context'
import { savedProfileLabel } from '@/lib/coaches/saved-profile-label'
import { legacyCoachSeedIndex } from '@/lib/coaches/legacy-seed-provenance'
import { CoachDeepDivePanel } from '@/components/assessment/coach-deep-dive-panel'
import { CoachAssessment } from '../_components/coach-assessment'
import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { LeadershipSection } from '../_components/leadership-section'
import { CoachReferences } from '../_components/coach-references'

export const metadata = { title: 'Leadership' }


export default async function CoachLeadershipPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(params.id)
  if (error) throw new Error('Coach profile could not be loaded. Reload before making changes.')
  if (!coach) notFound()

  return <div className="space-y-5"><CoachResearchContext coachId={params.id} coachName={coach.name} sections={['management']} /><CoachReferences coachId={params.id} /><CoachAssessment coachId={params.id} areas={['personality_profile', 'media_comms', 'cultural_org_fit']}/><CoachDeepDivePanel coachId={params.id} areas={['personality_profile', 'media_comms', 'cultural_org_fit']} /><LeadershipSection provenanceLabel={savedProfileLabel(coach, legacyCoachSeedIndex(coach.user_id, params.id) >= 0)} coachId={params.id} coach={coach as Record<string, unknown>} /></div>
}
