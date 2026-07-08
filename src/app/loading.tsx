export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md rounded-lg border border-border bg-card p-6 text-center">
        <svg className="mx-auto h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="mt-4 text-sm font-semibold text-foreground">Loading Coach First</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Preparing the intelligence workspace.</p>
      </div>
    </div>
  )
}
