import Link from 'next/link'

type EmptyStateProps = {
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
}

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
      {actionLabel && actionHref && (
        <div className="mt-5 flex items-center justify-center">
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors"
          >
            {actionLabel}
          </Link>
        </div>
      )}
    </div>
  )
}
