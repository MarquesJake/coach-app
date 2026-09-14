import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { CoachDataTab } from './_components/coach-data-tab'
import { DeepCoachResearch } from '@/components/assessment/deep-coach-research'
import { findDeepResearchProfile } from '@/lib/coaches/deep-research-profiles'
import { researchProfileForName } from '@/lib/scoring/research/catalogue'
import { resolveDeepCoachIdentity, resolveDeepProviderHistory } from '@/lib/coaches/deep-provider-history'
import { ProviderCareerEvidence } from '@/components/assessment/provider-career-evidence'
import { SourcedCoachResearch } from '@/components/assessment/sourced-coach-research'
import { VerifiedMatchEvidence, matchSnapshotForApiIds } from '@/components/assessment/verified-match-evidence'

export const metadata = { title: 'Data' }


export default async function CoachDataPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(params.id)
  if (error) throw new Error('Coach profile could not be loaded. Reload before making changes.')
  if (!coach) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const [
    { data: profile, error: profileError },
    { data: externalProfile, error: externalError },
    { data: recruitment, error: recruitmentError },
    { data: mediaEvents, error: mediaError },
  ] = await Promise.all([
    sb.from('coach_data_profiles').select('*').eq('coach_id', params.id).maybeSingle(),
    sb.from('coach_external_profiles').select('*').eq('coach_id', params.id).maybeSingle(),
    sb.from('coach_recruitment_history').select('*').eq('coach_id', params.id).order('created_at', { ascending: false }),
    sb.from('coach_media_events').select('*').eq('coach_id', params.id).order('severity_score', { ascending: false, nullsFirst: false }).order('occurred_at', { ascending: false, nullsFirst: true }),
  ])

  if (profileError || externalError || recruitmentError || mediaError) throw new Error('Coach data could not be loaded. Reload before editing.')
  const identity = resolveDeepCoachIdentity(params.id)
  const reviewedFallback = identity ? undefined : researchProfileForName(coach.name)
  const apiIds = identity?.apiIds ?? (reviewedFallback ? [reviewedFallback.apiId] : [])
  const deepProfile = apiIds.map(apiId => findDeepResearchProfile(apiId)).find(Boolean)
  const history = resolveDeepProviderHistory(params.id)
  const providers = history?.providers.filter(provider => provider.career.length > 0) ?? []
  const hasMatchEvidence = Boolean(matchSnapshotForApiIds(apiIds))
  return (
    <>
    <VerifiedMatchEvidence coachName={coach.name} apiIds={apiIds} hideMissing={providers.length > 0} />
    {deepProfile ? <DeepCoachResearch profile={deepProfile} coachId={params.id} /> : providers.length === 0 && reviewedFallback ? <div className="my-6"><SourcedCoachResearch name={reviewedFallback.name} coachId={params.id} /></div> : null}
    {providers.map((provider, index) => <ProviderCareerEvidence key={provider.apiId} coachName={coach.name} apiId={provider.apiId} coachId={params.id} record={{ retrievedAt: provider.source.retrievedAt, career: provider.career }} sourceUrl={provider.source.sourceUrl} limitations={provider.limitations} hasMatchEvidence={hasMatchEvidence} showMissingMetrics={index === 0} />)}
    <CoachDataTab
      coachId={params.id}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile={(profile ?? null) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      externalProfile={(externalProfile ?? null) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recruitment={(recruitment ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mediaEvents={(mediaEvents ?? []) as any}
    />
    </>
  )
}
