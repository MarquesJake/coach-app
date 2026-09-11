'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DirectoryError({ reset }: { error: Error; reset: () => void }) {
  return <section role="alert" className="space-y-3 rounded-lg border border-border bg-card p-5">
    <h2 className="font-semibold">Could not load agents records</h2>
    <p className="text-sm text-muted-foreground">Retry to check the saved records. A loading failure does not mean the directory is empty.</p>
    <div className="flex flex-wrap items-center gap-3"><Button onClick={reset}>Retry</Button><Link href="/agents" className="text-sm text-primary">Back to agents</Link></div>
  </section>
}
