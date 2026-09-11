'use client'

import Link from 'next/link'

export default function ClubError({ reset }: { error: Error; reset: () => void }) {
  return <section role="alert" className="rounded-md border border-destructive/30 bg-card p-6">
    <h1 className="font-serif text-xl">Club information could not be loaded</h1>
    <p className="mt-2 text-sm text-muted-foreground">The current brief and access status are unconfirmed. Retry before relying on a count or changing the brief.</p>
    <button onClick={reset} className="mt-4 rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Retry loading</button>
    <Link href="/club/account#access-help" className="ml-4 text-sm underline">Access help</Link>
  </section>
}
