'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/db'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Radio,
  AlertCircle,
  UserCheck,
  FileSignature,
  RefreshCw,
  Briefcase,
  Signal,
  Loader2,
  TrendingUp,
  Bell,
} from 'lucide-react'
import { IntelligenceItemsFeed } from './_components/intelligence-items-feed'

const CATEGORY_OPTIONS = ['All', 'Media', 'Tactical', 'Legal', 'Staff', 'Performance'] as const
const CONFIDENCE_OPTIONS = ['All', 'High', 'Medium', 'Low'] as const
const RISK_OPTIONS = ['All', 'Low', 'Medium', 'High'] as const

function updateTypeToCategory(updateType: string): string {
  switch (updateType) {
    case 'reputation': return 'Media'
    case 'contract': return 'Legal'
    case 'availability':
    case 'sacking':
    case 'appointment':
    case 'transfer': return 'Performance'
    case 'general': return 'Staff'
    default: return 'Tactical'
  }
}

type CoachUpdate = Database['public']['Tables']['coach_updates']['Row']
type Coach = Database['public']['Tables']['coaches']['Row']
type UpdateWithCoach = CoachUpdate & { coaches: Coach }

const TYPE_ICON: Record<string, React.ElementType> = {
  availability: Signal,
  sacking: AlertCircle,
  appointment: UserCheck,
  contract: FileSignature,
  reputation: TrendingUp,
  transfer: RefreshCw,
  general: Briefcase,
}

const TYPE_ICON_COLOR: Record<string, string> = {
  availability: 'bg-emerald-900/40 text-emerald-400',
  sacking: 'bg-red-900/40 text-red-400',
  appointment: 'bg-emerald-900/40 text-emerald-400',
  contract: 'bg-amber-900/40 text-amber-400',
  reputation: 'bg-purple-900/40 text-purple-400',
  transfer: 'bg-sky-900/40 text-sky-400',
  general: 'bg-slate-800/40 text-slate-400',
}

/* Solid confidence pills matching Figma */
function getConfidence(updateType: string): { label: string; classes: string } {
  switch (updateType) {
    case 'sacking':
    case 'appointment':
    case 'contract':
    case 'availability':
      return { label: 'HIGH', classes: 'bg-red-600 text-white' }
    case 'reputation':
    case 'transfer':
      return { label: 'MEDIUM', classes: 'bg-amber-500 text-white' }
    default:
      return { label: 'LOW', classes: 'bg-slate-600 text-white' }
  }
}

function getConfidenceByValue(confidence?: string | null): { label: string; classes: string } | null {
  if (!confidence) return null
  switch (confidence) {
    case 'High':
      return { label: 'HIGH', classes: 'bg-red-600 text-white' }
    case 'Medium':
      return { label: 'MEDIUM', classes: 'bg-amber-500 text-white' }
    case 'Low':
      return { label: 'LOW', classes: 'bg-slate-600 text-white' }
    default:
      return null
  }
}

export default function IntelligencePage() {
  const [updates, setUpdates] = useState<UpdateWithCoach[]>([])
  const [coaches, setCoaches] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(20)
  const [loadingMore, setLoadingMore] = useState(false)
  const [coachFilter, setCoachFilter] = useState<string>('all')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    async function loadUpdates() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUpdates([])
        setCoaches([])
        setLoading(false)
        setLoadingMore(false)
        return
      }
      const { data: coachRows } = await supabase.from('coaches').select('id, name').eq('user_id', user.id).order('name')
      const coachList = (coachRows ?? []).map((c) => ({ id: c.id, name: (c as { name: string }).name }))
      setCoaches(coachList)
      const coachIds = coachList.map((c) => c.id)
      if (coachIds.length === 0) {
        setUpdates([])
        setLoading(false)
        setLoadingMore(false)
        return
      }
      const { data } = await supabase
        .from('coach_updates')
        .select('*, coaches(*)')
        .in('coach_id', coachIds)
        .order('occurred_at', { ascending: false, nullsFirst: false })
        .limit(limit)

      setUpdates((data as UpdateWithCoach[]) || [])
      setLoading(false)
      setLoadingMore(false)
    }
    loadUpdates()
  }, [supabase, limit])

  const filteredUpdates = updates.filter((u) => {
    if (coachFilter !== 'all' && u.coach_id !== coachFilter) return false
    const conf = (u.confidence ?? '') as string
    if (confidenceFilter !== 'all' && conf !== confidenceFilter) return false
    const category = updateTypeToCategory(u.update_type ?? 'general')
    if (categoryFilter !== 'all' && category !== categoryFilter) return false
    return true
  })

  async function loadMore() {
    setLoadingMore(true)
    setLimit(prev => prev + 20)
  }

  // Summary stats
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thisWeek = updates.filter((u) => u.occurred_at && new Date(u.occurred_at) >= weekAgo).length
  const highPriority = updates.filter(u => ['sacking', 'appointment'].includes(u.update_type ?? 'general')).length
  const availabilityChanges = updates.filter((u) => (u.update_type ?? 'general') === 'availability').length
  const contractUpdates = updates.filter(u => (u.update_type ?? 'general') === 'contract').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-primary" />
          <span className="text-xs text-muted-foreground tracking-wide">Loading intelligence...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex justify-end mb-4">
        <a
          href="/alerts"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-muted-foreground border border-border hover:text-foreground hover:bg-surface/50 transition-colors"
        >
          <Bell className="w-3.5 h-3.5" />
          Alerts
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={coachFilter}
          onChange={(e) => setCoachFilter(e.target.value)}
          className="h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          <option value="all">All coaches</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          {RISK_OPTIONS.map((o) => (
            <option key={o} value={o}>{o} risk</option>
          ))}
        </select>
        <select
          value={confidenceFilter}
          onChange={(e) => setConfidenceFilter(e.target.value)}
          className="h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          {CONFIDENCE_OPTIONS.map((o) => (
            <option key={o} value={o}>{o} confidence</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card-surface rounded-lg px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">This Week</p>
          <p className="text-3xl font-semibold text-foreground">{thisWeek}</p>
        </div>
        <div className="card-surface rounded-lg px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">High Priority</p>
          <p className="text-3xl font-semibold text-foreground">{highPriority}</p>
        </div>
        <div className="card-surface rounded-lg px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Availability Changes</p>
          <p className="text-3xl font-semibold text-foreground">{availabilityChanges}</p>
        </div>
        <div className="card-surface rounded-lg px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Contract Updates</p>
          <p className="text-3xl font-semibold text-foreground">{contractUpdates}</p>
        </div>
      </div>

      {/* Intelligence Timeline */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-medium text-foreground">Intelligence Timeline</h2>
        </div>

        {filteredUpdates.length === 0 ? (
          <div className="py-16 text-center">
            <Radio className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No data available.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredUpdates.map((update) => {
              const updateType = update.update_type ?? 'general'
              const confidenceVal = getConfidenceByValue(update.confidence) || getConfidence(updateType)
              const confidencePercent = (update.confidence === 'High' ? 85 : update.confidence === 'Medium' ? 50 : 25) as number
              const category = updateTypeToCategory(updateType)
              const IconComponent = TYPE_ICON[updateType] || Briefcase
              const iconColor = TYPE_ICON_COLOR[updateType] || TYPE_ICON_COLOR['general']

              return (
                <div key={update.id} className="px-6 py-5 hover:bg-muted/30 transition-colors">
                  <div className="flex gap-4">
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5', iconColor)}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <span className="text-sm font-semibold text-foreground leading-snug">
                          {getUpdateTitle(updateType)}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          <span className={cn(
                            'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide',
                            confidenceVal.classes
                          )}>
                            {confidencePercent}%
                          </span>
                          {update.source_tier && (
                            <span className="inline-flex items-center rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {update.source_tier}
                            </span>
                          )}
                          <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                        <Link href={`/coaches/${update.coach_id}`} className="font-medium text-primary hover:underline">
                          {update.coaches.name}
                        </Link>
                        <span>·</span>
                        <span>{formatDate(update.occurred_at)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {update.update_note}
                      </p>
                      <div className="flex items-center gap-4">
                        <Link href={`/coaches/${update.coach_id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                          View profile
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Load More */}
        {updates.length >= limit && (
          <div className="px-6 py-4 border-t border-border text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-emerald-400 transition-colors font-medium"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load Earlier Updates'
              )}
            </button>
          </div>
        )}
      </div>

      <div className="mt-6">
        <IntelligenceItemsFeed />
      </div>
    </div>
  )
}

/* Helpers */

function getUpdateTitle(type: string): string {
  switch (type) {
    case 'availability': return 'Availability Change'
    case 'sacking': return 'Manager Dismissed'
    case 'appointment': return 'New Appointment'
    case 'contract': return 'Contract Update'
    case 'reputation': return 'Reputation Shift'
    case 'transfer': return 'Transfer Activity'
    default: return 'Market Update'
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
