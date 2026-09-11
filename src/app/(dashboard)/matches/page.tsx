import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { assertRouteQueries } from '@/lib/coaches/route-audit'
import { researchHref } from '@/lib/research-context'

export const metadata = { title: 'Matches' }


export default async function MatchesPage({ searchParams }: { searchParams: Promise<{ vacancy?: string }> }) {
  const { vacancy: vacancyId } = await searchParams
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  const clubs = await db.from('clubs').select('id')
  assertRouteQueries('Accessible clubs', clubs)
  const clubIds = (clubs.data ?? []).map(club => club.id)
  const vacancies = clubIds.length
    ? await db.from('vacancies').select('*').in('club_id', clubIds).order('created_at', { ascending: false })
    : { data: [], error: null }
  assertRouteQueries('Historical briefs', vacancies)
  const vacancy = (vacancies.data ?? []).find(row => row.id === vacancyId)
  // Check brief access before requesting candidate records.
  const matches = vacancy
    ? await db.from('matches').select('*, coaches(id, name, role_current, club_current, available_status)').eq('vacancy_id', vacancy.id).order('overall_score', { ascending: false })
    : { data: [], error: null }
  assertRouteQueries('Historical matches', matches)
  const returnTo = '/matches' + (vacancy ? '?vacancy=' + encodeURIComponent(vacancy.id) : '')
  return <div className="space-y-5">
    <header className="space-y-2">
      <h2 className="text-xl font-semibold">Historical matches</h2>
      <p className="text-sm text-muted-foreground">Read-only vacancy records. Legacy scores and briefs are not reviewed appointment assessments or current recommendations.</p>
      <Link className="inline-block text-sm text-primary underline" href={vacancy ? '/mandates/new?club_id=' + encodeURIComponent(vacancy.club_id) : '/mandates/new'}>Start an appointment brief</Link>
    </header>
    {!!vacancies.data?.length && <form action="/matches" method="get" className="flex flex-wrap items-end gap-3 rounded border p-4">
      <div className="min-w-0 flex-1"><label htmlFor="historical-vacancy" className="mb-2 block text-sm">Historical brief</label>
        <select id="historical-vacancy" name="vacancy" defaultValue={vacancyId ?? ''} className="w-full rounded border bg-background p-2">
          <option value="">Select a brief</option>
          {vacancies.data.map(row => <option key={row.id} value={row.id}>{row.objective?.slice(0, 80) || row.id}{row.timeline ? ' / ' + row.timeline : ''}</option>)}
        </select>
      </div>
      <button type="submit" className="rounded border px-4 py-2 text-sm">View record</button>
    </form>}
    {vacancyId && !vacancy && <p role="alert" className="rounded border p-4 text-sm">This historical brief was not found or is not accessible. Select another record.</p>}
    {!vacancyId && <p className="rounded border p-4 text-sm text-muted-foreground">{vacancies.data?.length ? 'Select a historical brief to inspect its recorded matches.' : 'No historical briefs recorded. Start new work with an appointment brief.'}</p>}
    {vacancy && <>
      <section className="rounded border bg-card p-4"><h3 className="font-semibold">Recorded brief</h3><p className="mt-2 whitespace-pre-wrap text-sm">{vacancy.objective || 'Objective not recorded'}</p></section>
      <section className="space-y-3" aria-label="Historical candidate records">
        {!matches.data?.length && <p className="rounded border p-4 text-sm text-muted-foreground">No historical match results recorded. Current candidate work belongs in an appointment.</p>}
        {matches.data?.map(match => <article key={match.id} className="rounded border bg-card p-4">
          {match.coaches ? <Link className="font-semibold text-primary underline" href={researchHref('/coaches/' + match.coaches.id, { returnTo })}>{match.coaches.name}</Link> : <p className="font-semibold">Coach record unavailable</p>}
          <p className="mt-1 text-xs text-muted-foreground">{match.coaches?.club_current || 'Employment not recorded'}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{[
            ['Legacy overall score', match.overall_score], ['Financial fit', match.financial_fit_score], ['Cultural fit', match.cultural_fit_score],
            ['Availability score', match.availability_score], ['Risk score', match.risk_score], ['Confidence score', match.confidence_score],
          ].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-sm">{value ?? 'Not recorded'}</dd></div>)}</dl>
        </article>)}
      </section>
      {vacancy.executive_brief && <section className="rounded border bg-card p-4"><h3 className="font-semibold">Historical executive brief (unreviewed)</h3><p className="mt-3 whitespace-pre-wrap text-sm">{vacancy.executive_brief}</p></section>}
    </>}
  </div>
}
