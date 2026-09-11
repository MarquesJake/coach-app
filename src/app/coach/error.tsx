'use client'

import Link from 'next/link'

export default function CoachError({ reset }: { error: Error; reset: () => void }) {
  return <main role="alert" className="mx-auto max-w-xl space-y-4 px-6 py-12">
    <h1 className="font-serif text-3xl">Coach information could not be loaded</h1>
    <p>Your profile didn’t load. Try again before re-entering anything.</p>
    <button onClick={reset} className="min-h-11 rounded bg-primary px-4 py-2 text-primary-foreground">Retry loading</button>
    <p className="text-sm">If the problem continues, contact the Gaffa person who sent your invitation. <Link href="/coach/login" className="underline">Coach sign in</Link></p>
  </main>
}
