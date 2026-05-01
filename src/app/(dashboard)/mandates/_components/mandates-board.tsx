'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, GripVertical, MoreVertical, Eye, Pencil, UserPlus, ArrowRight, LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { STAGES, getStageLabel, getStageIndex, isValidPipelineStage, normaliseStage } from '@/lib/constants/mandateStages'
import { updateMandateStageAction } from '../actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import type { BoardSignal } from '@/lib/db/mandate'

/** Mandate health: visual only. Green = strong longlist depth, Amber = thin shortlist, Red = low match confidence. */
function mandateHealth(shortlistCount: number): 'green' | 'amber' | 'red' {
  if (shortlistCount >= 5) return 'green'
  if (shortlistCount >= 1) return 'amber'
  return 'red'
}

export type MandateForBoard = {
  id: string
  status: string
  priority: string
  pipeline_stage: string | null
  budget_band: string
  strategic_objective?: string | null
  tactical_model_required?: string | null
  pressing_intensity_required?: string | null
  build_preference_required?: string | null
  leadership_profile_required?: string | null
  succession_timeline?: string | null
  target_completion_date?: string | null
  custom_club_name?: string | null
  clubs: { name: string | null } | null
  mandate_shortlist?: { id: string; candidate_stage: string }[] | null
  signal?: BoardSignal | null
}

const SCORING_FIELDS = [
  'strategic_objective',
  'tactical_model_required',
  'pressing_intensity_required',
  'build_preference_required',
  'leadership_profile_required',
  'budget_band',
  'succession_timeline',
] as const

type ScoringField = typeof SCORING_FIELDS[number]

function mandateCompleteness(m: MandateForBoard): { pct: number; missing: number } {
  const filled = SCORING_FIELDS.filter((k: ScoringField) => {
    const v = m[k]
    return typeof v === 'string' && v.trim().length > 0
  }).length
  return { pct: Math.round((filled / SCORING_FIELDS.length) * 100), missing: SCORING_FIELDS.length - filled }
}

function shortlistCount(m: MandateForBoard): number {
  const list = m.mandate_shortlist
  return Array.isArray(list) ? list.length : 0
}

function shortlistedCount(m: MandateForBoard): number {
  const list = m.mandate_shortlist
  if (!Array.isArray(list)) return 0
  return list.filter((e) => ['Shortlist', 'Interview', 'Final'].includes(e.candidate_stage)).length
}

function formatTargetDate(value: string | null | undefined): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function formatUrgency(value: string | null | undefined): { label: string; cls: string } {
  if (!value) return { label: 'No target date', cls: 'text-muted-foreground bg-surface border-border' }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(value)
  target.setHours(0, 0, 0, 0)
  const days = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, cls: 'text-red-400 bg-red-400/10 border-red-400/20' }
  if (days <= 7) return { label: 'This week', cls: 'text-red-400 bg-red-400/10 border-red-400/20' }
  if (days <= 21) return { label: `${days}d window`, cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20' }
  return { label: `${days}d runway`, cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' }
}

function shortlistStrength(count: number, shortlisted: number): { label: string; cls: string } {
  if (shortlisted >= 3 || count >= 5) return { label: 'Strong shortlist', cls: 'text-emerald-400' }
  if (shortlisted >= 1 || count >= 2) return { label: 'Needs depth', cls: 'text-amber-400' }
  return { label: 'No credible depth', cls: 'text-red-400' }
}

function mainRisk(m: MandateForBoard, count: number, missing: number, hasRiskConcern: boolean): { label: string; cls: string } {
  const urgency = formatUrgency(m.target_completion_date)
  if (urgency.label.includes('overdue')) return { label: 'Target date slipped', cls: 'text-red-400' }
  if (count === 0 && !['identified', 'board_approved'].includes(m.pipeline_stage ?? '')) return { label: 'Shortlist missing', cls: 'text-red-400' }
  if (hasRiskConcern) return { label: 'Candidate risk flagged', cls: 'text-red-400' }
  if (missing > 0) return { label: 'Brief incomplete', cls: 'text-amber-400' }
  if (count < 2) return { label: 'Thin market evidence', cls: 'text-amber-400' }
  return { label: 'No major blocker', cls: 'text-emerald-400' }
}

function nextActionLabel(m: MandateForBoard, count: number, shortlisted: number, missing: number, topCoach: BoardSignal['topCoach'] | null) {
  if (missing > 0) return 'Complete brief'
  if (!topCoach) return 'Score market'
  if (count === 0) return 'Add candidates'
  if (shortlisted < 2) return 'Build shortlist'
  if (['interviews', 'final_2', 'offer'].includes(m.pipeline_stage ?? '')) return 'Prepare board view'
  return 'Open workspace'
}

function availDot(status: string | null) {
  if (status === 'Available') return 'bg-emerald-400'
  if (status === 'Open to offers' || status === 'Under contract - interested') return 'bg-amber-400'
  if (status === 'Under contract') return 'bg-blue-400'
  return 'bg-muted-foreground/30'
}

function decisionClarity(rank1: number, rank2: number | null): { label: string; cls: string } | null {
  if (rank2 === null) return null
  const delta = rank1 - rank2
  if (delta < 3) return { label: 'Too close to call', cls: 'text-muted-foreground bg-muted/40 border-border' }
  if (delta < 9) return { label: 'Marginal decision', cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20' }
  if (delta < 15) return { label: 'Preferred option', cls: 'text-orange-400 bg-orange-400/10 border-orange-400/20' }
  return { label: 'Clear leader', cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' }
}

const STATUS_OPTIONS = ['All', 'Active', 'In Progress', 'Completed', 'On Hold'] as const

type FilterState = {
  search: string
  highPriorityOnly: boolean
  hasShortlistOnly: boolean
  status: string
}

function filterMandates(mandates: MandateForBoard[], filters: FilterState): MandateForBoard[] {
  return mandates.filter((m) => {
    const clubName = (m.custom_club_name ?? m.clubs?.name ?? '').toLowerCase()
    if (filters.search.trim() && !clubName.includes(filters.search.trim().toLowerCase())) return false
    if (filters.highPriorityOnly && m.priority !== 'High') return false
    if (filters.hasShortlistOnly && shortlistCount(m) === 0) return false
    if (filters.status !== 'All' && m.status !== filters.status) return false
    return true
  })
}

// ---------------------------------------------------------------------------
function canMoveToStage(mandate: MandateForBoard, toStageKey: string): { allowed: boolean; reason?: string } {
  if (process.env.NODE_ENV === 'development' && false) {
    console.info('canMoveToStage', mandate.id, toStageKey)
  }
  return { allowed: true }
}

type Props = {
  initialMandates: MandateForBoard[]
}

const COLUMN_WIDTH = 272

export function MandatesBoard({ initialMandates }: Props) {
  const [mandates, setMandates] = useState(initialMandates)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const menuRef = useRef<HTMLDivElement>(null)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    highPriorityOnly: false,
    hasShortlistOnly: false,
    status: 'All',
  })

  const totalMandates = mandates.length
  const activeCount = mandates.filter((m) => m.status === 'Active' || m.status === 'In Progress').length
  const closedCount = mandates.filter((m) => m.status === 'Completed').length
  const avgTimeToHire = null as number | null
  const avgMandateFitOfHires = null as number | null

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = filterMandates(mandates, filters)
  const defaultKey = STAGES[0].key
  const byStage = STAGES.reduce(
    (acc, stage) => {
      acc[stage.key] = filtered.filter((m) => (m.pipeline_stage ?? defaultKey) === stage.key)
      return acc
    },
    {} as Record<string, MandateForBoard[]>
  )

  const handleDragStart = useCallback((e: React.DragEvent, mandateId: string, stage: string) => {
    setDraggingId(mandateId)
    setOpenMenuId(null)
    e.dataTransfer.setData('mandateId', mandateId)
    e.dataTransfer.setData('fromStage', stage)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
    setDragOverStage(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, stage: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stage)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverStage(null)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent, destinationColumnKey: string) => {
      e.preventDefault()
      setDragOverStage(null)
      const mandateId = e.dataTransfer.getData('mandateId')
      const fromStage = e.dataTransfer.getData('fromStage')
      if (!mandateId || fromStage === destinationColumnKey) return

      const stageToWrite = normaliseStage(destinationColumnKey)
      if (!isValidPipelineStage(stageToWrite)) {
        toastError('Invalid stage')
        return
      }

      const mandate = mandates.find((m) => m.id === mandateId)
      if (mandate) {
        const { allowed, reason } = canMoveToStage(mandate, stageToWrite)
        if (!allowed) {
          toastError(reason ?? 'Cannot move to this stage')
          return
        }
      }

      setMandates((prev) =>
        prev.map((m) => (m.id === mandateId ? { ...m, pipeline_stage: stageToWrite } : m))
      )

      const { error } = await updateMandateStageAction(mandateId, stageToWrite)
      if (error) {
        toastError(error)
        setMandates((prev) =>
          prev.map((m) => (m.id === mandateId ? { ...m, pipeline_stage: fromStage } : m))
        )
        return
      }
      toastSuccess(`Moved to ${getStageLabel(stageToWrite)}`)
    },
    [mandates]
  )

  const handleMoveToNextStage = useCallback(
    async (mandate: MandateForBoard) => {
      setOpenMenuId(null)
      const currentKey = mandate.pipeline_stage ?? STAGES[0].key
      const currentIndex = getStageIndex(currentKey)
      const nextIndex = Math.min(currentIndex + 1, STAGES.length - 1)
      const nextKey = STAGES[nextIndex].key
      if (nextKey === currentKey) return
      const { allowed, reason } = canMoveToStage(mandate, nextKey)
      if (!allowed) {
        toastError(reason ?? 'Cannot move to next stage')
        return
      }
      setMandates((prev) =>
        prev.map((m) => (m.id === mandate.id ? { ...m, pipeline_stage: nextKey } : m))
      )
      const { error } = await updateMandateStageAction(mandate.id, nextKey)
      if (error) {
        toastError(error)
        setMandates((prev) =>
          prev.map((m) => (m.id === mandate.id ? { ...m, pipeline_stage: currentKey } : m))
        )
        return
      }
      toastSuccess(`Moved to ${getStageLabel(nextKey)}`)
    },
    []
  )

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* KPI strip */}
      <div className="flex flex-wrap items-center gap-6 py-2.5 px-1 border-b border-border bg-card/30 shrink-0 text-xs">
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{totalMandates}</span> Total
        </span>
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{activeCount}</span> Active
        </span>
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{closedCount}</span> Closed
        </span>
        <span className="text-muted-foreground">
          Avg time to hire: <span className="font-medium text-foreground">{avgTimeToHire != null ? `${avgTimeToHire}d` : '—'}</span>
        </span>
        <span className="text-muted-foreground">
          Avg mandate fit (hires): <span className="font-medium text-foreground">{avgMandateFitOfHires != null ? `${avgMandateFitOfHires}%` : '—'}</span>
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('board')}
            className={cn(
              'p-1.5 rounded-md border transition-colors',
              viewMode === 'board' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface text-muted-foreground hover:text-foreground'
            )}
            aria-label="View as board"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              'p-1.5 rounded-md border transition-colors',
              viewMode === 'list' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface text-muted-foreground hover:text-foreground'
            )}
            aria-label="View as list"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 py-3 px-1 border-b border-border bg-card/50 shrink-0">
        <input
          type="search"
          placeholder="Search by club name"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="h-8 w-48 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.highPriorityOnly}
            onChange={(e) => setFilters((f) => ({ ...f, highPriorityOnly: e.target.checked }))}
            className="rounded border-border bg-surface text-primary focus:ring-primary/30"
          />
          <span className="text-xs text-muted-foreground">High priority only</span>
        </label>
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hasShortlistOnly}
            onChange={(e) => setFilters((f) => ({ ...f, hasShortlistOnly: e.target.checked }))}
            className="rounded border-border bg-surface text-primary focus:ring-primary/30"
          />
          <span className="text-xs text-muted-foreground">Has shortlist only</span>
        </label>
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s === 'All' ? 'All' : s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Board or List */}
      {viewMode === 'list' ? (
        <div className="flex-1 min-h-0 overflow-y-auto pt-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No mandates match this search view. Clear a filter to bring the search desk back into focus.
            </div>
          ) : (
            filtered.map((m) => (
              <MandateCard
                key={m.id}
                mandate={m}
                isDragging={false}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onMoveToNextStage={handleMoveToNextStage}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                menuRef={menuRef}
                showHealth
                compact={true}
              />
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 gap-3 pt-3 overflow-x-auto overflow-y-hidden">
          {STAGES.map((stage) => (
            <div
              key={stage.key}
              onDragOver={(e) => handleDragOver(e, stage.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.key)}
              className={cn(
                'flex flex-col shrink-0 rounded-md border transition-colors bg-surface/50',
                dragOverStage === stage.key ? 'border-primary bg-primary/5' : 'border-border'
              )}
              style={{ width: COLUMN_WIDTH }}
            >
              <div className="shrink-0 sticky top-0 z-10 px-3 py-2.5 border-b border-border flex items-center justify-between rounded-t-md bg-card/80">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground">
                  {stage.label} ({byStage[stage.key]?.length ?? 0})
                </h3>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
                {(byStage[stage.key] ?? []).length === 0 ? (
                  <Link
                    href="/mandates/new"
                    className="flex flex-col items-center justify-center min-h-[140px] rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-center p-4"
                  >
                    <Plus className="w-6 h-6 text-muted-foreground/50 mb-1" />
                    <span className="text-xs font-medium text-muted-foreground">No searches here</span>
                    <span className="mt-1 text-[10px] text-muted-foreground/70">Add a mandate when a club brief enters this stage.</span>
                  </Link>
                ) : (
                  (byStage[stage.key] ?? []).map((m) => (
                    <MandateCard
                      key={m.id}
                      mandate={m}
                      isDragging={draggingId === m.id}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onMoveToNextStage={handleMoveToNextStage}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      menuRef={menuRef}
                      showHealth
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MandateCard({
  mandate,
  isDragging,
  onDragStart,
  onDragEnd,
  onMoveToNextStage,
  openMenuId,
  setOpenMenuId,
  menuRef,
  showHealth = false,
  compact = false,
}: {
  mandate: MandateForBoard
  isDragging: boolean
  onDragStart: (e: React.DragEvent, id: string, stage: string) => void
  onDragEnd: () => void
  onMoveToNextStage: (mandate: MandateForBoard) => void
  openMenuId: string | null
  setOpenMenuId: (id: string | null) => void
  menuRef: React.RefObject<HTMLDivElement>
  showHealth?: boolean
  compact?: boolean
}) {
  const router = useRouter()
  const stageKey = mandate.pipeline_stage ?? STAGES[0].key
  const count = shortlistCount(mandate)
  const shortlisted = shortlistedCount(mandate)
  const health = mandateHealth(count)
  const currentIndex = getStageIndex(stageKey)
  const hasNextStage = currentIndex < STAGES.length - 1
  const clubName = mandate.custom_club_name ?? mandate.clubs?.name ?? 'Unknown club'
  const { pct: completeness, missing } = mandateCompleteness(mandate)
  const completenessLabel = missing === 0 ? 'Complete' : missing <= 3 ? 'Partial' : 'Needs update'
  const completenessBadgeClass =
    completeness >= 86
      ? 'bg-green-500/15 text-green-400 border-green-500/30'
      : completeness >= 50
        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
        : 'bg-red-500/15 text-red-400 border-red-500/30'

  const priorityStripClass =
    mandate.priority === 'High'
      ? 'bg-red-500'
      : mandate.priority === 'Medium'
        ? 'bg-amber-500'
        : 'bg-muted-foreground/30'

  const cardRef = useRef<HTMLDivElement>(null)

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-drag-handle]') || (e.target as HTMLElement).closest('[data-menu-trigger]')) return
    router.push(`/mandates/${mandate.id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!(e.target as HTMLElement).closest('[data-drag-handle]') && !(e.target as HTMLElement).closest('[data-menu-trigger]')) {
        router.push(`/mandates/${mandate.id}`)
      }
    }
  }

  const handleHandleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('mandateId', mandate.id)
    e.dataTransfer.setData('fromStage', stageKey)
    if (cardRef.current) e.dataTransfer.setDragImage(cardRef.current, 0, 0)
    onDragStart(e, mandate.id, stageKey)
  }

  const healthDotClass =
    health === 'green' ? 'bg-green-500' : health === 'amber' ? 'bg-amber-500' : 'bg-red-500/80'

  // Signal layer
  const sig = mandate.signal ?? null
  const topCoach = sig?.topCoach ?? null
  const clarity = topCoach ? decisionClarity(topCoach.score, sig?.secondScore ?? null) : null
  const hasIeFlags = (topCoach?.ieFlags?.length ?? 0) > 0
  const hasRiskConcern = topCoach?.hasRiskConcern ?? false
  const roleLabel = mandate.strategic_objective?.match(/\b(sporting director|technical director|head coach|manager|first team coach)\b/i)?.[0] ?? 'Head coach search'
  const urgency = formatUrgency(mandate.target_completion_date)
  const strength = shortlistStrength(count, shortlisted)
  const primaryRisk = mainRisk(mandate, count, missing, hasRiskConcern)
  const nextAction = nextActionLabel(mandate, count, shortlisted, missing, topCoach)

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'card-surface rounded-lg border border-border p-0 hover:border-primary/30 transition-all flex cursor-pointer',
        compact ? 'min-h-0' : 'min-h-[148px]',
        isDragging && 'opacity-90 scale-105 shadow-lg ring-2 ring-primary/40'
      )}
    >
      <div className={cn('w-0.5 shrink-0 self-stretch', priorityStripClass)} aria-hidden />
      <div className={cn('flex-1 min-w-0 flex items-start gap-2 overflow-visible', compact ? 'p-2' : 'p-3')}>
        {!compact && (
          <span
            data-drag-handle
            draggable
            onDragStart={handleHandleDragStart}
            onDragEnd={onDragEnd}
            className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground shrink-0 touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </span>
        )}
        <div className="flex-1 min-w-0">
          {/* Row 1: health dot + name + priority + status + completeness */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {showHealth && (
              <span
                className={cn('w-2 h-2 rounded-full shrink-0', healthDotClass)}
                title={health === 'green' ? 'Strong longlist depth' : health === 'amber' ? 'Thin shortlist' : 'Low match confidence'}
                aria-hidden
              />
            )}
            <span className="text-[13px] font-semibold text-foreground truncate block" title={clubName}>
              {clubName}
            </span>
            <Badge variant={mandate.priority === 'High' ? 'danger' : 'outline'} className="text-[9px] shrink-0">
              {mandate.priority}
            </Badge>
            <Badge variant="secondary" className="text-[9px] shrink-0">
              {mandate.status}
            </Badge>
            <Link
              href={`/mandates/${mandate.id}/edit`}
              onClick={(e) => e.stopPropagation()}
              title={missing === 0 ? 'Mandate spec complete' : `${missing} field${missing > 1 ? 's' : ''} missing — click to fill in`}
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-medium shrink-0 leading-none',
                completenessBadgeClass
              )}
            >
              {completenessLabel}
              {missing > 0 && <span className="opacity-70">({missing})</span>}
            </Link>
          </div>

          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {roleLabel}
          </p>

          {/* Row 2: top candidate (if scored) */}
          {topCoach ? (
            <div className="flex items-center gap-1.5 mb-1 min-w-0">
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', availDot(topCoach.availStatus))} />
              <span className="text-[11px] font-medium text-foreground truncate flex-1">
                {topCoach.name ?? 'Unknown'}
              </span>
              <span className={cn(
                'text-[11px] font-bold tabular-nums shrink-0',
                topCoach.score >= 70 ? 'text-emerald-400' : topCoach.score >= 50 ? 'text-amber-400' : 'text-red-400'
              )}>
                {topCoach.score}
              </span>
              {clarity && (
                <span className={cn('text-[9px] font-medium px-1 py-0.5 rounded border shrink-0', clarity.cls)}>
                  {clarity.label}
                </span>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground/50 mb-1 italic">Not scored yet</p>
          )}

          {/* Row 3: fit label (dimmed) */}
          {topCoach?.fitLabel && (
            <p className="text-[10px] text-muted-foreground leading-snug mb-1 truncate">
              {topCoach.fitLabel}
            </p>
          )}

          {/* Row 4: decision summary */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="rounded border border-border bg-surface/60 px-2 py-1.5">
              <p className="text-muted-foreground">Urgency</p>
              <p className={cn('mt-0.5 inline-flex rounded border px-1.5 py-0.5 font-semibold', urgency.cls)}>{urgency.label}</p>
            </div>
            <div className="rounded border border-border bg-surface/60 px-2 py-1.5">
              <p className="text-muted-foreground">Shortlist</p>
              <p className={cn('mt-0.5 font-semibold', strength.cls)}>{strength.label}</p>
            </div>
            <div className="rounded border border-border bg-surface/60 px-2 py-1.5">
              <p className="text-muted-foreground">Main risk</p>
              <p className={cn('mt-0.5 truncate font-semibold', primaryRisk.cls)}>{primaryRisk.label}</p>
            </div>
            <div className="rounded border border-border bg-surface/60 px-2 py-1.5">
              <p className="text-muted-foreground">Next action</p>
              <p className="mt-0.5 truncate font-semibold text-foreground">{nextAction}</p>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
            <span>
              <span className="font-medium text-foreground">{count}</span> in pipeline
              {shortlisted > 0 && (
                <> · <span className="font-medium text-foreground">{shortlisted}</span> shortlisted</>
              )}
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span>Target: {formatTargetDate(mandate.target_completion_date)}</span>
          </div>

          {/* Row 5: intel/risk badges */}
          {(hasIeFlags || hasRiskConcern) && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {hasRiskConcern && (
                <span className="text-[9px] px-1.5 py-0.5 rounded border border-red-500/20 bg-red-500/10 text-red-400 font-medium">
                  Risk flagged
                </span>
              )}
              {hasIeFlags && (
                <span className="text-[9px] px-1.5 py-0.5 rounded border border-muted bg-muted/20 text-muted-foreground font-medium">
                  Low intel coverage
                </span>
              )}
            </div>
          )}

          {/* Bottom bar: stage label + menu */}
          <div className="flex items-center justify-between gap-1 mt-2 shrink-0">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {getStageLabel(stageKey)}
            </span>
            <div className="relative shrink-0 z-[1]" ref={openMenuId === mandate.id ? menuRef : undefined}>
              <button
                type="button"
                data-menu-trigger
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setOpenMenuId(openMenuId === mandate.id ? null : mandate.id)
                }}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface-overlay/50"
                aria-label="Actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {openMenuId === mandate.id && (
                <div className="absolute right-0 top-full mt-0.5 py-1 min-w-[140px] rounded-md border border-border bg-card shadow-lg z-[100]">
                  <Link
                    href={`/mandates/${mandate.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-surface-overlay/50"
                    onClick={() => setOpenMenuId(null)}
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </Link>
                  <Link
                    href={`/mandates/${mandate.id}/edit`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-surface-overlay/50"
                    onClick={() => setOpenMenuId(null)}
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </Link>
                  <Link
                    href={`/mandates/${mandate.id}#shortlist`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-surface-overlay/50"
                    onClick={() => setOpenMenuId(null)}
                  >
                    <UserPlus className="w-3 h-3" />
                    Add shortlist
                  </Link>
                  <button
                    type="button"
                    disabled={!hasNextStage}
                    onClick={(e) => { e.stopPropagation(); onMoveToNextStage(mandate) }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left text-foreground hover:bg-surface-overlay/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Move to next stage
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
