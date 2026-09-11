'use client'

import { useRef, useState, useTransition } from 'react'
import { unstable_rethrow } from 'next/navigation'
import { submitDossierOrderAction } from '../../actions'

export function DossierRequestForm({ offerId }: { offerId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)
  return <form className="mt-5 space-y-4" aria-busy={pending} onSubmit={event => {
    event.preventDefault()
    if (submitting.current) return
    const data = new FormData(event.currentTarget)
    submitting.current = true
    setError(null)
    startTransition(async () => {
      try { await submitDossierOrderAction(data) }
      catch (cause) { unstable_rethrow(cause); setError('Request was not confirmed. Your intended use is retained; check your connection and club role before retrying.') }
      finally { submitting.current = false }
    })
  }}>
    <input type="hidden" name="offer_id" value={offerId} />
    <fieldset disabled={pending} className="min-w-0 space-y-4">
      <label className="block text-xs font-semibold">Intended use<textarea name="intended_use" required rows={4} defaultValue="Board review before deciding whether to progress the candidate to final interview and reference stage." className="mt-2 w-full rounded border border-input bg-background px-3 py-2 text-sm leading-6" /></label>
      <label className="block text-xs font-semibold">Club reference (optional)<input name="buyer_reference" className="mt-2 min-h-11 w-full rounded border border-input bg-background px-3 py-2 text-sm" /></label>
    </fieldset>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <button disabled={pending} className="min-h-11 w-full rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{pending ? 'Submitting request...' : 'Request confidential dossier'}</button>
  </form>
}
