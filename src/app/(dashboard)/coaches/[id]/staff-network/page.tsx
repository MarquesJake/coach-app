import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { assertRouteQueries } from '@/lib/coaches/route-audit'
import { StaffNetworkSection } from './_components/staff-network-section'

export const metadata = { title: 'Staff network' }


export default async function CoachStaffNetworkPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(params.id)
  if (error) throw new Error('Coach profile could not be loaded. Reload before making changes.')
  if (!coach) notFound()

  const { data: history, error: historyError } = await supabase
    .from('coach_staff_history')
    .select('id, staff_id, club_name, role_title, started_on, ended_on, times_worked_together, followed_from_previous, relationship_strength, impact_summary, source_type, source_name, confidence, verified')
    .eq('coach_id', params.id)
    .order('ended_on', { ascending: false, nullsFirst: true })
    .order('started_on', { ascending: false })

  assertRouteQueries('Staff history', { error: historyError })
  const staffIds = Array.from(new Set((history ?? []).map((h) => h.staff_id)))
  const { data: staffRows, error: staffError } = staffIds.length
    ? await supabase.from('staff').select('id, full_name').in('id', staffIds)
    : { data: [], error: null }
  const staffMap = new Map((staffRows ?? []).map((s) => [s.id, s.full_name]))

  const { data: allStaff, error: allStaffError } = await supabase.from('staff').select('id, full_name').order('full_name')

  assertRouteQueries('Staff identities', { error: staffError }, { error: allStaffError })

  return (
    <StaffNetworkSection
      coachId={params.id}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      history={(history ?? []) as any}
      staffMap={staffMap}
      allStaff={allStaff ?? []}
    />
  )
}
