'use client'

type Club = {
  name: string
  league: string | null
  country: string
  tier: string | null
  ownership_model: string | null
}

export function ClubCommandBar({ club }: { club: Club }) {
  return (
    <header className="w-full bg-card/80 border-b border-border px-6 py-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">{club.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm">
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
          </div>
        </div>
      </div>
    </header>
  )
}
