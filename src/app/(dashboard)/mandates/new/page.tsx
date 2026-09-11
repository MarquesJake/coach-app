import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { buildClubOptions } from '@/lib/clubs/options'
import { MandateBuilderForm } from '../_components/mandate-builder-form'
import { sourceDecisionBrief } from '@/lib/mandates/source-brief'
import { BRIEF_FIELD_LABELS, briefSnapshot } from '@/lib/clubs/brief-amendments'
import { getInternalOrganizationId } from '@/lib/organizations/context'

export const metadata = { title: 'New · Mandates' }


export default async function NewMandatePage(
  props: {
    searchParams: Promise<{ club_id?: string; club_name?: string; brief_id?: string }>
  }
) {
  const searchParams = await props.searchParams;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const organizationId = await getInternalOrganizationId(user.id)
  if (!organizationId) redirect('/no-access')
  const sourceResult = searchParams.brief_id ? await supabase.from('club_briefs').select('*').eq('id', searchParams.brief_id).eq('service_organization_id', organizationId).in('status', ['submitted', 'in_review']).is('linked_mandate_id', null).maybeSingle() : { data: null, error: null }
  if (sourceResult.error) throw new Error('The submitted club brief could not be loaded. Please retry.')
  if (searchParams.brief_id && !sourceResult.data) notFound()
  const source = sourceResult.data

  const { data: clubsData, error: clubsError } = await supabase
    .from('clubs')
    .select('id, name, league, updated_at')
    .order('name', { ascending: true })
    .order('updated_at', { ascending: false })

  if (clubsError) throw new Error('Clubs could not be loaded. Please retry.')
  const clubOptions = buildClubOptions(clubsData ?? [], source?.club_id ?? searchParams.club_id)

  const prefilledClubId = source?.club_id ?? searchParams.club_id
  const prefilledClubName = searchParams.club_name

  const prefilledOption = prefilledClubId
    ? clubOptions.find((c) => c.id === prefilledClubId)
    : undefined

  return (
    <div className="px-4 py-6">
      {source && <details open className="mx-auto mb-5 max-w-[900px] rounded-lg border border-primary/30 bg-card p-5"><summary className="cursor-pointer font-semibold">Review submitted source: {source.title}</summary><p className="mt-2 text-sm text-muted-foreground">Original club wording is preserved below. Prefilled requirements are proposals with default Preferred priority: review them before saving. Saving creates an internal appointment, not an agreed brief or permission to approach a coach. You will return to intake to explicitly accept the link.</p><dl className="mt-4 grid gap-4 sm:grid-cols-2">{Object.entries(briefSnapshot(source)).filter(([, value]) => value).map(([key, value]) => <div key={key}><dt className="text-xs font-semibold text-muted-foreground">{BRIEF_FIELD_LABELS[key as keyof typeof BRIEF_FIELD_LABELS]}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{value}</dd></div>)}</dl></details>}
      <MandateBuilderForm
        mode="create"
        clubOptions={clubOptions}
        backHref={source ? `/club-briefs#brief-${source.id}` : '/mandates'}
        sourceBriefId={source?.id}
        initialValues={source ? { decision_brief: sourceDecisionBrief(source) } : undefined}
        prefilledClubId={prefilledOption?.id}
        prefilledClubDisplay={prefilledOption?.label ?? prefilledClubName}
      />
    </div>
  )
}
