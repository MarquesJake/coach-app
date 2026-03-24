'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type ClubRow = {
  id: string
  name: string
  league: string
  country: string
  tier: string | null
  badge_url: string | null
}

const PAGE_SIZE = 25

export function ClubBrowserPanel() {
  const pathname = usePathname()
  const [clubs, setClubs] = useState<ClubRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase
        .from('clubs')
        .select('id, name, league, country, tier, badge_url')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
        .limit(200)
        .then(({ data }) => {
          setClubs((data as ClubRow[]) ?? [])
          setLoading(false)
        })
    })
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clubs
    return clubs.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.league ?? '').toLowerCase().includes(q) ||
      (c.country ?? '').toLowerCase().includes(q)
    )
  }, [clubs, query])

  const visible = filtered.slice(0, visibleCount)

  // Extract club id from path like /clubs/[id] or /clubs/[id]/coaches etc.
  const selectedId = pathname.match(/^\/clubs\/([a-f0-9-]{36})/)?.[1] ?? null

  return (
    <div className="flex flex-col h-full bg-transparent">

      {/* Header */}
      <div className="px-4 py-3 border-b border-border space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Club database
          </span>
          <Link
            href="/clubs/new"
            title="Add club"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search clubs…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setVisibleCount(PAGE_SIZE) }}
            className="w-full h-8 pl-8 pr-3 rounded bg-surface border border-border text-xs text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-1 py-1.5 animate-pulse">
                <div className="w-7 h-7 rounded-full bg-surface-overlay/40 shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-2.5 bg-surface-overlay/40 rounded w-3/4" />
                  <div className="h-2 bg-surface-overlay/30 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              {query ? `No clubs matching "${query}"` : 'No clubs yet'}
            </p>
            {!query && (
              <Link href="/clubs/new" className="text-xs text-primary hover:underline">
                Add your first club →
              </Link>
            )}
          </div>
        ) : (
          <>
            {visible.map((club) => {
              const isSelected = club.id === selectedId
              return (
                <Link
                  key={club.id}
                  href={`/clubs/${club.id}`}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 border-b border-border/30 transition-colors group',
                    isSelected
                      ? 'bg-white/[0.06] border-l-2 border-l-primary'
                      : 'hover:bg-white/[0.04] border-l-2 border-l-transparent'
                  )}
                >
                  {/* Badge / fallback avatar */}
                  <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                    {club.badge_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={club.badge_url}
                        alt=""
                        className="w-7 h-7 object-contain"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">
                          {club.name.slice(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Name + meta */}
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      'text-xs font-medium truncate leading-tight',
                      isSelected ? 'text-primary' : 'text-foreground'
                    )}>
                      {club.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5 leading-tight">
                      {[club.league, club.country].filter(Boolean).join(' · ')}
                    </p>
                  </div>

                  {/* Tier badge */}
                  {club.tier && (
                    <span className={cn(
                      'shrink-0 text-[9px] px-1.5 py-0.5 rounded border',
                      isSelected
                        ? 'text-primary border-primary/30 bg-primary/5'
                        : 'text-muted-foreground border-border bg-surface'
                    )}>
                      {club.tier}
                    </span>
                  )}
                </Link>
              )
            })}

            {/* Load more */}
            {filtered.length > visibleCount && (
              <button
                type="button"
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                className="w-full py-3 text-[10px] text-muted-foreground hover:text-foreground transition-colors border-t border-border/50 font-medium uppercase tracking-wider"
              >
                Load {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer count */}
      <div className="px-4 py-2 border-t border-border shrink-0">
        <p className="text-[10px] text-muted-foreground/60">
          {loading ? '…' : `${filtered.length} club${filtered.length !== 1 ? 's' : ''}${query ? ` found` : ''}`}
        </p>
      </div>
    </div>
  )
}
