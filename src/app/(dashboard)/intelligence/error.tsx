'use client'

import { Button } from '@/components/ui/button'

export default function IntelligenceError({ reset }: { error: Error; reset: () => void }) {
  return <div className="border border-destructive/30 bg-card p-6"><h2 className="text-sm font-semibold text-foreground">Intelligence didn’t load.</h2><p className="mt-1 text-sm text-muted-foreground">Nothing has changed and everything stays private.</p><Button className="mt-4" onClick={reset}>Retry</Button></div>
}
