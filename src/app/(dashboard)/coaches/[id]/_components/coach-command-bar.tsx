'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ClipboardCheck, AlertCircle, FileDown, Star } from 'lucide-react'
import { addCoachToCompareIds } from '@/lib/compare'
import { cn } from '@/lib/utils'
import { EditCoachDrawer, type EditCoachField } from './edit-coach-drawer'
import { AddIntelligenceDrawer } from './add-intelligence-drawer'
import { updateCoachCoreAction, addToWatchlistAction, removeFromWatchlistAction } from '@/app/(dashboard)/coaches/[id]/actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'

const PROFILE_AUDIT_LABEL: Record<string, string> = {
  complete: 'Complete',
  missing_tactical: 'Missing Tactical Data',
  missing_risk: 'Missing Risk Assessment',
  missing_network: 'Missing Network Data',
}

const MODIFY_PROFILE_FIELDS: EditCoachField[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'preferred_name', label: 'Preferred name', type: 'text' },
  { key: 'nationality', label: 'Nationality', type: 'text' },
  { key: 'base_location', label: 'Base location', type: 'text' },
  { key: 'languages', label: 'Languages', type: 'comma', placeholder: 'e.g. English, Spanish' },
  { key: 'availability_status', label: 'Availability status', type: 'text' },
  { key: 'market_status', label: 'Market status', type: 'text' },
  { key: 'compensation_expectation', label: 'Compensation expectation', type: 'text' },
  { key: 'agent_name', label: 'Agent name', type: 'text' },
  { key: 'agent_contact', label: 'Agent contact', type: 'text' },
  { key: 'due_diligence_summary', label: 'Due diligence summary', type: 'textarea', rows: 4 },
]

type CoachRecord = Record<string, unknown>
type ExternalProfileSummary = {
  photo_url: string | null
  source_name: string | null
  synced_at: string | null
  confidence: number | null
  match_confidence: number | null
}

const SCORE_BADGE = {
  high: 'text-green-400 border-green-500/40 bg-green-500/10',
  mid: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  low: 'text-red-400 border-red-500/40 bg-red-500/10',
}

function scoreBadgeClass(value: number | null | undefined): string {
  if (value == null) return SCORE_BADGE.low
  const n = Number(value)
  if (Number.isNaN(n)) return SCORE_BADGE.low
  if (n >= 70) return SCORE_BADGE.high
  if (n >= 40) return SCORE_BADGE.mid
  return SCORE_BADGE.low
}

function formatScore(v: number | null | undefined): string {
  if (v == null) return '—'
  const n = Number(v)
  return Number.isNaN(n) ? '—' : String(Math.round(n))
}

function formatShortDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function dataGapsLabel(opts: { stintCount: number; intelligenceCount: number; staffNetworkCount: number; completenessPercent: number }): string {
  const gaps: string[] = []
  if (opts.stintCount === 0) gaps.push('career outcomes')
  if (opts.intelligenceCount === 0) gaps.push('recent intelligence')
  if (opts.staffNetworkCount === 0) gaps.push('staff network depth')
  if (opts.completenessPercent < 60) gaps.push('profile depth')
  return gaps.length === 0 ? 'Profile coverage strong' : `Data gaps: ${gaps.join(', ')}`
}

export function CoachCommandBar({
  coachId,
  coach,
  completenessPercent,
  evidenceCoverage = 0,
  verifiedCoverage = 0,
  profileAuditStatus = 'complete',
  intelligenceWeightedConfidence,
  onWatchlist = false,
  stintCount = 0,
  intelligenceCount = 0,
  staffNetworkCount = 0,
  lastIntelligenceAt = null,
  intelligenceItemCount = 0,
  dataCoverage,
  externalProfile = null,
}: {
  coachId: string
  coach: CoachRecord
  completenessPercent: number
  evidenceCoverage?: number
  verifiedCoverage?: number
  profileAuditStatus?: 'complete' | 'missing_tactical' | 'missing_risk' | 'missing_network'
  intelligenceWeightedConfidence?: number
  onWatchlist?: boolean
  stintCount?: number
  intelligenceCount?: number
  staffNetworkCount?: number
  lastIntelligenceAt?: string | null
  intelligenceItemCount?: number
  dataCoverage?: { signalsCount: number; sourcesCount: number; lastUpdate: string | null }
  externalProfile?: ExternalProfileSummary | null
}) {
  const router = useRouter()
  const [modifyOpen, setModifyOpen] = useState(false)
  const [intelligenceOpen, setIntelligenceOpen] = useState(false)
  const [watchlist, setWatchlist] = useState(onWatchlist)
  const [watchlistPending, setWatchlistPending] = useState(false)
  useEffect(() => { setWatchlist(onWatchlist) }, [onWatchlist])
  const toggleWatchlist = async () => {
    setWatchlistPending(true)
    const action = watchlist ? removeFromWatchlistAction(coachId) : addToWatchlistAction(coachId)
    const { error } = await action
    setWatchlistPending(false)
    if (error) toastError(error)
    else {
      setWatchlist(!watchlist)
      toastSuccess(watchlist ? 'Removed from watchlist' : 'Added to watchlist')
      router.refresh()
    }
  }

  const name = (coach.name as string) ?? 'Coach'
  const role = (coach.role_current as string | null) ?? null
  const currentClub = (coach.club_current as string | null) ?? null
  const nationality = (coach.nationality as string | null) ?? null
  const age = coach.age as number | null | undefined
  const availability = (coach.availability_status as string | null) ?? (coach.available_status as string | null) ?? null
  const marketStatus = coach.market_status as string | null | undefined
  const baseLocation = coach.base_location as string | null | undefined
  const overallScore = coach.overall_manual_score as number | null | undefined
  const intelligenceConf = intelligenceWeightedConfidence ?? (coach.intelligence_confidence as number | null | undefined)
  const profileConfidence = externalProfile?.match_confidence ?? externalProfile?.confidence ?? intelligenceConf ?? null
  const syncedLabel = formatShortDate(externalProfile?.synced_at)

  const modifyInitialValues: Record<string, unknown> = {
    name: coach.name ?? '',
    preferred_name: coach.preferred_name ?? '',
    nationality: coach.nationality ?? '',
    base_location: coach.base_location ?? '',
    languages: coach.languages ?? [],
    availability_status: coach.availability_status ?? '',
    market_status: coach.market_status ?? '',
    compensation_expectation: coach.compensation_expectation ?? '',
    agent_name: coach.agent_name ?? '',
    agent_contact: coach.agent_contact ?? '',
    due_diligence_summary: coach.due_diligence_summary ?? '',
  }

  const handleModifySave = async (payload: Record<string, unknown>) => {
    const result = await updateCoachCoreAction(coachId, payload)
    if (!result.ok) {
      toastError(result.error)
      return { ok: false, error: result.error }
    }
    toastSuccess('Profile updated')
    setModifyOpen(false)
    return { ok: true }
  }

  return (
    <header className="w-full bg-card/80 border-b border-border px-6 py-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div
            className="h-16 w-16 shrink-0 rounded-2xl border border-border bg-muted bg-cover bg-center shadow-sm"
            style={externalProfile?.photo_url ? { backgroundImage: `url(${externalProfile.photo_url})` } : undefined}
            aria-label={externalProfile?.photo_url ? `${name} profile photo` : undefined}
          >
            {!externalProfile?.photo_url && (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
                {name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">{name}</h1>
              <span className={cn('rounded-md border px-2.5 py-1 text-[10px] font-medium', scoreBadgeClass(profileConfidence))}>
                Profile confidence {formatScore(profileConfidence)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {[role, currentClub].filter(Boolean).join(' at ') || 'Role and club context pending'}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {availability && (
                <span className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
                  {availability}
                </span>
              )}
              {marketStatus && (
                <span className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
                  {marketStatus}
                </span>
              )}
              {nationality && (
                <span className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
                  {nationality}
                </span>
              )}
              {age != null && (
                <span className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
                  Age {age}
                </span>
              )}
              {baseLocation && (
                <span className="text-xs text-muted-foreground">{baseLocation}</span>
              )}
              {externalProfile?.source_name && (
                <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-600 dark:text-blue-400">
                  {externalProfile.source_name}{syncedLabel ? ` synced ${syncedLabel}` : ' source linked'}
                </span>
              )}
            </div>
          {dataCoverage && (dataCoverage.signalsCount > 0 || dataCoverage.sourcesCount > 0) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground mt-0.5">
              <span className="font-medium text-muted-foreground/90">Data coverage</span>
              <span>{dataCoverage.signalsCount} signals</span>
              <span>{dataCoverage.sourcesCount} sources</span>
              <span>
                {dataCoverage.lastUpdate
                  ? (() => {
                      const days = Math.floor((Date.now() - new Date(dataCoverage.lastUpdate).getTime()) / (24 * 60 * 60 * 1000))
                      return `last update ${days} day${days !== 1 ? 's' : ''} ago`
                    })()
                  : '—'}
              </span>
            </div>
          )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'rounded-md border px-3 py-1 text-sm font-medium tabular-nums',
                scoreBadgeClass(overallScore)
              )}
              title="Overall manual score"
            >
              {formatScore(overallScore)}
            </span>
            <span
              className={cn(
                'rounded-md border px-3 py-1 text-sm font-medium tabular-nums',
                scoreBadgeClass(intelligenceConf)
              )}
              title="Intelligence confidence"
            >
              IC {formatScore(intelligenceConf)}
            </span>
            {intelligenceItemCount === 0 ? (
              <span className="text-[10px] text-muted-foreground">No intelligence coverage</span>
            ) : lastIntelligenceAt ? (() => {
              const days = Math.floor((Date.now() - new Date(lastIntelligenceAt).getTime()) / (24 * 60 * 60 * 1000))
              return (
                <span className="text-[10px] text-muted-foreground" title="Recency of intelligence">
                  Last intelligence update: {days} days ago{days > 90 ? (
                    <span className="text-amber-600 dark:text-amber-400"> · Coverage aging</span>
                  ) : null}
                </span>
              )
            })() : (
              <span className="text-[10px] text-muted-foreground">No intelligence coverage</span>
            )}
          </div>
          <div className="flex flex-col gap-0.5 min-w-[80px]">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/60 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, completenessPercent))}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">Profile completeness</span>
            <span className="text-[10px] text-muted-foreground">
              {dataGapsLabel({ stintCount, intelligenceCount, staffNetworkCount, completenessPercent })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span title="Linked records with confidence set">Evidence: {evidenceCoverage}</span>
            <span title="Linked records verified">Verified: {verifiedCoverage}</span>
          </div>
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium',
              profileAuditStatus === 'complete'
                ? 'border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
            )}
            title={`Profile audit: ${PROFILE_AUDIT_LABEL[profileAuditStatus] ?? 'Complete'}`}
          >
            {profileAuditStatus === 'complete' ? (
              <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{PROFILE_AUDIT_LABEL[profileAuditStatus] ?? 'Complete'}</span>
          </div>
          <div className="flex items-center gap-2">
            <EditCoachDrawer
              title="Modify profile"
              triggerLabel="Modify profile"
              fields={MODIFY_PROFILE_FIELDS}
              initialValues={modifyInitialValues}
              onSave={handleModifySave}
              open={modifyOpen}
              onOpenChange={setModifyOpen}
              renderTrigger={false}
            />
            <button
              type="button"
              onClick={toggleWatchlist}
              disabled={watchlistPending}
              className={cn(
                'inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                watchlist ? 'border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'border border-border bg-surface text-muted-foreground hover:text-foreground'
              )}
              title={watchlist ? 'On watchlist' : 'Add to watchlist'}
            >
              <Star className={cn('w-3.5 h-3.5', watchlist && 'fill-current')} />
            </button>
            <button
              type="button"
              onClick={() => setModifyOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              Modify profile
            </button>
            <Link
              href={`/coaches/${coachId}/fit`}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface/80 transition-colors"
            >
              Preview mandate fit
            </Link>
            <button
              type="button"
              onClick={() => setIntelligenceOpen(true)}
              className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface/50 transition-colors"
            >
              Add intelligence
            </button>
            <button
              type="button"
              onClick={() => {
                const ids = addCoachToCompareIds(coachId)
                router.push(`/coaches/compare?ids=${encodeURIComponent(ids.join(','))}`)
              }}
              className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-transparent hover:bg-surface/30 transition-colors"
            >
              Add to compare
            </button>
            <button
              type="button"
              onClick={() => {
                window.open(`/coaches/${coachId}/export/dossier`, '_blank', 'noopener,noreferrer')
                toastSuccess('Dossier opened in new window. Use Print to PDF to save.')
              }}
              className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface/30 transition-colors gap-1.5"
              title="Export Coach Dossier PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              Export dossier
            </button>
            <AddIntelligenceDrawer
              coachId={coachId}
              open={intelligenceOpen}
              onClose={() => setIntelligenceOpen(false)}
              onSuccess={() => router.refresh()}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
