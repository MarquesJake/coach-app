'use client'

import Link from 'next/link'

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <section role="alert" className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8">
      <h1 className="text-xl font-semibold">This page could not load</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This view could not be confirmed. Retry loading it. If you were saving, reopen the record and check its saved state before repeating the change.
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
        <button type="button" onClick={reset} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Try again</button>
        <Link href="/coaches" className="rounded-md border border-border px-4 py-2 text-sm">Coach catalogue</Link>
        <Link href="/mandates" className="rounded-md border border-border px-4 py-2 text-sm">Mandates</Link>
      </div>
    </section>
  )
}
