'use client'

import Link from 'next/link'

export default function AppointmentLoadError({ reset }: { reset: () => void }) {
  return <section role="alert" className="mx-auto max-w-[900px] space-y-4 rounded-lg border border-border bg-card p-6">
    <h1 className="font-serif text-2xl">This appointment section could not be loaded</h1>
    <p className="text-sm text-muted-foreground">We could not confirm the latest data. This does not mean the brief or candidates are empty. No changes were made by this load; if a save was interrupted, reload to confirm its result before repeating it.</p>
    <div className="flex flex-wrap gap-3"><button type="button" onClick={reset} className="gaffa-action gaffa-action-primary">Try loading again</button><Link href="/mandates" className="gaffa-action gaffa-action-secondary">Back to appointments</Link></div>
  </section>
}
