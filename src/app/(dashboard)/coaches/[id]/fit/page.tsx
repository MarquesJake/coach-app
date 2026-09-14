import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { getMandatesForTeam } from '@/lib/db/mandate'
import { FitClient } from './_components/fit-client'
import { displayClubName } from '@/lib/display-names'

export const metadata = { title: 'Fit' }


export default async function CoachFitPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error: coachError } = await getCoachById(params.id)
  if (coachError || !coach) notFound()

  const { data: mandatesList, error: mandatesError } = await getMandatesForTeam()
  if (mandatesError) throw new Error('Club briefs could not be loaded. Please retry.')
  const mandates = (mandatesList ?? []).map((m: { id: string; custom_club_name?: string | null; clubs?: { name?: string | null } | null }) => ({
    id: m.id,
    label: displayClubName(m.custom_club_name, (m.clubs as { name?: string } | null)?.name, 'Mandate'),
  }))

  return <FitClient coachId={params.id} mandates={mandates} />
}
