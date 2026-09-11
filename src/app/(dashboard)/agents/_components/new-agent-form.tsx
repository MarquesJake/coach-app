'use client'

import { useId, useState } from 'react'
import { captureAgentResult } from '@/lib/agents/forms'
import { useRouter } from 'next/navigation'
import { createAgentAction } from '../actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { Button } from '@/components/ui/button'

const INPUT_CLASS = 'w-full px-3 py-2 rounded-md border border-border bg-surface text-sm text-foreground placeholder:text-muted-foreground'
const LABEL_CLASS = 'block text-xs font-medium text-foreground mb-1.5'

export function NewAgentForm() {
  const router = useRouter()
  const fieldId = useId()
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
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
    if (loading) return
    const name = form.full_name.trim()
    if (!name) {
      toastError('Name is required')
      return
    }
    if (!form.email.trim() && !form.whatsapp.trim() && !form.phone.trim()) {
      toastError('Add at least one contact route')
      return
    }
    setLoading(true)
    setSaveError(null)
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
    const result = await captureAgentResult(() => createAgentAction(fd))
    setLoading(false)
    if (!result.ok) {
      setSaveError(result.error)
      toastError(result.error)
      return
    }
    toastSuccess('Agent created')
    router.push(result.data?.id ? `/agents/${result.data.id}` : '/agents')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-5 space-y-4">
      {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
      <div>
        <label htmlFor={`${fieldId}-full_name`} className={LABEL_CLASS}>Full name *</label>
        <input id={`${fieldId}-full_name`}
          type="text"
          value={form.full_name}
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
          className={INPUT_CLASS}
          placeholder="e.g. Jane Smith"
          required
        />
      </div>
      <div>
        <label htmlFor={`${fieldId}-agency_name`} className={LABEL_CLASS}>Agency</label>
        <input id={`${fieldId}-agency_name`}
          type="text"
          value={form.agency_name}
          onChange={(e) => setForm((f) => ({ ...f, agency_name: e.target.value }))}
          className={INPUT_CLASS}
          placeholder="e.g. Elite Sports Management"
        />
      </div>
      <div>
        <label htmlFor={`${fieldId}-base_location`} className={LABEL_CLASS}>Base location</label>
        <input id={`${fieldId}-base_location`}
          type="text"
          value={form.base_location}
          onChange={(e) => setForm((f) => ({ ...f, base_location: e.target.value }))}
          className={INPUT_CLASS}
          placeholder="e.g. London"
        />
      </div>
      <div>
        <label htmlFor={`${fieldId}-markets`} className={LABEL_CLASS}>Markets (comma-separated)</label>
        <input id={`${fieldId}-markets`}
          type="text"
          value={form.markets}
          onChange={(e) => setForm((f) => ({ ...f, markets: e.target.value }))}
          className={INPUT_CLASS}
          placeholder="e.g. UK, France, Portugal"
        />
      </div>
      <div>
        <label htmlFor={`${fieldId}-languages`} className={LABEL_CLASS}>Languages (comma-separated)</label>
        <input id={`${fieldId}-languages`}
          type="text"
          value={form.languages}
          onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
          className={INPUT_CLASS}
          placeholder="e.g. English, Spanish"
        />
      </div>
      <div>
        <label htmlFor={`${fieldId}-preferred_contact_channel`} className={LABEL_CLASS}>Preferred contact channel</label>
        <select id={`${fieldId}-preferred_contact_channel`}
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
      <div className="rounded-md border border-border bg-muted/20 p-4">
        <p className="text-xs font-semibold text-foreground">Contact route *</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Add at least one way you can actually reach them.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label>
            <span className={LABEL_CLASS}>Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={INPUT_CLASS} placeholder="name@agency.com" />
          </label>
          <label>
            <span className={LABEL_CLASS}>WhatsApp</span>
            <input type="text" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} className={INPUT_CLASS} placeholder="+44…" />
          </label>
          <label>
            <span className={LABEL_CLASS}>Phone</span>
            <input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={INPUT_CLASS} placeholder="+44…" />
          </label>
        </div>
      </div>
      <div>
        <label htmlFor={`${fieldId}-notes`} className={LABEL_CLASS}>Notes</label>
        <textarea id={`${fieldId}-notes`} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={INPUT_CLASS + ' min-h-[80px]'} placeholder="Optional" />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create agent'}</Button>
        <Button type="button" variant="outline" disabled={loading} onClick={() => router.push('/agents')}>Cancel</Button>
      </div>
    </form>
  )
}
