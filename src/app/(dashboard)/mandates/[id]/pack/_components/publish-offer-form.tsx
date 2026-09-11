'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { LoaderCircle, Send } from 'lucide-react'
import { publishDossierOfferAction } from '@/app/(dashboard)/dossier-orders/actions'

export function PublishOfferForm({ mandateId, coachId, buyers }: { mandateId: string; coachId: string; buyers: Array<{ id: string; name: string }> }) {
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const confirmed = useRef(false)
  const [message, setMessage] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [published, setPublished] = useState(false)
  if (!buyers.length) return <p className="text-sm text-muted-foreground">No club workspace is available for publishing. <Link href="/club-briefs" className="underline">Review club intake</Link> before choosing a recipient.</p>

  async function publish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current || confirmed.current) return
    const data = new FormData(event.currentTarget)
    const recipient = buyers.find(buyer => buyer.id === data.get('buyer_organization_id'))
    if (!recipient || !window.confirm(`Publish this preview to ${recipient.name}? This makes the recommendation visible to that club; private files are released separately.`)) return
    busy.current = true
    setPending(true)
    setMessage(null)
    try {
      const result = await publishDossierOfferAction(data)
      setFailed(!result.ok)
      if (result.ok) { confirmed.current = true; setPublished(true) }
      setMessage(result.ok ? 'Club preview published. Private files still require a separate release.' : result.error)
    } catch {
      setFailed(true)
      setMessage('Publication not confirmed. Your selections remain here. Check the release desk before retrying.')
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  return <div className="mt-4 border-t border-border pt-4">
    <p className="text-sm font-semibold">Publish to a club decision room</p>
    <form onSubmit={publish} aria-busy={pending} className="mt-3 space-y-3">
      <input type="hidden" name="mandate_id" value={mandateId} /><input type="hidden" name="coach_id" value={coachId} />
      <fieldset disabled={pending || published} className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1"><span className="mb-1 block text-xs">Recipient club</span><select required name="buyer_organization_id" defaultValue="" className="min-h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="" disabled>Choose the intended club</option>{buyers.map(buyer => <option key={buyer.id} value={buyer.id}>{buyer.name}</option>)}</select></label>
        <label><span className="mb-1 block text-xs">Agreed fee (GBP)</span><input required name="price_pounds" type="number" min="0" step="0.01" placeholder="Enter 0 if free" className="h-10 w-40 rounded-md border border-input bg-background px-3 text-sm" /></label>
        <button type="submit" disabled={pending} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{pending ? 'Publishing...' : 'Publish preview'}</button>
      </fieldset>
      {message && <p role={failed ? 'alert' : 'status'} className="text-sm text-muted-foreground">{message} <Link href="/dossier-orders" className="underline">Open release desk</Link></p>}
    </form>
  </div>
}
