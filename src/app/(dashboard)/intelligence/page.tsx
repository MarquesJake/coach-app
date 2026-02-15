'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CoachUpdate, Coach } from '@/lib/types/database'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/ui/metric-card'
import { PageHeader } from '@/components/ui/page-header'
import { cn } from '@/lib/utils'
import {
  Radio,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  UserCheck,
  FileSignature,
  RefreshCw,
  Briefcase,
  ChevronRight,
  Signal,
  AlertTriangle,
  Loader2,
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
  availability: 'bg-emerald-500/15 text-emerald-400',
  sacking: 'bg-red-500/15 text-red-400',
  appointment: 'bg-green-500/15 text-green-400',
  contract: 'bg-amber-500/15 text-amber-400',
  reputation: 'bg-purple-500/15 text-purple-400',
  transfer: 'bg-sky-500/15 text-sky-400',
  general: 'bg-zinc-500/15 text-zinc-400',
}

const TYPE_BADGE_VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'secondary' | 'default' | 'outline'> = {
  availability: 'success',
  sacking: 'danger',
  appointment: 'success',
  contract: 'warning',
  reputation: 'purple',
  transfer: 'info',
  general: 'secondary',
}

function getConfidence(updateType: string) {
  switch (updateType) {
    case 'sacking':
    case 'appointment':
      return { label: 'HIGH', variant: 'success' as const }
    case 'contract':
    case 'availability':
      return { label: 'HIGH', variant: 'warning' as const }
    case 'reputation':
    case 'transfer':
      return { label: 'MEDIUM', variant: 'default' as const }
    default:
      return { label: 'LOW', variant: 'outline' as const }
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
        .order('date_added', { ascending: false })
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
  const thisWeek = updates.filter(u => new Date(u.date_added) >= weekAgo).length
  const highPriority = updates.filter(u => ['sacking', 'appointment'].includes(u.update_type)).length
  const availabilityChanges = updates.filter(u => u.availability_change).length
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
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Weekly Intelligence Feed" subtitle="Market intelligence and coaching movements" />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          icon={<Radio className="w-3.5 h-3.5" />}
          label="This Week"
          value={thisWeek}
        />
        <MetricCard
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          label="High Priority"
          value={highPriority}
          accentColor="text-red-400"
        />
        <MetricCard
          icon={<Signal className="w-3.5 h-3.5" />}
          label="Availability Changes"
          value={availabilityChanges}
          accentColor="text-emerald-400"
        />
        <MetricCard
          icon={<FileSignature className="w-3.5 h-3.5" />}
          label="Contract Updates"
          value={contractUpdates}
          accentColor="text-amber-400"
        />
      </div>

      {/* Intelligence Timeline */}
      <div className="card-surface rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border/50">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Intelligence Timeline
          </h3>
        </div>

        {updates.length === 0 ? (
          <div className="py-16 text-center">
            <Radio className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No intelligence updates</p>
            <p className="text-2xs text-muted-foreground/60">
              Updates will appear here as coaching market intelligence comes in.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {updates.map((update) => {
              const confidence = getConfidence(update.update_type)
              const IconComponent = TYPE_ICON[update.update_type] || Briefcase
              const iconColor = TYPE_ICON_COLOR[update.update_type] || TYPE_ICON_COLOR['general']
              const badgeVariant = TYPE_BADGE_VARIANT[update.update_type] || 'secondary'

              return (
                <div key={update.id} className="px-5 py-4 hover:bg-surface-overlay/20 transition-colors">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', iconColor)}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="text-[13px] font-medium text-foreground">
                            {getUpdateTitle(update.update_type)}
                          </span>
                          <Link
                            href={`/coaches/${update.coach_id}`}
                            className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            {update.coaches.name}
                          </Link>
                        </div>
                        <span className="text-2xs text-muted-foreground/50 tabular-nums shrink-0">
                          {formatDate(update.date_added)}
                        </span>
                      </div>

                      {/* Body */}
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                        {update.update_note}
                      </p>

                      {/* Bottom row: badges + actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={confidence.variant}>
                            {confidence.label}
                          </Badge>
                          <Badge variant={badgeVariant}>
                            {update.update_type}
                          </Badge>
                          {update.availability_change && (
                            <Badge variant="success">
                              <Signal className="h-3 w-3 mr-1" />
                              {update.availability_change}
                            </Badge>
                          )}
                          {update.reputation_shift && (
                            <Badge variant="purple">
                              {update.reputation_shift.includes('Rising') ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : update.reputation_shift.includes('Falling') || update.reputation_shift.includes('Declining') ? (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              ) : null}
                              {update.reputation_shift}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/coaches/${update.coach_id}`}
                            className="text-2xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                          >
                            View Details
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
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
          <div className="px-5 py-4 border-t border-border/50 text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
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
    case 'availability': return 'Availability Change —'
    case 'sacking': return 'Manager Dismissed —'
    case 'appointment': return 'New Appointment —'
    case 'contract': return 'Contract Update —'
    case 'reputation': return 'Reputation Shift —'
    case 'transfer': return 'Transfer Activity —'
    default: return 'Market Update —'
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
