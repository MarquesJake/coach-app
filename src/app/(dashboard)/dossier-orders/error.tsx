'use client'

import { ShieldAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function DossierOrdersError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-card p-6">
      <ShieldAlert className="h-5 w-5 text-destructive" />
      <h2 className="mt-3 text-sm font-semibold text-foreground">The dossier release desk could not be loaded.</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">No access changed and no material was released. Retry the secure request before taking action.</p>
      <Button className="mt-4" onClick={reset}>Retry release desk</Button>
    </div>
  )
}
