export default function DashboardLoading() {
  return (
    <div className="min-h-[70vh] px-6 py-6">
      <div className="mx-auto max-w-[1100px] space-y-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Coach First Intelligence OS</p>
              <h1 className="mt-2 text-xl font-semibold text-foreground">Building the appointment room</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Pulling mandate context, private intelligence, evidence coverage and board-pack readiness into one view.
              </p>
            </div>
            <svg className="h-8 w-8 shrink-0 animate-spin text-primary" viewBox="0 0 24 24">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {['Club brief', 'Coach evidence', 'Recommendation pack'].map((label) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4">
              <div className="h-2 w-20 rounded bg-primary/20" />
              <div className="mt-4 h-3 w-3/4 rounded bg-muted" />
              <div className="mt-2 h-3 w-1/2 rounded bg-muted/70" />
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
