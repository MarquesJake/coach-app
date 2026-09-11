'use client'

import { LockKeyhole } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function ClubDossiersError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-card p-6">
      <LockKeyhole className="h-5 w-5 text-destructive" />
      <h2 className="mt-3 text-sm font-semibold text-foreground">Confidential dossier access could not be confirmed.</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">Files remain locked. Retry the secure request or ask Gaffa to confirm the release status.</p>
      <Button className="mt-4" onClick={reset}>Retry dossier access</Button>
      <Link href="/club/account#access-help" className="ml-4 inline-flex text-sm underline">Access help</Link>
    </div>
  )
}
