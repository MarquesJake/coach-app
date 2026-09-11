'use client'

import Link from 'next/link'

export default function AppointmentLoadError({ reset }: { reset: () => void }) {
  return <section role="alert" className="mx-auto max-w-[900px] space-y-4 rounded-lg border border-border bg-card p-6">
    <h1 className="font-serif text-2xl">This part of the mandate didn’t load</h1>
    <p className="text-sm text-muted-foreground">We couldn’t load the latest data — that doesn’t mean the brief or candidates are empty. Nothing has been changed. If you were saving something, refresh to check it went through before trying again.</p>
    <div className="flex flex-wrap gap-3"><button type="button" onClick={reset} className="gaffa-action gaffa-action-primary">Try loading again</button><Link href="/mandates" className="gaffa-action gaffa-action-secondary">Back to appointments</Link></div>
  </section>
}
