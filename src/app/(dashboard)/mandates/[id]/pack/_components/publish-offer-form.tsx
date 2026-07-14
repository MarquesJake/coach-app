'use client'

import { useState, useTransition } from 'react'
import { LoaderCircle, Send } from 'lucide-react'
import { publishDossierOfferAction } from '@/app/(dashboard)/dossier-orders/actions'

export function PublishOfferForm({ mandateId, coachId, buyers }: { mandateId: string; coachId: string; buyers: Array<{ id: string; name: string }> }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  if (!buyers.length) return <p className="text-xs text-muted-foreground">Create a club organisation before publishing.</p>
  return <div className="mt-4 border-t border-border pt-4"><p className="text-[10px] font-semibold uppercase text-muted-foreground">Publish to a club decision room</p><form action={(formData) => startTransition(async () => { const result = await publishDossierOfferAction(formData); setMessage(result.ok ? 'Club preview published.' : result.error) })} className="mt-2 flex flex-wrap items-end gap-2"><input type="hidden" name="mandate_id" value={mandateId} /><input type="hidden" name="coach_id" value={coachId} /><label><span className="sr-only">Club</span><select name="buyer_organization_id" className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground">{buyers.map((buyer) => <option key={buyer.id} value={buyer.id}>{buyer.name}</option>)}</select></label><label><span className="sr-only">Dossier fee</span><div className="flex h-9 items-center rounded-md border border-input bg-background"><span className="border-r border-border px-2 text-xs text-muted-foreground">£</span><input name="price_pounds" type="number" min="0" step="500" defaultValue="15000" className="w-24 bg-transparent px-2 text-xs text-foreground outline-none" /></div></label><button disabled={pending} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50">{pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}Publish preview</button>{message && <span className="text-xs text-muted-foreground">{message}</span>}</form></div>
}
