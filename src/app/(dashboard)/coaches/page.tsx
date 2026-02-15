'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Coach } from '@/lib/types/database'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Search, Users, ChevronRight, Filter } from 'lucide-react'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'secondary' | 'outline'> = {
  'Available': 'success',
  'Open to offers': 'warning',
  'Under contract - interested': 'warning',
  'Under contract': 'danger',
  'Not available': 'outline',
}

const REPUTATION_VARIANT: Record<string, 'purple' | 'warning' | 'info' | 'default' | 'outline'> = {
  'World-class': 'purple',
  'Elite': 'warning',
  'Established': 'info',
  'Emerging': 'default',
  'Unknown': 'outline',
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'Available', label: 'Available' },
  { value: 'Open to offers', label: 'Open to Offers' },
  { value: 'Under contract - interested', label: 'Interested' },
  { value: 'Under contract', label: 'Under Contract' },
]

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    async function loadCoaches() {
      const { data } = await supabase
        .from('coaches')
        .select('*')
        .order('name')
      setCoaches(data || [])
      setLoading(false)
    }
    loadCoaches()
  }, [supabase])

  const filtered = coaches.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.current_club || '').toLowerCase().includes(search.toLowerCase()) ||
      c.preferred_style.toLowerCase().includes(search.toLowerCase()) ||
      (c.nationality || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.available_status === statusFilter
    return matchSearch && matchStatus
  })

  const availableCount = coaches.filter(c => c.available_status === 'Available').length
  const interestedCount = coaches.filter(c => c.available_status === 'Open to offers' || c.available_status === 'Under contract - interested').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Coach Database</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {coaches.length} profiles &middot; {availableCount} available &middot; {interestedCount} open to offers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium tabular-nums">{filtered.length} shown</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card-surface rounded-lg p-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, club, style, nationality..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface rounded-md text-sm text-foreground placeholder-muted-foreground/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1 border-l border-border pl-3">
            <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1" />
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  'px-2.5 py-1.5 rounded text-2xs font-medium transition-colors',
                  statusFilter === opt.value
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Coach Table/List */}
      <div className="card-surface rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_140px_120px_100px_100px_32px] px-5 py-2.5 border-b border-border bg-surface/50">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Coach</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Style</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Status</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Reputation</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Wage</span>
          <span />
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/50">
          {filtered.map((coach, i) => (
            <Link
              key={coach.id}
              href={`/coaches/${coach.id}`}
              className="grid grid-cols-[1fr_140px_120px_100px_100px_32px] px-5 py-3 items-center hover:bg-surface-overlay/30 transition-colors group animate-fade-in"
              style={{ animationDelay: `${Math.min(i * 20, 400)}ms` }}
            >
              {/* Coach info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {coach.name}
                  </span>
                  {coach.nationality && (
                    <span className="text-2xs text-muted-foreground/50 hidden lg:inline">{coach.nationality}</span>
                  )}
                </div>
                <span className="text-2xs text-muted-foreground truncate block">
                  {coach.current_role}{coach.current_club ? ` · ${coach.current_club}` : ''}
                </span>
              </div>

              {/* Style */}
              <div>
                <span className="text-2xs text-muted-foreground">{coach.preferred_style}</span>
              </div>

              {/* Status */}
              <div>
                <Badge variant={STATUS_VARIANT[coach.available_status] || 'outline'}>
                  {coach.available_status === 'Under contract - interested' ? 'Interested' : coach.available_status}
                </Badge>
              </div>

              {/* Reputation */}
              <div>
                <Badge variant={REPUTATION_VARIANT[coach.reputation_tier] || 'outline'}>
                  {coach.reputation_tier}
                </Badge>
              </div>

              {/* Wage */}
              <div>
                <span className="text-2xs text-muted-foreground tabular-nums">{coach.wage_expectation}</span>
              </div>

              {/* Arrow */}
              <div className="flex justify-end">
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No coaches match the current filters.</p>
          <button
            onClick={() => { setSearch(''); setStatusFilter('all') }}
            className="text-xs text-primary hover:text-primary/80 mt-2 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
