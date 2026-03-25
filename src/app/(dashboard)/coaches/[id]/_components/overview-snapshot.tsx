'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, MapPin, TrendingUp, Shield, BarChart3 } from 'lucide-react'
import { EditCoachDrawer, type EditCoachField } from './edit-coach-drawer'
import { updateCoachCoreAction } from '@/app/(dashboard)/coaches/[id]/actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'

function formatScore(value: number | null | undefined): string {
  if (value == null) return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return String(Math.round(n))
}

const OVERVIEW_FIELDS: EditCoachField[] = [
  { key: 'preferred_name', label: 'Preferred name', type: 'text' },
  { key: 'date_of_birth', label: 'Date of birth', type: 'text', placeholder: 'YYYY-MM-DD' },
  { key: 'languages', label: 'Languages', type: 'comma', placeholder: 'e.g. English, Spanish', helperText: 'Comma separated' },
  { key: 'base_location', label: 'Base location', type: 'text' },
  { key: 'relocation_flexibility', label: 'Relocation flexibility', type: 'text' },
  { key: 'family_context', label: 'Family context', type: 'textarea' },
  { key: 'agent_name', label: 'Agent name', type: 'text' },
  { key: 'agent_contact', label: 'Agent contact', type: 'text' },
  { key: 'compensation_expectation', label: 'Compensation expectation', type: 'text' },
  { key: 'availability_status', label: 'Availability status', type: 'text' },
  { key: 'market_status', label: 'Market status', type: 'text' },
]

type CoachRecord = Record<string, unknown>

export function OverviewSnapshot({ coachId, coach }: { coachId: string; coach: CoachRecord }) {
  const router = useRouter()
  const availability = (coach.availability_status as string | null) ?? (coach.available_status as string | null) ?? null
  const marketStatus = coach.market_status as string | null | undefined
  const baseLocation = coach.base_location as string | null | undefined
  const overallScore = coach.overall_manual_score as number | null | undefined
  const intelligenceConf = coach.intelligence_confidence as number | null | undefined
  const legalRisk = (coach.legal_risk_flag as boolean) ?? false
  const integrityRisk = (coach.integrity_risk_flag as boolean) ?? false
  const safeguardingRisk = (coach.safeguarding_risk_flag as boolean) ?? false
  const hasRisk = legalRisk || integrityRisk || safeguardingRisk

  const initialValues: Record<string, unknown> = {
    preferred_name: coach.preferred_name ?? '',
    date_of_birth: coach.date_of_birth ?? '',
    languages: coach.languages ?? [],
    base_location: coach.base_location ?? '',
    relocation_flexibility: coach.relocation_flexibility ?? '',
    family_context: coach.family_context ?? '',
    agent_name: coach.agent_name ?? '',
    agent_contact: coach.agent_contact ?? '',
    compensation_expectation: coach.compensation_expectation ?? '',
    availability_status: coach.availability_status ?? '',
    market_status: coach.market_status ?? '',
  }

  const handleSave = async (payload: Record<string, unknown>) => {
    const result = await updateCoachCoreAction(coachId, payload)
    if (!result.ok) {
      toastError(result.error)
      return result
    }
    toastSuccess('Profile updated')
    return result
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">
            Snapshot
          </h2>
          <EditCoachDrawer
            title="Edit overview"
            triggerLabel="Edit"
            fields={OVERVIEW_FIELDS}
            initialValues={initialValues}
            onSave={handleSave}
            onSuccess={() => router.refresh()}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Availability</p>
            <p className="text-sm font-medium text-foreground">{availability ?? ''}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Market status</p>
            <p className="text-sm font-medium text-foreground">{marketStatus ?? ''}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Base location
            </p>
            <p className="text-sm font-medium text-foreground">{baseLocation ?? ''}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> Overall manual score
            </p>
            <p className="text-sm font-medium text-foreground">{formatScore(overallScore) || ''}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Intelligence confidence
            </p>
            <p className="text-sm font-medium text-foreground">{formatScore(intelligenceConf) || ''}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Risk flag
            </p>
            {hasRisk ? (
              <Badge variant="danger" className="text-xs flex items-center gap-1 w-fit">
                <AlertTriangle className="w-3 h-3" />
                Flagged
              </Badge>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">None</p>
            )}
          </div>
        </div>
      </section>
      {/* ── Quick Profile ────────────────────────────────────────────────── */}
      <QuickProfile coach={coach} coachId={coachId} />

      <p className="text-sm text-muted-foreground">
        Use the tabs above to view Tactical, Leadership, Career, Staff Network, Data, Risk &amp; Intelligence, and Scoring.
      </p>
    </div>
  )
}

function QuickProfile({ coach, coachId }: { coach: CoachRecord; coachId: string }) {
  const leagueExp = (coach.league_experience as string[] | null) ?? []
  const preferredSystems = (coach.preferred_systems as string[] | null) ?? []
  const pressingIntensity = (coach.pressing_intensity as string | null) ?? ''
  const preferredStyle = (coach.preferred_style as string | null) ?? ''
  const buildPreference = (coach.build_preference as string | null) ?? ''
  const reputationTier = (coach.reputation_tier as string | null) ?? ''

  const styleTags = [pressingIntensity, preferredStyle, buildPreference].filter(Boolean)
  const hasAnyData = leagueExp.length > 0 || preferredSystems.length > 0 || styleTags.length > 0 || reputationTier

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-medium text-foreground mb-4">Quick profile</h2>
      {!hasAnyData ? (
        <p className="text-sm text-muted-foreground">
          No profile data yet.{' '}
          <Link href={`/coaches/${coachId}/career`} className="underline underline-offset-2 hover:text-foreground">
            Add career stints →
          </Link>{' '}
          or edit the coach profile to add tactical info.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Leagues coached */}
          {leagueExp.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Leagues coached</p>
              <div className="flex flex-wrap gap-1">
                {leagueExp.map((l) => (
                  <span
                    key={l}
                    className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-foreground"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preferred formations */}
          {preferredSystems.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Preferred formations</p>
              <div className="flex flex-wrap gap-1">
                {preferredSystems.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Style tags */}
          {styleTags.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Style</p>
              <div className="flex flex-wrap gap-1">
                {styleTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reputation tier */}
          {reputationTier && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Reputation tier</p>
              <span className="inline-flex items-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 text-xs font-semibold">
                {reputationTier}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
