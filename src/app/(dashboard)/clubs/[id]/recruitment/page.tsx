'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ExternalLink, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type MandateRow = {
  id: string
  status: string
  priority: string | null
  strategic_objective: string | null
  succession_timeline: string | null
  created_at: string
  _shortlist_count: number
}

const STATUS_COLOURS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-blue-400',
  low: 'bg-muted-foreground',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

export default function ClubRecruitmentPage() {
  const params = useParams()
  const clubId = params.id as string

  const [mandates, setMandates] = useState<MandateRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Fetch mandates for this club
      const { data: mandateData } = await supabase
        .from('mandates')
        .select('id, status, priority, strategic_objective, succession_timeline, created_at')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!mandateData || mandateData.length === 0) {
        setMandates([])
        setLoading(false)
        return
      }

      // Fetch shortlist counts per mandate
      const mandateIds = mandateData.map((m) => m.id)
      const { data: shortlistData } = await supabase
        .from('mandate_shortlist')
        .select('mandate_id')
        .in('mandate_id', mandateIds)

      const counts: Record<string, number> = {}
      for (const row of shortlistData ?? []) {
        counts[row.mandate_id] = (counts[row.mandate_id] ?? 0) + 1
      }

      setMandates(
        mandateData.map((m) => ({
          ...m,
          _shortlist_count: counts[m.id] ?? 0,
        }))
      )
      setLoading(false)
    }
    load()
  }, [clubId])

  if (loading) {
    return (
      <section className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-medium text-foreground">Mandate history</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Head coach searches run for this club</p>
          </div>
          <Link
            href={`/mandates/new?club_id=${clubId}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 h-8 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New mandate
          </Link>
        </div>

        {mandates.length === 0 ? (
          <div className="px-6 py-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No mandates for this club yet.</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Open a mandate to begin a structured head coach search.
            </p>
            <Link
              href={`/mandates/new?club_id=${clubId}`}
              className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Open mandate
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {mandates.map((mandate) => (
              <div key={mandate.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-overlay/20 group">

                {/* Priority dot */}
                <div className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  PRIORITY_DOT[mandate.priority ?? 'medium'] ?? 'bg-muted-foreground'
                )} />

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {mandate.strategic_objective ?? 'Head coach search'}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn(
                      'inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium capitalize',
                      STATUS_COLOURS[mandate.status] ?? 'bg-surface text-muted-foreground border-border'
                    )}>
                      {mandate.status}
                    </span>
                    {mandate.succession_timeline && (
                      <span className="text-[10px] text-muted-foreground">{mandate.succession_timeline}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      Opened {formatDate(mandate.created_at)}
                    </span>
                  </div>
                </div>

                {/* Shortlist count */}
                <div className="text-center shrink-0">
                  <p className="text-lg font-bold text-foreground tabular-nums leading-none">{mandate._shortlist_count}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">candidates</p>
                </div>

                {/* Open workspace link */}
                <Link
                  href={`/mandates/${mandate.id}/workspace`}
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Open <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recruitment pattern summary */}
      {mandates.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pattern summary</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{mandates.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">Total searches</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {mandates.filter((m) => m.status === 'active').length}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {mandates.filter((m) => m.status === 'completed').length}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">Completed</p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
