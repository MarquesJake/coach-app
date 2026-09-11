'use client'

import { Button } from '@/components/ui/button'

export default function NetworkError({ reset }: { error: Error; reset: () => void }) {
  return <div role="alert" className="border border-destructive/30 bg-card p-6"><h2 className="text-sm font-semibold text-foreground">The football network could not be loaded.</h2><p className="mt-1 text-sm text-muted-foreground">Retry to check the current saved records. A loading failure does not mean the directory is empty.</p><Button className="mt-4" onClick={reset}>Retry</Button></div>
}
