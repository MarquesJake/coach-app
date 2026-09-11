'use client'

import { useRef, useState, useTransition } from 'react'
import { LoaderCircle, LockKeyhole } from 'lucide-react'
import { revokeDossierAccessAction } from '../actions'

export function RevokeOrderButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const busy = useRef(false)

  function revoke() {
    if (busy.current) return
    busy.current = true
    setMessage(null)
    startTransition(async () => {
      try {
      const data = new FormData()
      data.set('order_id', orderId)
      const result = await revokeDossierAccessAction(data)
      setMessage(result.ok ? 'Access revoked.' : result.error)
      if (result.ok) setConfirming(false)
      } catch {
        setMessage('Revocation was not confirmed. Check the connection and access status before retrying.')
      } finally {
        busy.current = false
      }
    })
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        {message && <p role="alert" className="w-full text-xs text-red-950">{message}</p>}
        <span className="text-xs font-medium text-red-950">Lock all released files now?</span>
        <button type="button" disabled={pending} onClick={() => setConfirming(false)} className="rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground disabled:opacity-50">Keep access</button>
        <button type="button" disabled={pending} onClick={revoke} className="inline-flex items-center gap-2 rounded-md bg-red-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <LockKeyhole className="h-3.5 w-3.5" />}Confirm revoke</button>
      </div>
    )
  }

  return <div className="flex items-center gap-3"><span aria-live="polite" className="text-xs text-muted-foreground">{message}</span><button type="button" disabled={pending} onClick={() => { setMessage(null); setConfirming(true) }} className="inline-flex items-center gap-2 rounded-md border border-red-700/20 bg-red-50 px-3 py-2 text-xs font-medium text-red-900 disabled:opacity-50"><LockKeyhole className="h-3.5 w-3.5" />Revoke access</button></div>
}
