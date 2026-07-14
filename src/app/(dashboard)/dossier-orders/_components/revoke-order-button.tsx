'use client'

import { useState, useTransition } from 'react'
import { LoaderCircle, LockKeyhole } from 'lucide-react'
import { revokeDossierAccessAction } from '../actions'

export function RevokeOrderButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  return <div className="flex items-center gap-3">{message && <span className="text-xs text-muted-foreground">{message}</span>}<button disabled={pending} onClick={() => startTransition(async () => { const data = new FormData(); data.set('order_id', orderId); const result = await revokeDossierAccessAction(data); setMessage(result.ok ? 'Access revoked.' : result.error) })} className="inline-flex items-center gap-2 rounded-md border border-red-700/20 bg-red-50 px-3 py-2 text-xs font-medium text-red-900 disabled:opacity-50">{pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <LockKeyhole className="h-3.5 w-3.5" />}Revoke access</button></div>
}
