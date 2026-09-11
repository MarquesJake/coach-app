'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { CheckCircle2, LoaderCircle, ShieldCheck } from 'lucide-react'
import { approveDossierOrderAction } from '../actions'

type Material = {
  id: string
  title: string
  material_type: string
  verification_status: string
  upload_status: string
  storage_path: string | null
  confidentiality_status: string
}

export function ReleaseOrderForm({ orderId, coachId, materials }: { orderId: string; coachId: string; materials: Material[] }) {
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const confirmed = useRef(false)
  const [message, setMessage] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [released, setReleased] = useState(false)

  async function release(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current || confirmed.current) return
    const data = new FormData(event.currentTarget)
    if (!data.getAll('material_id').length) { setFailed(true); setMessage('Select at least one reviewed file.'); return }
    busy.current = true
    setPending(true)
    setMessage(null)
    try {
      const result = await approveDossierOrderAction(data)
      setFailed(!result.ok)
      if (result.ok) { confirmed.current = true; setReleased(true) }
      setMessage(result.ok ? 'Access released to the club.' : result.error)
    } catch {
      setFailed(true)
      setMessage('Release not confirmed. Your selections remain here. Refresh the desk and check access before retrying.')
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  return (
    <form onSubmit={release} aria-busy={pending} className="mt-4 rounded-md border border-border bg-background p-4">
      <input type="hidden" name="order_id" value={orderId} />
      <fieldset disabled={pending || released}>
      <p className="text-xs font-semibold text-foreground">Choose what this club can see</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {materials.map((material) => <label key={material.id} className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-card p-3"><input type="checkbox" name="material_id" value={material.id} checked={selected.includes(material.id)} onChange={event => setSelected(current => event.target.checked ? [...current, material.id] : current.filter(id => id !== material.id))} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" /><span><span className="block text-xs font-medium text-foreground">{material.title}</span><span className="mt-0.5 block text-[10px] uppercase text-muted-foreground">{material.material_type.replace('_', ' ')} · {material.verification_status}</span></span></label>)}
        {!materials.length && <div className="text-xs leading-5 text-muted-foreground sm:col-span-2"><p>No checked files ready to release. Upload the file and mark it checked in the coach portal first.</p><Link href={`/coach-portal/${coachId}`} className="mt-2 inline-flex font-semibold text-primary">Review coach materials</Link></div>}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[130px_160px_minmax(0,1fr)] sm:items-end"><label><span className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Access days</span><input name="access_days" required type="number" min="1" max="365" defaultValue="30" className="w-full rounded-md border border-input bg-card px-3 py-2 text-xs text-foreground" /></label><label className="flex h-9 items-center gap-2 text-xs text-foreground"><input type="checkbox" name="permit_download" className="h-4 w-4 accent-[var(--primary)]" />Permit downloads</label><label><span className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Release note</span><input name="release_note" placeholder="Scope or coach permission note" className="w-full rounded-md border border-input bg-card px-3 py-2 text-xs text-foreground" /></label></div>
      </fieldset><div className="mt-4 flex flex-wrap items-center justify-between gap-3">{message ? <p role={failed ? 'alert' : 'status'} className="flex items-center gap-1.5 text-xs text-muted-foreground">{message.startsWith('Access') && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />}{message}</p> : <span />}<button disabled={pending || released || !selected.some(id => materials.some(material => material.id === id))} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}Approve selected release</button></div>
    </form>
  )
}
