'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, GripVertical, MoreVertical, Eye, Pencil, UserPlus, ArrowRight, LayoutGrid, List, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { STAGES, getStageLabel, getStageIndex, isValidPipelineStage, normaliseStage } from '@/lib/constants/mandateStages'
import { DeleteMandateDialog, type DeleteMandateOperation } from '@/components/mandates/delete-mandate-dialog'
import { updateMandateStageAction } from '../actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import type { BoardSignal } from '@/lib/db/mandate'
import { displayClubName } from '@/lib/display-names'
import { SERVICE_MODEL_LABELS, isServiceModel } from '@/lib/mandates/appointment-plan'
import type { AppointmentNextAction } from '@/lib/mandates/appointment-next-action'

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
  service_model: string
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
  nextAction?: AppointmentNextAction['nextAction'] | null
  briefCompleteness?: AppointmentNextAction['brief'] | null
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
  if (shortlisted >= 3 || count >= 5) return { label: 'Candidates recorded', cls: 'text-emerald-400' }
  if (shortlisted >= 1 || count >= 2) return { label: 'Needs depth', cls: 'text-amber-400' }
  return { label: 'No credible depth', cls: 'text-red-400' }
}

function mainRisk(m: MandateForBoard, count: number, missing: number, hasRiskConcern: boolean): { label: string; cls: string } {
  const urgency = formatUrgency(m.target_completion_date)
  const brief = `${m.strategic_objective ?? ''}`.toLowerCase()
  if (urgency.label.includes('overdue')) return { label: 'Target date slipped', cls: 'text-red-400' }
  if (count === 0 && !['identified', 'board_approved'].includes(m.pipeline_stage ?? '')) return { label: 'Shortlist missing', cls: 'text-red-400' }
  if (hasRiskConcern) return { label: 'Candidate risk flagged', cls: 'text-red-400' }
  if (missing > 0) return { label: 'Brief incomplete', cls: 'text-amber-400' }
  if (count < 2) return { label: 'Thin market evidence', cls: 'text-amber-400' }
  if (/player trading|trading|identity|progressive|resale|future value/.test(brief)) return { label: 'Availability and timing', cls: 'text-amber-400' }
  if (/academy|pathway|development|player value|player growth|young/.test(brief)) return { label: 'Development validation', cls: 'text-amber-400' }
  if (/promotion|stability|league one|efl|efficiency|reliability/.test(brief)) return { label: 'Contract realism', cls: 'text-amber-400' }
  return { label: 'Validation pending', cls: 'text-amber-400' }
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

type Props = {
  initialMandates: MandateForBoard[]
  moveAction?: typeof updateMandateStageAction
  deleteAction?: DeleteMandateOperation
}

const COLUMN_WIDTH = 272

export function MandatesBoard({ initialMandates, moveAction = updateMandateStageAction, deleteAction }: Props) {
  const router = useRouter()
  const pendingIds = useRef(new Set<string>())
  const [savingIds, setSavingIds] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<MandateForBoard | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const [mandates, setMandates] = useState(initialMandates)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  useEffect(() => { if (window.matchMedia('(max-width: 640px)').matches) setViewMode('list') }, [])
  const menuRef = useRef<HTMLDivElement>(null)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    highPriorityOnly: false,
    hasShortlistOnly: false,
    status: 'All',
  })

  useEffect(() => {
    setMandates(current => initialMandates.map(incoming => pendingIds.current.has(incoming.id) ? current.find(m => m.id === incoming.id) ?? incoming : incoming))
  }, [initialMandates])

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
    if (pendingIds.current.has(mandateId)) { e.preventDefault(); return }
    setDraggingId(mandateId)
    setOpenMenuId(null)
    e.dataTransfer.setData('mandateId', mandateId)
    e.dataTransfer.setData('text/plain', mandateId)
    e.dataTransfer.setData('fromStage', stage)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
    setDragOverStage(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, stage: string) => {
    if (!draggingId) return
    e.preventDefault()
    const board = boardRef.current
    if (board) {
      const bounds = board.getBoundingClientRect()
      if (e.clientX > bounds.right - 64) board.scrollLeft += 24
      else if (e.clientX < bounds.left + 64) board.scrollLeft -= 24
    }
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stage)
  }, [draggingId])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!(e.relatedTarget instanceof Node) || !e.currentTarget.contains(e.relatedTarget)) setDragOverStage(null)
  }, [])

  const handleMoveToStage = useCallback(async (mandate: MandateForBoard, destination: string) => {
    const stage = normaliseStage(destination)
    if (!isValidPipelineStage(stage) || pendingIds.current.has(mandate.id)) return
    const original = mandate.pipeline_stage
    if (stage === (original ?? STAGES[0].key)) return
    pendingIds.current.add(mandate.id)
    setSavingIds([...pendingIds.current])
    setOpenMenuId(null)
    setMandates(current => current.map(m => m.id === mandate.id ? { ...m, pipeline_stage: stage } : m))
    let moved = false
    try {
      const result = await moveAction(mandate.id, stage, original)
      if (result.error) throw new Error(result.error)
      moved = true
      toastSuccess(`Moved to ${getStageLabel(stage)}`)
    } catch (error) {
      setMandates(current => current.map(m => m.id === mandate.id ? { ...m, pipeline_stage: original } : m))
      toastError(error instanceof Error ? error.message : 'Move could not be saved. The card has returned to its previous stage.')
    } finally {
      pendingIds.current.delete(mandate.id)
      setSavingIds([...pendingIds.current])
      // A refresh also reconciles a stale edit or a response lost after a committed write.
      router.refresh()
    }
    return moved
  }, [moveAction, router])

  const handleDrop = useCallback((e: React.DragEvent, destination: string) => {
    e.preventDefault()
    const mandateId = e.dataTransfer.getData('mandateId')
    const mandate = mandates.find(m => m.id === mandateId)
    setDraggingId(null)
    setDragOverStage(null)
    if (mandate && mandateId === draggingId) void handleMoveToStage(mandate, destination)
  }, [mandates, draggingId, handleMoveToStage])

  const handleMoveToNextStage = useCallback((mandate: MandateForBoard) => {
    const index = getStageIndex(mandate.pipeline_stage)
    if (index < STAGES.length - 1) void handleMoveToStage(mandate, STAGES[index + 1].key)
  }, [handleMoveToStage])

  const requestDelete = (mandate: MandateForBoard) => {
    if (pendingIds.current.has(mandate.id)) return
    setOpenMenuId(null)
    setDeleteTarget(mandate)
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {deleteTarget && <DeleteMandateDialog mandateId={deleteTarget.id} name={displayClubName(deleteTarget.custom_club_name, deleteTarget.clubs?.name)} action={deleteAction}
        onClose={() => setDeleteTarget(null)} onDeleted={() => { setMandates(current => current.filter(m => m.id !== deleteTarget.id)); setDeleteTarget(null); toastSuccess('Mandate deleted'); router.refresh() }} />}
      <p className="px-1 py-2 text-xs text-muted-foreground">Drag a card into a stage, or use its stage selector. Use the bin to delete a test run.</p>
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
      <div className="flex flex-wrap items-center gap-4 py-4 border-b border-border shrink-0">
        <input
          type="search"
          placeholder="Search by club name"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="h-10 w-60 rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
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
          className="h-10 rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
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
                onMoveToStage={handleMoveToStage}
                onDelete={requestDelete}
                isSaving={savingIds.includes(m.id)}
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
        <div ref={boardRef} className="flex flex-1 min-h-0 gap-3 pt-3 overflow-x-auto overflow-y-hidden">
          {STAGES.map((stage) => (
            <div
              key={stage.key}
              data-stage={stage.key}
              aria-label={`${stage.label} stage`}
              onDragOver={(e) => handleDragOver(e, stage.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.key)}
              className={cn(
                'flex flex-col shrink-0 rounded-xl border transition-colors bg-muted/40',
                dragOverStage === stage.key ? 'border-primary bg-primary/5' : 'border-border'
              )}
              style={{ width: COLUMN_WIDTH }}
            >
              <div className="shrink-0 sticky top-0 z-10 px-4 py-4 flex items-center justify-between rounded-t-xl bg-background">
                <h3 className="text-xs font-semibold text-foreground">
                  {stage.label} ({byStage[stage.key]?.length ?? 0})
                  {dragOverStage === stage.key && <span className="ml-2 text-primary">Drop here</span>}
                </h3>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
                {(byStage[stage.key] ?? []).length === 0 ? (
                  <Link
                    href="/mandates/new"
                    className="flex flex-col items-center justify-center min-h-[108px] rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-center p-4"
                  >
                    <Plus className="w-6 h-6 text-muted-foreground/50 mb-1" />
                    <span className="text-xs font-medium text-muted-foreground">No searches here</span>
                    <span className="mt-1 text-[10px] text-muted-foreground/70">Add an appointment</span>
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
                onMoveToStage={handleMoveToStage}
                onDelete={requestDelete}
                isSaving={savingIds.includes(m.id)}
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
  onMoveToStage,
  onDelete,
  isSaving,
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
  onMoveToStage: (mandate: MandateForBoard, stage: string) => void
  onDelete: (mandate: MandateForBoard) => void
  isSaving: boolean
  onMoveToNextStage: (mandate: MandateForBoard) => void
  openMenuId: string | null
  setOpenMenuId: (id: string | null) => void
  menuRef: React.RefObject<HTMLDivElement | null>
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
  const clubName = displayClubName(mandate.custom_club_name, mandate.clubs?.name)
  const { pct: completeness, missing } = mandate.briefCompleteness ?? { pct: 0, missing: 7 }
  const completenessLabel = !mandate.briefCompleteness ? 'Brief status unavailable' : missing === 0 ? 'Brief fields recorded' : missing <= 3 ? 'Partial brief' : 'Brief needs update'
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

  const dragFinishedAt = useRef(0)
  const isControl = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('a, button, summary, details, select, input, textarea, [data-drag-handle]'))
  const handleCardClick = (e: React.MouseEvent) => {
    if (isControl(e.target) || isSaving || Date.now() - dragFinishedAt.current < 350) return
    router.push(`/mandates/${mandate.id}/decision`)
  }
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget || isSaving) return
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/mandates/${mandate.id}/decision`) }
  }
  const handleCardDragStart = (e: React.DragEvent) => {
    if (isSaving || compact || (e.target !== e.currentTarget && isControl(e.target))) { e.preventDefault(); return }
    dragFinishedAt.current = Date.now()
    if (cardRef.current) e.dataTransfer.setDragImage(cardRef.current, 20, 20)
    onDragStart(e, mandate.id, stageKey)
  }
  const handleCardDragEnd = () => { dragFinishedAt.current = Date.now(); onDragEnd() }

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
  const nextAction = mandate.nextAction
  const serviceLabel = isServiceModel(mandate.service_model)
    ? SERVICE_MODEL_LABELS[mandate.service_model]
    : SERVICE_MODEL_LABELS.full_service_search

  return (
    <div
      ref={cardRef}
      role="group"
      aria-label={`${clubName} mandate`}
      aria-busy={isSaving}
      draggable={!compact && !isSaving}
      onDragStart={handleCardDragStart}
      onDragEnd={handleCardDragEnd}
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'card-surface overflow-visible rounded-xl border border-border p-0 hover:border-primary/40 hover:shadow-md transition-all flex cursor-pointer',
        compact ? 'min-h-0' : 'min-h-[148px] cursor-grab active:cursor-grabbing',
        isSaving && 'opacity-60',
        isDragging && 'opacity-90 scale-105 shadow-lg ring-2 ring-primary/40'
      )}
    >
      <div className={cn('w-0.5 shrink-0 self-stretch', priorityStripClass)} aria-hidden />
      <div className={cn('flex-1 min-w-0 flex items-start gap-2 overflow-visible', compact ? 'p-4' : 'p-4')}>
        {!compact && (
          <span
            aria-hidden="true"
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
                title={health === 'green' ? 'Longlist count' : health === 'amber' ? 'Few candidates recorded' : 'Low match confidence'}
                aria-hidden
              />
            )}
            <span className="text-base font-semibold text-foreground block leading-snug" title={clubName}>
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
              title={!mandate.briefCompleteness ? 'Refresh to confirm brief status' : missing === 0 ? 'Brief fields recorded; agreement is reviewed separately' : `${missing} brief fields missing or not yet agreed`}
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-medium shrink-0 leading-none',
                completenessBadgeClass
              )}
            >
              {completenessLabel}
              {missing > 0 && <span className="opacity-70">({missing})</span>}
            </Link>
          </div>

          <p className="mb-3 mt-2 text-xs text-muted-foreground">
            {roleLabel} · {serviceLabel}
          </p>

          <div className="mb-3 rounded-lg bg-muted/60 p-3">
            <p className="text-[11px] text-muted-foreground">Next action</p>
            {nextAction ? <>
              <Link href={nextAction.href} className="mt-1 inline-block text-sm font-medium text-primary hover:underline">{nextAction.label}</Link>
              <p className="mt-1 text-xs text-muted-foreground">{nextAction.detail}</p>
              <p className="mt-2 text-xs text-muted-foreground">{nextAction.owner || 'Owner not assigned'} · {nextAction.dueDate ? `Due ${formatTargetDate(nextAction.dueDate)}` : 'No due date recorded'}</p>
            </> : <p className="mt-1 text-xs text-muted-foreground">Next action unavailable. Refresh to confirm appointment access and progress.</p>}
          </div>
          <p className={cn('mb-3 w-fit rounded-md px-2 py-1 text-xs font-medium', urgency.cls)}>{urgency.label}</p>
          <details className="mb-3" onClick={e=>e.stopPropagation()}><summary className="cursor-pointer text-xs text-muted-foreground">Candidate and brief details</summary><div className="mt-3">          {/* Row 2: top candidate (if scored) */}
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
            <p className="text-xs text-muted-foreground/50 mb-1 italic">Not scored yet</p>
          )}

          {/* Row 3: fit label (dimmed) */}
          {topCoach?.fitLabel && (
            <p className="text-xs text-muted-foreground leading-snug mb-1 truncate">
              {topCoach.fitLabel}
            </p>
          )}


          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="py-1">
              <p className="text-muted-foreground">Urgency</p>
              <p className={cn('mt-0.5 inline-flex rounded border px-1.5 py-0.5 font-semibold', urgency.cls)}>{urgency.label}</p>
            </div>
            <div className="py-1">
              <p className="text-muted-foreground">Shortlist</p>
              <p className={cn('mt-0.5 font-semibold', strength.cls)}>{strength.label}</p>
            </div>
            <div className="py-1">
              <p className="text-muted-foreground">Main risk</p>
              <p className={cn('mt-0.5 font-medium', primaryRisk.cls)}>{primaryRisk.label}</p>
            </div>
            <div className="py-1">
              <p className="text-muted-foreground">Next action</p>
              <p className="mt-0.5 font-medium text-foreground">{nextAction?.label ?? 'Unavailable'}</p>
            </div>
          </div>

</div></details>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
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
            <select aria-label={`Stage for ${clubName}`} value={stageKey} disabled={isSaving}
              onChange={e => onMoveToStage(mandate, e.target.value)}
              className="h-9 min-w-0 flex-1 rounded border border-border bg-surface px-1 text-xs text-foreground disabled:opacity-60">
              {STAGES.map(stage => <option key={stage.key} value={stage.key}>{stage.label}</option>)}
            </select>
            <button type="button" disabled={isSaving} onClick={e => { e.stopPropagation(); onDelete(mandate) }} aria-label={`Delete ${clubName} mandate`} title="Delete mandate"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
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
                aria-label={`More actions for ${clubName}`}
                disabled={isSaving}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {openMenuId === mandate.id && (
                <div className="absolute right-0 top-full mt-0.5 py-1 min-w-[140px] rounded-md border border-border bg-card shadow-lg z-[100]">
                  <Link
                    href={`/mandates/${mandate.id}/decision`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-surface-overlay/50"
                    onClick={() => setOpenMenuId(null)}
                  >
                    <Eye className="w-3 h-3" />
                    Open appointment
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
                    href={`/mandates/${mandate.id}/candidates`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-surface-overlay/50"
                    onClick={() => setOpenMenuId(null)}
                  >
                    <UserPlus className="w-3 h-3" />
                    Manage candidates
                  </Link>
                  <button
                    type="button"
                    disabled={!hasNextStage || isSaving}
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
