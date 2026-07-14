'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, LoaderCircle, ShieldCheck } from 'lucide-react'
import { approveDossierOrderAction } from '../actions'

type Material = { id: string; title: string; material_type: string; verification_status: string }

export function ReleaseOrderForm({ orderId, materials }: { orderId: string; materials: Material[] }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  return (
    <form action={(formData) => startTransition(async () => { const result = await approveDossierOrderAction(formData); setMessage(result.ok ? 'Access released to the club.' : result.error) })} className="mt-4 rounded-md border border-border bg-background p-4">
      <input type="hidden" name="order_id" value={orderId} />
      <p className="text-xs font-semibold text-foreground">Select the material this club may see</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {materials.map((material) => <label key={material.id} className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-card p-3"><input type="checkbox" name="material_id" value={material.id} defaultChecked={material.verification_status === 'verified'} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" /><span><span className="block text-xs font-medium text-foreground">{material.title}</span><span className="mt-0.5 block text-[10px] uppercase text-muted-foreground">{material.material_type.replace('_', ' ')} · {material.verification_status}</span></span></label>)}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[130px_160px_minmax(0,1fr)] sm:items-end"><label><span className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Access days</span><input name="access_days" type="number" min="1" max="365" defaultValue="30" className="w-full rounded-md border border-input bg-card px-3 py-2 text-xs text-foreground" /></label><label className="flex h-9 items-center gap-2 text-xs text-foreground"><input type="checkbox" name="permit_download" className="h-4 w-4 accent-[var(--primary)]" />Permit downloads</label><label><span className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Release note</span><input name="release_note" placeholder="Scope or coach permission note" className="w-full rounded-md border border-input bg-card px-3 py-2 text-xs text-foreground" /></label></div>
      <div className="mt-4 flex items-center justify-between gap-3">{message ? <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{message.startsWith('Access') && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />}{message}</p> : <span />}<button disabled={pending || !materials.length} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}Approve selected release</button></div>
    </form>
  )
}
