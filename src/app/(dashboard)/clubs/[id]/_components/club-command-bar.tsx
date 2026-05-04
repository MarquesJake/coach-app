'use client'

import Link from 'next/link'
import { ClubSyncButton } from './club-sync-button'

type Club = {
  id: string
  name: string
  league: string | null
  country: string
  tier: string | null
  ownership_model: string | null
  external_source: string | null
  external_id: string | null
  badge_url: string | null
  last_synced_at: string | null
}

export function ClubCommandBar({ club }: { club: Club }) {
  return (
    <header className="w-full bg-card/80 border-b border-border px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">

        {/* Left: badge + identity */}
        <div className="flex items-center gap-4">
          {club.badge_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={club.badge_url} alt={club.name} className="w-12 h-12 object-contain shrink-0" />
          )}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">{club.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {club.league && (
                <span className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
                  {club.league}
                </span>
              )}
              {club.country && (
                <span className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
                  {club.country}
                </span>
              )}
              {club.tier && (
                <span className="rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                  {club.tier}
                </span>
              )}
              {club.ownership_model && club.ownership_model !== 'Unknown' && (
                <span className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
                  {club.ownership_model}
                </span>
              )}
              {club.external_source && (
                <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                  Synced
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: primary action + collapsed internal sync */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/mandates/new?club_id=${club.id}&club_name=${encodeURIComponent(club.name)}`}
            className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors shrink-0"
          >
            + Open mandate
          </Link>
          <details className="group relative">
            <summary className="flex h-9 cursor-pointer list-none items-center rounded-lg border border-border bg-surface px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground">
              Admin controls
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-border bg-card p-3 shadow-xl">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-amber-400">Internal sync</p>
              <ClubSyncButton
                clubId={club.id}
                hasExternalSource={!!club.external_source}
                lastSyncedAt={club.last_synced_at}
                autoSync={!!club.external_source && !club.last_synced_at}
              />
            </div>
          </details>
        </div>

      </div>
    </header>
  )
}
