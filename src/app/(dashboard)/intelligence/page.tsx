'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CoachUpdate, Coach } from '@/lib/types/database'
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
  AlertTriangle,
  Loader2,
  TrendingUp,
  Filter,
  Bell,
} from 'lucide-react'

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
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(20)
  const [loadingMore, setLoadingMore] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadUpdates() {
      const { data } = await supabase
        .from('coach_updates')
        .select('*, coaches(*)')
        .order('occurred_at', { ascending: false, nullsFirst: false })
        .limit(limit)

      setUpdates((data as UpdateWithCoach[]) || [])
      setLoading(false)
      setLoadingMore(false)
    }
    loadUpdates()
  }, [supabase, limit])

  async function loadMore() {
    setLoadingMore(true)
    setLimit(prev => prev + 20)
  }

  // Summary stats
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thisWeek = updates.filter((u) => u.occurred_at && new Date(u.occurred_at) >= weekAgo).length
  const highPriority = updates.filter(u => ['sacking', 'appointment'].includes(u.update_type)).length
  const availabilityChanges = updates.filter((u) => u.update_type === 'availability').length
  const contractUpdates = updates.filter(u => u.update_type === 'contract').length

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
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Weekly Intelligence Feed</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Market intelligence and coaching movements</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-muted-foreground border border-border hover:text-foreground hover:bg-surface-raised transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-muted-foreground border border-border hover:text-foreground hover:bg-surface-raised transition-colors">
            <Bell className="w-3.5 h-3.5" />
            Alerts
          </button>
        </div>
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
      <div className="card-surface rounded-xl overflow-hidden">
        {/* Section header */}
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Intelligence Timeline</h2>
        </div>

        {updates.length === 0 ? (
          <div className="py-16 text-center">
            <Radio className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No intelligence updates</p>
            <p className="text-xs text-muted-foreground/60">
              Updates will appear here as coaching market intelligence comes in.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {updates.map((update) => {
              const confidence = getConfidenceByValue(update.confidence) || getConfidence(update.update_type)
              const IconComponent = TYPE_ICON[update.update_type] || Briefcase
              const iconColor = TYPE_ICON_COLOR[update.update_type] || TYPE_ICON_COLOR['general']

              return (
                <div key={update.id} className="px-6 py-5 hover:bg-surface-raised transition-colors">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5', iconColor)}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title row: title left, badges right */}
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <span className="text-sm font-semibold text-foreground leading-snug">
                          {getUpdateTitle(update.update_type)}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={cn(
                            'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide',
                            confidence.classes
                          )}>
                            {confidence.label}
                          </span>
                          <span className="inline-flex items-center rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {update.update_type}
                          </span>
                          {update.source_tier && (
                            <span className="inline-flex items-center rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {update.source_tier}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Coach name + time */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <Link
                          href={`/coaches/${update.coach_id}`}
                          className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          {update.coaches.name}
                        </Link>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(update.occurred_at)}
                        </span>
                      </div>

                      {/* Body */}
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {update.update_note}
                      </p>

                      {/* Action links */}
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/coaches/${update.coach_id}`}
                          className="text-xs text-muted-foreground hover:text-emerald-400 transition-colors"
                        >
                          View Details
                        </Link>
                        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          Add Note
                        </button>
                        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          Share with Team
                        </button>
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
