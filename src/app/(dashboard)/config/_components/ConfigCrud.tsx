'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { configPayload } from '@/lib/config/editor'
import { useUnsavedChanges } from '@/lib/ui/use-unsaved-changes'
import { createConfigAction, updateConfigAction, deleteConfigAction } from '../actions'
import type { ConfigTableName, ConfigRow } from '@/lib/db/config'

type ExtraField = { key: string; label: string; type?: 'text' | 'number'; required?: boolean }
type ConfigCrudProps = {
  table: ConfigTableName
  title: string
  backHref: string
  initialItems: ConfigRow[]
  loadError?: boolean
  extraFields?: ExtraField[]
}

export function ConfigCrud({ table, title, backHref, initialItems, loadError = false, extraFields = [] }: ConfigCrudProps) {
  const router = useRouter()
  const [editing, setEditing] = useState<ConfigRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<Record<string, string | number | boolean>>({ name: '', is_active: true })
  const [loading, setLoading] = useState(false)
  const busy = useRef(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const confirmDiscard = useUnsavedChanges(dirty)

  function openForm(item: ConfigRow | null) {
    if (busy.current || !confirmDiscard()) return
    const extra: Record<string, string | number | boolean> = {}
    for (const field of extraFields) extra[field.key] = (item as Record<string, string | number | boolean> | null)?.[field.key] ?? ''
    setEditing(item)
    setCreating(!item)
    setForm({ name: item?.name ?? '', is_active: item?.is_active ?? true, ...extra })
    setDirty(false)
    setError(null)
    setMessage(null)
  }

  function closeForm() {
    if (busy.current || !confirmDiscard()) return
    setCreating(false)
    setEditing(null)
    setDirty(false)
    setError(null)
  }

  function patch(key: string, value: string | boolean) {
    setForm(current => ({ ...current, [key]: value }))
    setDirty(true)
    setMessage(null)
    setError(null)
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current || loadError) return
    const parsed = configPayload(table, form)
    if (parsed.error !== null) { setError(parsed.error); return }
    busy.current = true
    setLoading(true)
    setError(null)
    try {
      const result = editing
        ? await updateConfigAction(table, editing.id, parsed.payload)
        : await createConfigAction(table, parsed.payload)
      if (result.error) { setError(result.error); return }
      setMessage(`${parsed.payload.name} saved.`)
      setDirty(false)
      setCreating(false)
      setEditing(null)
      router.refresh()
    } catch {
      setError('Save not confirmed. Your edits are still here. Check your connection and retry.')
    } finally {
      busy.current = false
      setLoading(false)
    }
  }

  async function handleDelete(item: ConfigRow) {
    if (busy.current || loadError || !confirmDiscard() || !window.confirm(`Delete "${item.name}"? Consider making it inactive if it is still used by existing records.`)) return
    busy.current = true
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const result = await deleteConfigAction(table, item.id)
      if (result.error) { setError(result.error); return }
      setMessage(`${item.name} deleted.`)
      setCreating(false)
      setEditing(null)
      setDirty(false)
      router.refresh()
    } catch {
      setError('Deletion not confirmed. Refresh the list before trying again.')
    } finally {
      busy.current = false
      setLoading(false)
    }
  }

  const showForm = creating || editing !== null
  return (
    <div className="mx-auto max-w-[1400px] space-y-5" aria-busy={loading}>
      <Link href={backHref} className="inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to configuration</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-lg font-semibold text-foreground">{title}</h1><p className="mt-1 text-sm text-muted-foreground">Maintain your saved options. Use inactive to retain an option without offering it for new selections.</p></div>
        <button type="button" onClick={() => openForm(null)} disabled={loading || loadError} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"><Plus className="h-4 w-4" />Add new</button>
      </div>
      {loadError && <div role="alert" className="rounded-lg border border-destructive/30 p-4"><p>The list could not be loaded. No empty-list result has been assumed.</p><button type="button" onClick={() => router.refresh()} className="mt-3 min-h-10 underline">Retry loading</button></div>}
      {error && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="rounded-lg border border-primary/20 p-3 text-sm">{message}</p>}
      {!loadError && initialItems.length === 0 && !showForm && <EmptyState title="No saved options yet" description={`Use Add new to record ${title.toLowerCase()}.`} />}
      {showForm && <form onSubmit={handleSave} className="card-surface space-y-4 rounded-xl p-5">
        <h2 className="text-sm font-semibold">{creating ? 'New item' : `Edit ${editing?.name}`}</h2>
        <fieldset disabled={loading} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label><span className="text-sm font-medium">Name</span><input autoFocus required type="text" value={String(form.name ?? '')} onChange={e => patch('name', e.target.value)} className="mt-1 h-10 w-full rounded border border-border bg-surface px-3 text-sm" /></label>
          <label className="flex min-h-10 items-center gap-2 md:pt-6"><input type="checkbox" checked={Boolean(form.is_active)} onChange={e => patch('is_active', e.target.checked)} /><span className="text-sm">Active for new selections</span></label>
          {extraFields.map(field => <label key={field.key}><span className="text-sm font-medium">{field.label}{field.required ? ' (required)' : ''}</span><input type={field.type ?? 'text'} step={field.type === 'number' ? 'any' : undefined} min={field.type === 'number' ? 0 : undefined} value={String(form[field.key] ?? '')} onChange={e => patch(field.key, e.target.value)} required={field.required} className="mt-1 h-10 w-full rounded border border-border bg-surface px-3 text-sm" /></label>)}
        </fieldset>
        <div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={loading} className="min-h-10 rounded-lg bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50">{loading ? 'Saving...' : creating ? 'Create option' : 'Save changes'}</button><button type="button" disabled={loading} onClick={closeForm} className="min-h-10 rounded-lg border border-border px-4 text-sm">Cancel</button><span role="status" className="text-xs text-muted-foreground">{dirty ? 'Unsaved changes' : ''}</span></div>
      </form>}
      {!loadError && initialItems.length > 0 && <div className="card-surface relative overflow-x-auto rounded-xl" role="region" aria-label={`${title} options`} tabIndex={0}>
        <table className="w-full text-sm"><caption className="sr-only">{title}: saved options and edit controls</caption><thead><tr className="border-b border-border bg-surface/50">
          {['Name', 'Order', 'Active', ...extraFields.map(field => field.label), 'Actions'].map(label => <th key={label} scope="col" className="px-4 py-3 text-left text-xs font-semibold">{label}</th>)}
        </tr></thead><tbody>{initialItems.map(item => <tr key={item.id} className="border-b border-border/50">
          <th scope="row" className="px-4 py-3 text-left font-medium">{item.name}</th><td className="px-4 py-3">{item.sort_order}</td><td className="px-4 py-3">{item.is_active ? 'Yes' : 'No'}</td>
          {extraFields.map(field => <td key={field.key} className="px-4 py-3">{String((item as Record<string, unknown>)[field.key] ?? 'Not set')}</td>)}
          <td className="px-4 py-3"><div className="flex gap-2"><button type="button" disabled={loading} onClick={() => openForm(item)} className="flex h-10 w-10 items-center justify-center rounded border border-border" aria-label={`Edit ${item.name}`}><Pencil className="h-4 w-4" /></button><button type="button" disabled={loading} onClick={() => handleDelete(item)} className="flex h-10 w-10 items-center justify-center rounded border border-border text-destructive" aria-label={`Delete ${item.name}`}><Trash2 className="h-4 w-4" /></button></div></td>
        </tr>)}</tbody></table>
      </div>}
    </div>
  )
}
