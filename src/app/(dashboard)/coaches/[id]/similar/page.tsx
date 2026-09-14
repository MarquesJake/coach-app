import { redirect, notFound } from 'next/navigation'
import Link from '@/app/(dashboard)/coaches/_components/research-context-link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { assertRouteQueries } from '@/lib/coaches/route-audit'
import { researchedCoachChoices } from '@/lib/coaches/research-picker'
import { compareResearchCategories } from '@/lib/coaches/research-similarity'
import { RESEARCH_PROFILES } from '@/lib/scoring/research/profiles'
import type { ResearchProfile } from '@/lib/scoring/research/brief-fit'
import { getCoachDuplicateReviewsAction } from '../../actions'

export const metadata = { title: 'Similar' }

function Sources({ profile }: { profile: ResearchProfile }) {
  return <div className="mt-3 space-y-2">{profile.sources.map(source => <p key={source.url} className="text-xs"><a className="text-primary underline" href={source.url} target="_blank" rel="noreferrer">{source.title}</a><span className="block text-muted-foreground">Evidence period: {source.period}</span></p>)}</div>
}

export default async function CoachSimilarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: coach, error } = await getCoachById(id)
  assertRouteQueries('Coach profile', { error })
  if (!coach) notFound()

  // Page through accessible records so catalog growth does not silently truncate comparisons.
  const records: { id: string; name: string; club_current: string | null; nationality: string | null }[] = []
  for (let from = 0; ; from += 500) {
    const page = await supabase.from('coaches').select('id,name,club_current,nationality').order('id').range(from, from + 499)
    assertRouteQueries('Peer identities', page)
    records.push(...(page.data ?? []))
    if ((page.data?.length ?? 0) < 500) break
  }
  const reviews = await getCoachDuplicateReviewsAction()
  const eligible = researchedCoachChoices(records, {}, reviews)
  const { current, peers } = compareResearchCategories(id, eligible, RESEARCH_PROFILES)

  return <div className="space-y-4">
    <h2 className="text-lg font-medium text-foreground">Peer group</h2>
    <p className="text-sm text-muted-foreground">Categorical similarity from sourced research: playing style, build-up and pressing. This is not club fit, a probability of success or an availability assessment. Categories are research interpretations of the cited periods.</p>
    <Link href={`/coaches/${id}/fit`} className="inline-block text-sm text-primary underline">Assess against a club brief</Link>
    {!current ? <section className="rounded-lg border border-border bg-card p-6"><h3 className="font-medium">Research needed</h3><p className="mt-2 text-sm text-muted-foreground">This coach needs a sourced catalog profile and a resolved record identity before we can compare categories. No peers have been inferred from manual ratings.</p><Link className="mt-3 inline-block text-sm text-primary underline" href={`/coaches/${id}/research`}>Open coach research</Link></section> : <>
      <section className="rounded-lg border border-border bg-card p-6"><h3 className="font-medium">{current.name} · comparison baseline</h3><p className="mt-2 text-sm">{current.style} · {current.build} build-up · {current.pressing} pressing</p><p className="mt-2 text-sm text-muted-foreground">{current.summary}</p><p className="mt-2 text-xs text-muted-foreground">{current.limitation}</p><Sources profile={current}/></section>
      <p className="text-xs text-muted-foreground">{peers.length} accessible researched peers share at least one category. Shown alphabetically, without a similarity score. Identity review exclusions are preserved; uncatalogued records are outside this comparison.</p>
      <section className="rounded-lg border border-border bg-card p-6">{!peers.length ? <p className="text-sm text-muted-foreground">No accessible, identity-reviewed research profiles share these categories.</p> : <ul className="divide-y divide-border">{peers.map(({ record, profile, dimensions }) => <li key={record.id} className="py-5 first:pt-0">
        <Link href={`/coaches/${record.id}`} className="text-base font-medium text-primary underline">{profile.name}</Link>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">{dimensions.map(dimension => <div key={dimension.label}><dt className="text-xs text-muted-foreground">{dimension.label}</dt><dd className="text-sm">{dimension.peer} · {dimension.shared ? 'Shared category' : `Different from ${dimension.current}`}</dd></div>)}</dl>
        <p className="mt-3 text-sm">{profile.summary}</p><p className="mt-2 text-xs text-muted-foreground">{profile.limitation}</p><Sources profile={profile}/>
      </li>)}</ul>}</section>
    </>}
  </div>
}
