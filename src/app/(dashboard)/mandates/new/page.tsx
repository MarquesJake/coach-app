import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MandateBuilderForm } from '../_components/mandate-builder-form'

export default async function NewMandatePage({
  searchParams,
}: {
  searchParams: { club_id?: string; club_name?: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clubsData } = await supabase
    .from('clubs')
    .select('id, name, league')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  const clubOptions = (clubsData ?? []).map((c) => ({
    id: c.id,
    label: `${c.name} (${c.league})`,
  }))

  const prefilledClubId = searchParams.club_id
  const prefilledClubName = searchParams.club_name
    ? decodeURIComponent(searchParams.club_name)
    : undefined

  const prefilledOption = prefilledClubId
    ? clubOptions.find((c) => c.id === prefilledClubId)
    : undefined

  return (
    <div className="px-4 py-6">
      <MandateBuilderForm
        mode="create"
        clubOptions={clubOptions}
        backHref="/mandates"
        prefilledClubId={prefilledClubId}
        prefilledClubDisplay={prefilledOption?.label ?? prefilledClubName}
      />
    </div>
  )
}
