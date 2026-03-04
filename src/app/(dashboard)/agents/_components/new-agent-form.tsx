'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAgentAction } from '../actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { Button } from '@/components/ui/button'

const INPUT_CLASS = 'w-full px-3 py-2 rounded-md border border-border bg-surface text-sm text-foreground placeholder:text-muted-foreground'
const LABEL_CLASS = 'block text-xs font-medium text-foreground mb-1.5'

export function NewAgentForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    agency_name: '',
    base_location: '',
    markets: '',
    languages: '',
    preferred_contact_channel: '',
    email: '',
    whatsapp: '',
    phone: '',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = form.full_name.trim()
    if (!name) {
      toastError('Name is required')
      return
    }
    setLoading(true)
    const fd = new FormData()
    fd.set('full_name', name)
    fd.set('agency_name', form.agency_name.trim())
    fd.set('base_location', form.base_location.trim())
    fd.set('markets', form.markets.trim())
    fd.set('languages', form.languages.trim())
    fd.set('preferred_contact_channel', form.preferred_contact_channel.trim())
    fd.set('email', form.email.trim())
    fd.set('whatsapp', form.whatsapp.trim())
    fd.set('phone', form.phone.trim())
    fd.set('notes', form.notes.trim())
    const result = await createAgentAction(fd)
    setLoading(false)
    if (!result.ok) {
      toastError(result.error)
      return
    }
    toastSuccess('Agent created')
    router.push(result.data?.id ? `/agents/${result.data.id}` : '/agents')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div>
        <label className={LABEL_CLASS}>Full name *</label>
        <input
          type="text"
          value={form.full_name}
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
          className={INPUT_CLASS}
          placeholder="e.g. Jane Smith"
          required
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>Agency</label>
        <input
          type="text"
          value={form.agency_name}
          onChange={(e) => setForm((f) => ({ ...f, agency_name: e.target.value }))}
          className={INPUT_CLASS}
          placeholder="e.g. Elite Sports Management"
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>Base location</label>
        <input
          type="text"
          value={form.base_location}
          onChange={(e) => setForm((f) => ({ ...f, base_location: e.target.value }))}
          className={INPUT_CLASS}
          placeholder="e.g. London"
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>Markets (comma-separated)</label>
        <input
          type="text"
          value={form.markets}
          onChange={(e) => setForm((f) => ({ ...f, markets: e.target.value }))}
          className={INPUT_CLASS}
          placeholder="e.g. UK, France, Portugal"
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>Languages (comma-separated)</label>
        <input
          type="text"
          value={form.languages}
          onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
          className={INPUT_CLASS}
          placeholder="e.g. English, Spanish"
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>Preferred contact channel</label>
        <select
          value={form.preferred_contact_channel}
          onChange={(e) => setForm((f) => ({ ...f, preferred_contact_channel: e.target.value }))}
          className={INPUT_CLASS}
        >
          <option value="">—</option>
          <option value="Email">Email</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Phone">Phone</option>
          <option value="In person">In person</option>
        </select>
      </div>
      <div>
        <label className={LABEL_CLASS}>Email</label>
        <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={INPUT_CLASS} placeholder="Optional" />
      </div>
      <div>
        <label className={LABEL_CLASS}>WhatsApp</label>
        <input type="text" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} className={INPUT_CLASS} placeholder="Optional" />
      </div>
      <div>
        <label className={LABEL_CLASS}>Phone</label>
        <input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={INPUT_CLASS} placeholder="Optional" />
      </div>
      <div>
        <label className={LABEL_CLASS}>Notes</label>
        <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={INPUT_CLASS + ' min-h-[80px]'} placeholder="Optional" />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create agent'}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
