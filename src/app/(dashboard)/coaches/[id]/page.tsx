import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { OverviewSnapshot } from './_components/overview-snapshot'
import { getStageLabel } from '@/lib/constants/mandateStages'
import { claimFieldLabel, claimTypeLabel } from '@/lib/profile-claims'
import { displayClubName } from '@/lib/display-names'

type CoachRecord = Record<string, unknown>

type Stint = {
  id: string
  club_name: string
  role_title: string
  started_on: string | null
  ended_on: string | null
  source_type: string | null
  source_name: string | null
  confidence: number | null
}

type ExternalProfile = {
  source_name: string | null
  synced_at: string | null
  confidence: number | null
  match_confidence: number | null
  current_team_name: string | null
}

type PortalProfile = {
  portal_status: string
  visibility_status: string
  football_identity: string | null
  training_week: string | null
  session_design_principles: string | null
  staff_network: string | null
  key_staff_likely_to_follow: string | null
  reference_permissions: string | null
  sensitive_notes: string | null
}

type PrivateMaterial = {
  id: string
  title: string
  material_type: string
  description: string | null
  source_label: string | null
  uploaded_by: string
  confidentiality_status: string
  verification_status: string
  created_at: string
}

type ProfileClaim = {
  id: string
  claim_type: string
  profile_field: string | null
  claimed_value: string
  evidence_summary: string
  source_type: string
  source_name: string | null
  source_tier: string | null
  confidence: number | null
  sensitivity: string
  verification_status: string
  review_status: string
  occurred_at: string | null
}

type MandateRelation = {
  id: string
  relation: 'Shortlist' | 'Longlist'
  stage: string | null
  status: string | null
  probability: number | null
  rankingScore: number | null
  mandate: {
    id: string
    custom_club_name: string | null
    status: string | null
    pipeline_stage: string | null
    priority: string | null
    clubs: { name: string | null } | null
  }
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function formatDate(value: string | null): string {
  if (!value) return 'Date not captured'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date not captured'
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function formatSynced(value: string | null): string {
  if (!value) return 'Source sync pending'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Source sync pending'
  return `Synced ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

function numberValue(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

function deriveFitSignals(coach: CoachRecord): string[] {
  const signals = [
    text(coach.preferred_style) ? `${text(coach.preferred_style)} game model` : null,
    text(coach.pressing_intensity) ? `${text(coach.pressing_intensity)} pressing profile` : null,
    text(coach.build_preference) ? `${text(coach.build_preference)} build preference` : null,
    text(coach.leadership_style) ? `${text(coach.leadership_style)} leadership style` : null,
  ].filter(Boolean) as string[]

  const leagues = Array.isArray(coach.league_experience) ? coach.league_experience.map(String).filter(Boolean) : []
  if (leagues.length > 0) signals.push(`Experience across ${leagues.slice(0, 2).join(', ')}`)

  const score = numberValue(coach.overall_manual_score)
  if (score != null && score >= 70) signals.push(`Strong internal score at ${Math.round(score)}`)

  return signals.slice(0, 4)
}

function deriveRisk(coach: CoachRecord, externalProfile: ExternalProfile | null): string {
  if (coach.legal_risk_flag) return 'Legal risk flag requires board review before mandate progression.'
  if (coach.integrity_risk_flag) return 'Integrity risk flag requires source validation before recommendation.'
  if (coach.safeguarding_risk_flag) return 'Safeguarding risk flag requires escalation before shortlist use.'

  const confidence = externalProfile?.match_confidence ?? externalProfile?.confidence ?? numberValue(coach.intelligence_confidence)
  if (confidence == null || confidence < 60) return 'Evidence coverage is still developing, confidence should be strengthened before final recommendation.'
  if (!text(coach.due_diligence_summary)) return 'Due diligence summary has not yet been written, board narrative still needs human judgement.'
  return 'No major risk flag is currently recorded, continue monitoring live intelligence.'
}

function dossierSummary(coach: CoachRecord, externalProfile: ExternalProfile | null) {
  const name = text(coach.name) ?? 'This coach'
  const role = text(coach.role_current) ?? 'senior coach'
  const club = text(coach.club_current) ?? externalProfile?.current_team_name ?? 'current club context not yet confirmed'
  const availability = text(coach.availability_status) ?? text(coach.available_status) ?? 'availability still being qualified'
  const nationality = text(coach.nationality)
  const age = numberValue(coach.age)
  const identity = [nationality, age != null ? `${Math.round(age)} years old` : null].filter(Boolean).join(', ')

  return {
    who: `${name} is profiled as a ${role}${club ? ` at ${club}` : ''}${identity ? `, ${identity}` : ''}.`,
    situation: `Current situation: ${availability}${text(coach.market_status) ? `, ${text(coach.market_status)}` : ''}.`,
    signals: deriveFitSignals(coach),
    risk: deriveRisk(coach, externalProfile),
  }
}

function badgeClass(kind: 'api' | 'manual' | 'current' | 'relation') {
  switch (kind) {
    case 'api': return 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400'
    case 'manual': return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    case 'current': return 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400'
    case 'relation': return 'border-primary/20 bg-primary/10 text-primary'
  }
}

function mandateClubName(entry: MandateRelation): string {
  return displayClubName(entry.mandate.custom_club_name, entry.mandate.clubs?.name, 'Confidential mandate')
}

function materialLabel(value: string): string {
  return value.replaceAll('_', ' ')
}

function profileValue(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.trim()
  return 'Not captured'
}

export default async function CoachOverviewPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(user.id, params.id)
  if (error || !coach) notFound()

  const [externalProfileRes, stintsRes, shortlistRes, longlistRes, portalRes, materialsRes, claimsRes] = await Promise.all([
    supabase
      .from('coach_external_profiles')
      .select('source_name, synced_at, confidence, match_confidence, current_team_name')
      .eq('coach_id', params.id)
      .order('synced_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('coach_stints')
      .select('id, club_name, role_title, started_on, ended_on, source_type, source_name, confidence')
      .eq('coach_id', params.id)
      .order('started_on', { ascending: false, nullsFirst: false })
      .limit(8),
    supabase
      .from('mandate_shortlist')
      .select(`
        id, status, candidate_stage, placement_probability,
        mandates!inner(id, custom_club_name, status, pipeline_stage, priority, clubs(name))
      `)
      .eq('coach_id', params.id)
      .eq('mandates.user_id', user.id),
    supabase
      .from('mandate_longlist')
      .select(`
        id, ranking_score,
        mandates!inner(id, custom_club_name, status, pipeline_stage, priority, clubs(name))
      `)
      .eq('coach_id', params.id)
      .eq('mandates.user_id', user.id),
    supabase
      .from('coach_portal_profiles')
      .select('portal_status, visibility_status, football_identity, training_week, session_design_principles, staff_network, key_staff_likely_to_follow, reference_permissions, sensitive_notes')
      .eq('coach_id', params.id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('coach_private_materials')
      .select('id, title, material_type, description, source_label, uploaded_by, confidentiality_status, verification_status, created_at')
      .eq('coach_id', params.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('profile_claims')
      .select('id, claim_type, profile_field, claimed_value, evidence_summary, source_type, source_name, source_tier, confidence, sensitivity, verification_status, review_status, occurred_at')
      .eq('coach_id', params.id)
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false, nullsFirst: false })
      .limit(8),
  ])

  const coachRecord = coach as CoachRecord
  const externalProfile = (externalProfileRes.data ?? null) as ExternalProfile | null
  const summary = dossierSummary(coachRecord, externalProfile)
  const stints = (stintsRes.data ?? []) as Stint[]
  const portalProfile = (portalRes.data ?? null) as PortalProfile | null
  const privateMaterials = (materialsRes.data ?? []) as PrivateMaterial[]
  const profileClaims = (claimsRes.data ?? []) as ProfileClaim[]
  const verifiedClaims = profileClaims.filter((claim) => claim.verification_status === 'verified').length
  const appliedClaims = profileClaims.filter((claim) => claim.review_status === 'applied').length

  const mandateMap = new Map<string, MandateRelation>()
  for (const row of (longlistRes.data ?? []) as unknown as Array<{ id: string; ranking_score: number | null; mandates: MandateRelation['mandate'] | null }>) {
    if (!row.mandates) continue
    mandateMap.set(row.mandates.id, {
      id: row.id,
      relation: 'Longlist',
      stage: null,
      status: null,
      probability: null,
      rankingScore: row.ranking_score,
      mandate: row.mandates,
    })
  }
  for (const row of (shortlistRes.data ?? []) as unknown as Array<{ id: string; status: string | null; candidate_stage: string | null; placement_probability: number | null; mandates: MandateRelation['mandate'] | null }>) {
    if (!row.mandates) continue
    mandateMap.set(row.mandates.id, {
      id: row.id,
      relation: 'Shortlist',
      stage: row.candidate_stage,
      status: row.status,
      probability: row.placement_probability,
      rankingScore: mandateMap.get(row.mandates.id)?.rankingScore ?? null,
      mandate: row.mandates,
    })
  }
  const mandateLinks = Array.from(mandateMap.values())

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-card px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Board dossier</p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">Dossier summary</h2>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{summary.who}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface/70 px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Source status</p>
              <p className="text-xs font-medium text-foreground">
                {externalProfile?.source_name ? `${externalProfile.source_name} · ${formatSynced(externalProfile.synced_at)}` : 'Manual profile, API source not linked yet'}
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-6 lg:grid-cols-[1.1fr_1fr_1fr]">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Current situation</p>
            <p className="mt-2 text-sm leading-6 text-foreground">{summary.situation}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Strongest fit signals</p>
            {summary.signals.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {summary.signals.map((signal) => (
                  <span key={signal} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-600 dark:text-emerald-400">
                    {signal}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Fit evidence is waiting for tactical, leadership, and league context to be added.</p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Main risk or unknown</p>
            <p className="mt-2 text-sm leading-6 text-foreground">{summary.risk}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div id="profile-claims" className="rounded-xl border border-border bg-card p-6 scroll-mt-24">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Career timeline</h2>
              <p className="text-xs text-muted-foreground">Recent roles with source provenance separated from manual intelligence.</p>
            </div>
            <Link href={`/coaches/${params.id}/career`} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Full career view
            </Link>
          </div>
          {stints.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface/40 p-4 text-sm text-muted-foreground">
              Career timeline is not evidenced yet. Add verified roles or run enrichment before this profile goes into an assessment pack.
            </div>
          ) : (
            <ol className="space-y-3">
              {stints.map((stint) => {
                const isCurrent = !stint.ended_on
                const sourceKind = stint.source_type === 'api-football' ? 'api' : 'manual'
                return (
                  <li key={stint.id} className="rounded-lg border border-border bg-surface/40 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{stint.club_name}</p>
                          {isCurrent && <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${badgeClass('current')}`}>Current</span>}
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${badgeClass(sourceKind)}`}>
                            {stint.source_name ?? (sourceKind === 'api' ? 'API Football' : 'Manual source')}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{stint.role_title || 'Role title being verified'}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(stint.started_on)} to {isCurrent ? 'Present' : formatDate(stint.ended_on)}
                      </p>
                    </div>
                    {stint.confidence != null && (
                      <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">Source confidence {stint.confidence}</p>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Active mandate links</h2>
              <p className="text-xs text-muted-foreground">Where this coach is already part of a decision workflow.</p>
            </div>
            <Link href="/mandates" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Mandates
            </Link>
          </div>
          {mandateLinks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface/40 p-4 text-sm text-muted-foreground">
              This coach is not attached to an active mandate yet. Add them to a longlist when the next club brief needs a fit assessment.
            </div>
          ) : (
            <ul className="space-y-3">
              {mandateLinks.map((entry) => (
                <li key={`${entry.relation}-${entry.id}`} className="rounded-lg border border-border bg-surface/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/mandates/${entry.mandate.id}/workspace`} className="block truncate text-sm font-semibold text-foreground hover:underline">
                        {mandateClubName(entry)}
                      </Link>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${badgeClass('relation')}`}>{entry.relation}</span>
                        {entry.mandate.pipeline_stage && <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">{getStageLabel(entry.mandate.pipeline_stage)}</span>}
                        {entry.stage && <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">{entry.stage}</span>}
                      </div>
                    </div>
                    <Link href={`/mandates/${entry.mandate.id}/workspace`} className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground">
                      Open
                    </Link>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {entry.probability != null ? `Placement probability ${entry.probability}%` : entry.rankingScore != null ? `Longlist score ${Math.round(entry.rankingScore)}` : 'Awaiting score evidence'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Private football intelligence
              </p>
              <h2 className="mt-1 text-base font-semibold text-foreground">Commercial and personal appointment context</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                The information a club pays for because it is hard to get from public data.
              </p>
            </div>
            <Link href={`/coach-portal/${params.id}`} className="shrink-0 text-xs text-primary hover:underline">
              Coach portal
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'Contract expiry', value: coachRecord.contract_expiry ? formatDate(String(coachRecord.contract_expiry)) : null },
              { label: 'Release / compensation clause', value: text(coachRecord.release_clause) },
              { label: 'Wage expectation', value: text(coachRecord.wage_expectation) },
              { label: 'Compensation expectation', value: text(coachRecord.compensation_expectation) },
              { label: 'Staff cost estimate', value: text(coachRecord.staff_cost_estimate) },
              { label: 'Agent / representative', value: [text(coachRecord.agent_name), text(coachRecord.agent_contact)].filter(Boolean).join(' · ') },
              { label: 'Family context', value: text(coachRecord.family_context) },
              { label: 'Relocation flexibility', value: text(coachRecord.relocation_flexibility) },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-surface/40 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-sm text-foreground">{item.value || 'Not captured'}</p>
              </div>
            ))}
          </div>
          {text(coachRecord.contract_notes) && (
            <div className="mt-3 rounded-lg border border-border bg-surface/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Contract context notes</p>
              <p className="mt-1 text-sm leading-6 text-foreground">{text(coachRecord.contract_notes)}</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Source-backed claims
              </p>
              <h2 className="mt-1 text-base font-semibold text-foreground">What our network says has changed</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Agent calls, references and analyst notes become reviewable findings before they influence a pack.
              </p>
            </div>
            <div className="text-right text-2xs text-muted-foreground">
              <p>{profileClaims.length} claim{profileClaims.length === 1 ? '' : 's'}</p>
              <p>{verifiedClaims} verified · {appliedClaims} applied</p>
            </div>
          </div>
          {profileClaims.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface/40 p-4 text-sm text-muted-foreground">
              No findings captured yet. Log agent conversations or references to build private intelligence over time.
            </div>
          ) : (
            <div className="space-y-2">
              {profileClaims.map((claim) => (
                <div id={`claim-${claim.id}`} key={claim.id} className="rounded-lg border border-border bg-surface/40 p-3 scroll-mt-24">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {claimTypeLabel(claim.claim_type)}
                    </span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                      {claimFieldLabel(claim.profile_field)}
                    </span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                      {claim.review_status}
                    </span>
                    {claim.confidence != null && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">{claim.confidence}% confidence</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground">{claim.claimed_value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{claim.evidence_summary}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {[claim.source_name, claim.source_type.replaceAll('_', ' '), claim.source_tier ? `tier ${claim.source_tier}` : null, claim.sensitivity].filter(Boolean).join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Coach-submitted depth
              </p>
              <h2 className="mt-1 text-base font-semibold text-foreground">Portal profile and private material</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                The supply-side layer: the best version of the coach, checked by football people before it reaches a club.
              </p>
            </div>
            <span className="rounded-full border border-border bg-surface px-2 py-1 text-[10px] text-muted-foreground">
              {portalProfile?.portal_status ?? 'not invited'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'Football identity', value: portalProfile?.football_identity },
              { label: 'Training week', value: portalProfile?.training_week },
              { label: 'Session design', value: portalProfile?.session_design_principles },
              { label: 'Staff network', value: portalProfile?.staff_network ?? portalProfile?.key_staff_likely_to_follow },
              { label: 'Reference permissions', value: portalProfile?.reference_permissions },
              { label: 'Sensitive context', value: portalProfile?.sensitive_notes },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-surface/40 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="mt-1 line-clamp-3 text-sm leading-6 text-foreground">{profileValue(item.value)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Confidential materials
              </p>
              <h2 className="mt-1 text-base font-semibold text-foreground">Training-ground evidence library</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Presentations, video, methodology and reference packs that can sit behind a controlled club request.
              </p>
            </div>
            <p className="text-right text-2xs text-muted-foreground">
              {privateMaterials.length} item{privateMaterials.length === 1 ? '' : 's'}
            </p>
          </div>
          {privateMaterials.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface/40 p-4 text-sm text-muted-foreground">
              No private materials logged yet. Add coach presentations, training video and methodology in the coach portal.
            </div>
          ) : (
            <div className="space-y-2">
              {privateMaterials.map((item) => (
                <div id={`material-${item.id}`} key={item.id} className="rounded-lg border border-border bg-surface/40 p-3 scroll-mt-24">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-2xs text-muted-foreground">
                        {materialLabel(item.material_type)}
                        {item.source_label ? ` · ${item.source_label}` : ''}
                        {item.uploaded_by ? ` · ${item.uploaded_by}` : ''}
                        {item.verification_status === 'verified' ? ' · verified' : ''}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                      {item.confidentiality_status}
                    </span>
                  </div>
                  {item.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <OverviewSnapshot coachId={params.id} coach={coachRecord} />
    </div>
  )
}
