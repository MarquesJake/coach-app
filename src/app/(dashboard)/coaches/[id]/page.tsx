import { legacyCoachSeedIndex } from '@/lib/coaches/legacy-seed-provenance'
import { savedProfileLabel } from '@/lib/coaches/saved-profile-label'
import { assertRouteQueries } from '@/lib/coaches/route-audit'
import { readResearchContext, questionsForScope, type ResearchParams } from '@/lib/research-context'
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { evidenceLabel } from '@/lib/display-copy'
import type { ComponentProps } from 'react'
import Link from '@/app/(dashboard)/coaches/_components/research-context-link'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { evidenceStatus, summariseEvidence } from '@/lib/decision-workflow'
import { listCoachAgentsForCoach } from '@/lib/db/agentLinks'
import { getAgentsForTeam } from '@/lib/db/agents'
import { CoachAgentsSection } from './_components/coach-agents-section'
import { CoachAssessment } from './_components/coach-assessment'



export default async function CoachOverviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<ResearchParams> }) {
  const { id } = await params
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  const { data: coach, error } = await getCoachById(id)
  assertRouteQueries('Coach overview', { error })
  if (!coach) notFound()
  const [claims, research, shortlist, agents, options] = await Promise.all([
    db.from('profile_claims').select('*').eq('coach_id', id).order('created_at', { ascending: false }),
    db.from('coach_research_questions').select('*').eq('coach_id', id).order('updated_at', { ascending: false }),
    db.from('mandate_shortlist').select('id, candidate_stage, mandates(id, custom_club_name, clubs(name))').eq('coach_id', id),
    listCoachAgentsForCoach(id), getAgentsForTeam(),
  ])
  assertRouteQueries('Coach overview records', claims, research, shortlist, agents, options)
  const context = readResearchContext(await searchParams)
  const findings = claims.data ?? []
  const questions = questionsForScope(research.data ?? [], context.mandate, context.scope === 'general')
  const evidence = summariseEvidence(findings)
  const base = `/coaches/${id}`
  return <div className="space-y-7">
    {(claims.error || research.error) && <p role="alert" className="rounded-lg border p-4">Some evidence didn’t load. Refresh before making a decision.</p>}
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="gaffa-panel-heading">Coach overview</h2><p className="gaffa-description mt-1">What we know, what backs it up and what we still need to check.</p></div><Link className="gaffa-link inline-flex items-center gap-2" href={`${base}/record`}>Full profile<ArrowUpRight className="h-4 w-4"/></Link></div>
      {savedProfileLabel(coach, legacyCoachSeedIndex(coach.user_id, id) >= 0).startsWith('DEMO') && <p className="mt-3 text-sm print:text-black">DEMO DATA · legacy example profile. Separately sourced findings retain their own provenance.</p>}
      <div className="gaffa-stats">{[[evidence.recorded, 'Findings recorded'], [evidence.verified, 'Current checked sources'], [questions.filter(q => q.status !== 'answered').length, 'Open questions'], [evidence.disputed, 'Conflicting accounts']].map(([n,label]) => <div key={label}><strong>{n}</strong><span>{label}</span></div>)}</div>
      <details className="text-xs text-muted-foreground"><summary className="w-fit cursor-pointer underline decoration-border underline-offset-4">About these figures</summary><p className="mt-2 max-w-3xl leading-relaxed">Counts describe saved finding records, not independent people. {evidence.illustrative} DEMO DATA record(s) are included in findings recorded, but excluded from current checked sources. A checked record does not confirm every claim or establish suitability. {evidence.stale} records need updating.</p></details>
    </section>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
      <CoachAssessment coachId={id} data={claims.error || research.error ? undefined : {questions, findings}}/>
      <div className="space-y-6">
        <section className="gaffa-panel"><p className="gaffa-eyebrow mb-2">Mandate context</p><h2 className="gaffa-panel-heading">Where this coach is being considered</h2><div className="mt-4 space-y-3">{(shortlist.data ?? []).map(row => { const mandate = row.mandates; return mandate ? <Link key={row.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 p-4 hover:bg-muted" href={`/mandates/${mandate.id}/decision`}><span><strong className="block text-sm font-medium">{mandate.custom_club_name || mandate.clubs?.name || 'Confidential mandate'}</strong><span className="mt-1 block text-xs text-muted-foreground">{row.candidate_stage?.replaceAll('_',' ') || 'Assessment pending'}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-primary"/></Link> : null })}</div>{!shortlist.data?.length && <p className="mt-3 text-sm text-muted-foreground">Not on a shortlist yet. <Link className="gaffa-link" href={`${base}/fit`}>Choose a brief</Link>.</p>}</section>
        <section className="gaffa-panel"><p className="gaffa-eyebrow mb-2">Supporting evidence</p><h2 className="gaffa-panel-heading">Latest findings</h2><div className="mt-4 divide-y divide-border">{findings.slice(0,3).map(f => <div className="py-3 first:pt-0" key={f.id}><span className="gaffa-badge mb-2">{evidenceStatus(f) === 'Illustrative' ? 'DEMO DATA' : evidenceLabel(evidenceStatus(f))}</span><p className="line-clamp-3 text-sm leading-relaxed">{f.claimed_value}</p><p className="mt-2 text-xs text-muted-foreground">{f.source_name || 'Source missing'} · {f.occurred_at?.slice(0,10) || 'Date missing'}</p></div>)}</div>{!findings.length && <p className="mt-3 text-sm text-muted-foreground">No source findings recorded yet.</p>}<Link className="gaffa-link mt-4 inline-flex items-center gap-2" href={`${base}/intelligence`}>Review all sources<ArrowUpRight className="h-3.5 w-3.5"/></Link></section>
      </div>
    </div>
    <details className="gaffa-disclosure border-t border-border py-5"><summary className="flex items-center justify-between gap-3 text-sm font-medium">Agents and contacts<ChevronDown className="disclosure-chevron h-4 w-4"/></summary><div className="mt-4"><CoachAgentsSection coachId={id} links={(agents.data ?? []) as unknown as ComponentProps<typeof CoachAgentsSection>['links']} agentsOptions={options.data ?? []} /></div></details>
  </div>
}
