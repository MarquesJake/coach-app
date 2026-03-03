import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { StaffNetworkSection } from './_components/staff-network-section'

export default async function CoachStaffNetworkPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(user.id, params.id)
  if (error || !coach) notFound()

  const { data: history } = await supabase
    .from('coach_staff_history')
    .select('id, staff_id, club_name, role_title, started_on, ended_on, times_worked_together, followed_from_previous, relationship_strength, impact_summary, source_type, source_name, confidence, verified')
    .eq('coach_id', params.id)
    .order('ended_on', { ascending: false, nullsFirst: true })

  const staffIds = Array.from(new Set((history ?? []).map((h) => h.staff_id)))
  const { data: staffRows } = staffIds.length
    ? await supabase.from('staff').select('id, full_name').in('id', staffIds)
    : { data: [] }
  const staffMap = new Map((staffRows ?? []).map((s) => [s.id, s.full_name]))

  const { data: allStaff } = await supabase.from('staff').select('id, full_name').eq('user_id', user.id).order('full_name')

  return (
    <StaffNetworkSection
      coachId={params.id}
      history={history ?? []}
      staffMap={staffMap}
      allStaff={allStaff ?? []}
    />
  )
}
