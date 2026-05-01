'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AgentInventoryAgent = {
  id: string
  full_name: string | null
  agency_name: string | null
  base_location: string | null
  markets: string[] | null
  influence_score: number | null
  reliability_score: number | null
  risk_flag: boolean
  preferred_contact_channel: string | null
  created_at: string
}

function relativeTime(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    const now = Date.now()
    const diff = now - d.getTime()
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} years ago`
  } catch {
    return '—'
  }
}

export function AgentsInventoryClient({
  agents,
  coachesCountByAgent,
  clubsCountByAgent,
  lastInteractionByAgent,
  initialQ,
  initialMarket,
  initialRisk,
  initialMinInfluence,
  initialChannel,
  initialSort,
  allMarkets,
  allChannels,
}: {
  agents: AgentInventoryAgent[]
  coachesCountByAgent: Record<string, number>
  clubsCountByAgent: Record<string, number>
  lastInteractionByAgent: Record<string, string>
  initialQ?: string
  initialMarket?: string
  initialRisk?: string
  initialMinInfluence?: string
  initialChannel?: string
  initialSort?: string
  allMarkets: string[]
  allChannels: string[]
}) {
  const router = useRouter()
  const pathname = usePathname()

  function buildUrl(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    if (initialQ) params.set('q', initialQ)
    if (initialMarket) params.set('market', initialMarket)
    if (initialRisk) params.set('risk', initialRisk)
    if (initialMinInfluence) params.set('min_influence', initialMinInfluence)
    if (initialChannel) params.set('channel', initialChannel)
    if (initialSort) params.set('sort', initialSort)
    for (const [k, v] of Object.entries(updates)) {
      if (v != null && v !== '' && v !== 'all') params.set(k, v)
      else params.delete(k)
    }
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const q = (e.currentTarget.querySelector('[name="q"]') as HTMLInputElement)?.value?.trim() ?? ''
            router.push(buildUrl({ q: q || undefined }))
          }}
        >
          <input
            type="search"
            name="q"
            defaultValue={initialQ}
            placeholder="Search by name or agency"
            className="h-9 w-56 rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button type="submit" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
            Search
          </button>
        </form>
        <div className="flex items-center gap-2">
          <select
            value={initialSort ?? 'name'}
            onChange={(e) => router.push(buildUrl({ sort: e.target.value }))}
            className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          >
            <option value="name">Name</option>
            <option value="influence">Influence</option>
            <option value="reliability">Reliability</option>
            <option value="last_interaction">Most recent interaction</option>
            <option value="coaches">Coaches represented</option>
          </select>
          <Link href="/agents/new" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Add agent
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Filters:</span>
        <Link href={buildUrl({ market: undefined })} className={cn('rounded-md px-2 py-1', !initialMarket ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
          All markets
        </Link>
        {allMarkets.slice(0, 8).map((m) => (
          <Link key={m} href={buildUrl({ market: m })} className={cn('rounded-md px-2 py-1', initialMarket === m ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
            {m}
          </Link>
        ))}
        <span className="text-muted-foreground ml-2">Risk:</span>
        <Link href={buildUrl({ risk: undefined })} className={cn('rounded-md px-2 py-1', !initialRisk ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
          All
        </Link>
        <Link href={buildUrl({ risk: 'yes' })} className={cn('rounded-md px-2 py-1', initialRisk === 'yes' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
          Flagged
        </Link>
        <Link href={buildUrl({ risk: 'no' })} className={cn('rounded-md px-2 py-1', initialRisk === 'no' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
          Not flagged
        </Link>
        <span className="text-muted-foreground ml-2">Min influence:</span>
        <Link href={buildUrl({ min_influence: undefined })} className={cn('rounded-md px-2 py-1', !initialMinInfluence ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
          All
        </Link>
        {[25, 50, 75].map((n) => (
          <Link key={n} href={buildUrl({ min_influence: String(n) })} className={cn('rounded-md px-2 py-1', initialMinInfluence === String(n) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
            {n}+
          </Link>
        ))}
        {allChannels.length > 0 && (
          <>
            <span className="text-muted-foreground ml-2">Channel:</span>
            <Link href={buildUrl({ channel: undefined })} className={cn('rounded-md px-2 py-1', !initialChannel ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
              All
            </Link>
            {allChannels.map((c) => (
              <Link key={c} href={buildUrl({ channel: c })} className={cn('rounded-md px-2 py-1', initialChannel === c ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                {c}
              </Link>
            ))}
          </>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Agent</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Base location</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Markets</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Coaches</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Clubs</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Influence / Reliability</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Last interaction</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {agents.map((a) => {
                const lastAt = lastInteractionByAgent[a.id]
                return (
                  <tr key={a.id} className="hover:bg-surface-overlay/30">
                    <td className="py-3 px-4">
                      <div>
                        <Link href={`/agents/${a.id}`} className="font-medium text-primary hover:underline">
                          {a.full_name ?? '—'}
                        </Link>
                        {a.agency_name && <div className="text-xs text-muted-foreground">{a.agency_name}</div>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{a.base_location ?? '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(a.markets ?? []).slice(0, 3).map((m) => (
                          <span key={m} className="inline-flex rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                            {m}
                          </span>
                        ))}
                        {(a.markets?.length ?? 0) > 3 && <span className="text-xs text-muted-foreground">+{(a.markets?.length ?? 0) - 3}</span>}
                        {(!a.markets || a.markets.length === 0) && <span className="text-muted-foreground">—</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 tabular-nums">{coachesCountByAgent[a.id] ?? 0}</td>
                    <td className="py-3 px-4 tabular-nums">{clubsCountByAgent[a.id] ?? 0}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {a.influence_score != null && (
                          <span className="inline-flex rounded border border-border bg-surface px-1.5 py-0.5 text-xs tabular-nums text-foreground">
                            I {a.influence_score}
                          </span>
                        )}
                        {a.reliability_score != null && (
                          <span className="inline-flex rounded border border-border bg-surface px-1.5 py-0.5 text-xs tabular-nums text-foreground">
                            R {a.reliability_score}
                          </span>
                        )}
                        {(a.influence_score == null && a.reliability_score == null) && <span className="text-muted-foreground">—</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{lastAt ? relativeTime(lastAt) : '—'}</td>
                    <td className="py-3 px-4">
                      <Link href={`/agents/${a.id}`} className="text-xs text-primary hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
