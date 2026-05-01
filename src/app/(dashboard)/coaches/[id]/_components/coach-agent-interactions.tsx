type InteractionRow = {
  id: string
  occurred_at: string | null
  summary: string | null
  interaction_type: string | null
  agents?: { full_name: string | null; agency_name: string | null } | null
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function CoachAgentInteractions({
  interactions,
}: {
  interactions: InteractionRow[]
}) {
  if (interactions.length === 0) return null

  return (
    <section className="mt-4 rounded-lg border border-border bg-card p-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
        Recent agent interactions
      </h3>
      <div className="space-y-2">
        {interactions.map((item) => {
          const agentName = item.agents?.full_name ?? item.agents?.agency_name ?? 'Unknown agent'
          return (
            <div key={item.id} className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-foreground truncate">{agentName}</span>
                  {item.interaction_type && (
                    <span className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground shrink-0">
                      {item.interaction_type}
                    </span>
                  )}
                </div>
                {item.summary && (
                  <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{item.summary}</p>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                {formatDate(item.occurred_at)}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
