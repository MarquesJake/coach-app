'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="card-surface rounded-xl p-8 max-w-sm w-full text-center">
        <h2 className="text-sm font-semibold text-foreground">Something went wrong</h2>
        <p className="text-xs text-muted-foreground mt-2">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center justify-center px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
