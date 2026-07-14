'use client'

import { Button } from '@/components/ui/button'

export default function NetworkError({ reset }: { error: Error; reset: () => void }) {
  return <div className="border border-destructive/30 bg-card p-6"><h2 className="text-sm font-semibold text-foreground">The football network could not be loaded.</h2><p className="mt-1 text-sm text-muted-foreground">No records were changed. Retry the secure request.</p><Button className="mt-4" onClick={reset}>Retry</Button></div>
}
