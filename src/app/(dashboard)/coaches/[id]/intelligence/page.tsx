import { isIllustrativeEvidence } from '@/lib/assessment/evidence-integrity'
import { contextFromResearchNote, researchHref } from '@/lib/research-context'
import { assertRouteQueries } from '@/lib/coaches/route-audit'
import Link from '@/app/(dashboard)/coaches/_components/research-context-link'
import { notFound, redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { getCoachById } from '@/lib/db/coaches'
import {
  criterionLabel,
  evidenceStrengthLabel,
  formatEnumLabel,
  stakeholderGroupLabel,
} from '@/lib/intelligence/display'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata = { title: 'Research & sources' }


const METHODOLOGY_CRITERIA = [
  'coach_profile',
  'performance_impact',
  'tactical_proposal',
  'match_management',
  'training_management',
  'players_development',
  'media_comms',
  'personality_profile',
  'cultural_org_fit',
] as const

function formatDate(value: string | null) {
  if (!value) return 'Date pending'
  return new Date(value).toLocaleDateString('en-GB')
}

export default async function CoachIntelligencePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(params.id)
  if (error) throw new Error('Coach profile could not be loaded. Reload before making changes.')
  if (!coach) notFound()

  const organizationId = await getInternalOrganizationId(user.id)
  const empty = Promise.resolve({ data: [], error: null })
  const emptyOne = Promise.resolve({ data: null, error: null })
  const [signalsRes, claimsRes, sourceRelationshipsRes, claimRelationshipsRes, referenceRoundsRes, benchRes, sessionsRes] = await Promise.all([
    supabase
      .from('intelligence_items')
      .select('id, title, detail, source_type, source_name, occurred_at, created_at, verified, direction, sensitivity')
      .eq('entity_type', 'coach')
      .eq('entity_id', params.id)
      .eq('is_deleted', false)
      .order('occurred_at', { ascending: false, nullsFirst: false })
      .limit(20),
    organizationId
      ? supabase.from('profile_claims').select('id, claimed_value, evidence_summary, evidence_strength, methodology_criteria, reviewed_at').eq('org_id', organizationId).eq('coach_id', params.id).in('review_status', ['accepted', 'applied']).is('deleted_at', null).order('reviewed_at', { ascending: false })
      : empty,
    organizationId
      ? supabase.from('contact_coach_relationships').select('contact_id, stakeholder_group').eq('org_id', organizationId).eq('coach_id', params.id)
      : empty,
    organizationId
      ? supabase.from('claim_relationships').select('source_claim_id, target_claim_id').eq('org_id', organizationId)
      : empty,
    organizationId
      ? supabase.from('reference_campaigns').select('id, title, evidence_gap, next_action, status').eq('org_id', organizationId).eq('coach_id', params.id).order('created_at', { ascending: false })
      : empty,
    organizationId
      ? supabase.from('trusted_bench_entries').select('stage').eq('org_id', organizationId).eq('coach_id', params.id).maybeSingle()
      : emptyOne,
    organizationId
      ? supabase.from('intelligence_sessions').select('id, title, analyst_notes, occurred_at, processing_status').eq('org_id', organizationId).eq('coach_id', params.id).order('occurred_at', { ascending: false }).limit(50)
      : empty,
  ])

  assertRouteQueries('Coach intelligence', signalsRes, claimsRes, sourceRelationshipsRes, claimRelationshipsRes, referenceRoundsRes, benchRes, sessionsRes)
  const findings = claimsRes.data ?? []
  const sourceRelationships = sourceRelationshipsRes.data ?? []
  const stakeholderGroups = new Set(sourceRelationships.map((row) => row.stakeholder_group))
  const sourceCount = new Set(sourceRelationships.map((row) => row.contact_id)).size
  const criteriaCovered = new Set(findings.flatMap((finding) => finding.methodology_criteria ?? []))
  const disputes = findings.filter((finding) => finding.evidence_strength === 'disputed')
  const corroborated = findings.filter((finding) => finding.evidence_strength === 'corroborated')
  const relatedFindingIds = new Set(
    (claimRelationshipsRes.data ?? []).flatMap((row) => [row.source_claim_id, row.target_claim_id])
  )

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-semibold">Saved conversations</h2>
        <p className="mt-1 text-sm text-muted-foreground">Notes and transcripts stay attached to this coach. A conversation is not a verified finding; demo examples do not contribute to evidence coverage or football fit.</p>
        <div className="mt-3 divide-y divide-border">{(sessionsRes.data ?? []).map(session => <div key={session.id} className="py-3">
          <Link className="text-sm font-medium text-primary hover:underline" href={researchHref(`/intelligence/review?session=${session.id}`, { ...contextFromResearchNote(session.analyst_notes), coach: params.id })}>{session.title}</Link>
          <p className="mt-1 text-xs text-muted-foreground">{isIllustrativeEvidence(session) ? 'DEMO DATA · fictional conversation' : formatEnumLabel(session.processing_status)} · {formatDate(session.occurred_at)}</p>
        </div>)}</div>
        {!sessionsRes.data?.length && <p className="mt-3 text-sm text-muted-foreground">No conversations saved for this coach yet.</p>}
      </section>
      <section className="border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Reviewed findings</h2>
            <p className="text-xs text-muted-foreground">Only intelligence we have checked. Who told us stays internal.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {benchRes.data?.stage && <Badge variant="success">{formatEnumLabel(benchRes.data.stage)}</Badge>}
            <Link href={`/intelligence/conversations?coach=${params.id}`} className="text-xs font-medium text-primary">Log conversation</Link>
            <Link href={`/intelligence/inbox?coach=${params.id}`} className="text-xs font-medium text-primary">Add source item</Link>
          </div>
        </div>

        <div className="grid divide-y divide-border sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="p-4"><p className="text-2xl font-semibold">{findings.length}</p><p className="text-xs text-muted-foreground">Findings</p></div>
          <div className="p-4"><p className="text-2xl font-semibold">{sourceCount}</p><p className="text-xs text-muted-foreground">Recorded sources</p></div>
          <div className="p-4"><p className="text-2xl font-semibold">{stakeholderGroups.size}</p><p className="text-xs text-muted-foreground">Stakeholder groups</p></div>
          <div className="p-4"><p className="text-2xl font-semibold">{criteriaCovered.size}/9</p><p className="text-xs text-muted-foreground">Criteria covered</p></div>
        </div>

        <div className="grid gap-5 border-t border-border p-4 lg:grid-cols-[2fr_1fr]">
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Reviewed findings</h3>
            <div className="mt-2 divide-y divide-border">
              {findings.slice(0, 8).map((finding) => (
                <div key={finding.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="flex-1 text-sm font-medium">{finding.claimed_value}</p>
                    <Badge variant={finding.evidence_strength === 'disputed' ? 'danger' : finding.evidence_strength === 'corroborated' ? 'success' : 'outline'}>
                      {evidenceStrengthLabel(finding.evidence_strength)}
                    </Badge>
                    {relatedFindingIds.has(finding.id) && <Badge variant="outline">Linked evidence</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{finding.evidence_summary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(finding.methodology_criteria ?? []).map(criterionLabel).join(' · ') || 'Criterion not assigned'} · reviewed {formatDate(finding.reviewed_at)}
                  </p>
                </div>
              ))}
              {!findings.length && <p className="py-6 text-sm text-muted-foreground">No reviewed findings yet.</p>}
            </div>
          </div>

          <aside className="space-y-4">
            <div><h3 className="text-xs font-semibold uppercase text-muted-foreground">Coverage</h3><p className="mt-2 text-sm text-muted-foreground">{Array.from(stakeholderGroups).map(stakeholderGroupLabel).join(' · ') || 'No stakeholder coverage recorded'}</p></div>
            <div><h3 className="text-xs font-semibold uppercase text-muted-foreground">Signal quality</h3><p className="mt-2 text-sm text-muted-foreground">{corroborated.length} corroborated · {disputes.length} disputed · {findings.length - corroborated.length - disputes.length} single source</p></div>
            <div><h3 className="text-xs font-semibold uppercase text-muted-foreground">Evidence gaps</h3><p className="mt-2 text-sm text-muted-foreground">{METHODOLOGY_CRITERIA.filter((criterion) => !criteriaCovered.has(criterion)).map(criterionLabel).join(' · ') || 'All methodology criteria covered'}</p></div>
            {(referenceRoundsRes.data ?? []).map((round) => <div key={round.id}><h3 className="text-xs font-semibold uppercase text-muted-foreground">Reference round</h3><Link href="/network/campaigns" className="mt-2 block text-sm font-medium hover:text-primary">{round.title}</Link><p className="text-xs text-muted-foreground">{round.evidence_gap || round.next_action || round.status}</p></div>)}
          </aside>
        </div>
      </section>

      <section className="border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Latest findings</h2>
          <p className="text-xs text-muted-foreground">Latest public news and time-sensitive signals. Nothing goes into an assessment until it has been checked.</p>
        </div>
        <div className="divide-y divide-border">
          {(signalsRes.data ?? []).map((signal) => (
            <div key={signal.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{signal.title}</p>
                <span className="text-xs text-muted-foreground">{formatDate(signal.occurred_at ?? signal.created_at)}</span>
              </div>
              {signal.detail && <p className="mt-1 text-xs leading-5 text-muted-foreground">{signal.detail}</p>}
              <p className="mt-2 text-xs text-muted-foreground">{[signal.source_type, signal.source_name, signal.verified ? 'Source checked' : 'Needs review'].filter(Boolean).join(' · ')}</p>
            </div>
          ))}
          {!(signalsRes.data ?? []).length && <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing new. Add public news in the Inbox, or log a conversation with a trusted contact.</p>}
        </div>
      </section>
    </div>
  )
}
