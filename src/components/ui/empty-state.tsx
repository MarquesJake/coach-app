import Link from 'next/link'

type EmptyStateProps = {
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
}

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="mx-auto w-full max-w-xl rounded-xl bg-card px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {actionLabel && actionHref && (
        <div className="mt-5 flex items-center justify-center">
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 px-5 h-11 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors"
          >
            {actionLabel}
          </Link>
        </div>
      )}
    </div>
  )
}
