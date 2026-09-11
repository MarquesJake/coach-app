'use client'

import { Button } from '@/components/ui/button'

export default function NetworkError({ reset }: { error: Error; reset: () => void }) {
  return <div role="alert" className="border border-destructive/30 bg-card p-6"><h2 className="text-sm font-semibold text-foreground">The football network didn’t load.</h2><p className="mt-1 text-sm text-muted-foreground">Try again — it failing to load doesn’t mean there’s nothing there.</p><Button className="mt-4" onClick={reset}>Retry</Button></div>
}
