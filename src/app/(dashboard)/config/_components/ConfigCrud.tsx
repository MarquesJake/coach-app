'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { createConfigAction, updateConfigAction, deleteConfigAction } from '../actions'
import type { ConfigTableName } from '@/lib/db/config'
import type { ConfigRow } from '@/lib/db/config'

type ExtraField = { key: string; label: string; type?: 'text' | 'number'; required?: boolean }

type ConfigCrudProps = {
  table: ConfigTableName
  title: string
  backHref: string
  initialItems: ConfigRow[]
  extraFields?: ExtraField[]
}

export function ConfigCrud({ table, title, backHref, initialItems, extraFields = [] }: ConfigCrudProps) {
  const router = useRouter()
  const [editing, setEditing] = useState<ConfigRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<Record<string, string | number | boolean>>({ name: '', is_active: true })
  const [loading, setLoading] = useState(false)

  function openCreate() {
    setCreating(true)
    setEditing(null)
    setForm({ name: '', is_active: true, ...Object.fromEntries(extraFields.map((f) => [f.key, ''])) })
  }

  function openEdit(item: ConfigRow) {
    setEditing(item)
    setCreating(false)
    const extra: Record<string, string | number | boolean> = {}
    for (const f of extraFields) {
      const v = (item as Record<string, unknown>)[f.key]
      extra[f.key] = v !== undefined && v !== null ? (v as string | number | boolean) : ''
    }
    setForm({ name: item.name, is_active: item.is_active, ...extra })
  }

  function closeForm() {
    setCreating(false)
    setEditing(null)
  }

  async function handleCreate() {
    const name = String(form.name ?? '').trim()
    if (!name) {
      toastError('Name is required')
      return
    }
    setLoading(true)
    const payload: Record<string, unknown> = { name, is_active: form.is_active }
    for (const f of extraFields) {
      const v = form[f.key]
      if (f.type === 'number') payload[f.key] = Number(v) ?? 0
      else payload[f.key] = v !== undefined && v !== '' ? v : null
    }
    const { error } = await createConfigAction(table, payload as Record<string, unknown> & { name: string })
    setLoading(false)
    if (error) {
      toastError(error)
      return
    }
    toastSuccess('Created')
    closeForm()
    router.refresh()
  }

  async function handleUpdate() {
    if (!editing) return
    const name = String(form.name ?? '').trim()
    if (!name) {
      toastError('Name is required')
      return
    }
    setLoading(true)
    const payload: Record<string, unknown> = { name, is_active: form.is_active }
    for (const f of extraFields) {
      const v = form[f.key]
      if (f.type === 'number') payload[f.key] = Number(v) ?? 0
      else payload[f.key] = v !== undefined && v !== '' ? v : null
    }
    const { error } = await updateConfigAction(table, editing.id, payload)
    setLoading(false)
    if (error) {
      toastError(error)
      return
    }
    toastSuccess('Updated')
    closeForm()
    router.refresh()
  }

  async function handleDelete(item: ConfigRow) {
    if (!confirm('Delete this item?')) return
    setLoading(true)
    const { error } = await deleteConfigAction(table, item.id)
    setLoading(false)
    if (error) {
      toastError(error)
      return
    }
    toastSuccess('Deleted')
    router.refresh()
  }

  const showForm = creating || editing

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <Link href={backHref} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-widest">
        <ArrowLeft className="w-3 h-3" />
        Back to Config
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-3.5 h-3.5" />
          Add new
        </button>
      </div>

      {initialItems.length === 0 && !showForm ? (
        <EmptyState
          title="No items yet"
          description={`Add ${title.toLowerCase()} to use in the app.`}
        />
      ) : null}

      {showForm && (
        <div className="card-surface rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">{creating ? 'New item' : 'Edit item'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Name</span>
              <input
                type="text"
                value={String(form.name ?? '')}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full h-10 rounded bg-surface border border-border px-3 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={Boolean(form.is_active)}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground">Active</span>
            </label>
            {extraFields.map((f) => (
              <label key={f.key}>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{f.label}</span>
                <input
                  type={f.type ?? 'text'}
                  value={String(form[f.key] ?? '')}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: f.type === 'number' ? e.target.valueAsNumber : e.target.value }))}
                  required={f.required}
                  className="mt-1 w-full h-10 rounded bg-surface border border-border px-3 text-sm"
                />
              </label>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={creating ? handleCreate : handleUpdate}
              disabled={loading}
              className="px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Saving…' : creating ? 'Create' : 'Save'}
            </button>
            <button type="button" onClick={closeForm} className="px-4 h-9 border border-border rounded-lg text-xs font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {initialItems.length > 0 && (
        <div className="card-surface rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Name</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Order</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Active</th>
                {extraFields.map((f) => (
                  <th key={f.key} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{f.label}</th>
                ))}
                <th className="w-24 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {initialItems.map((item) => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-surface-overlay/30">
                  <td className="px-5 py-3 font-medium text-foreground">{item.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{item.sort_order}</td>
                  <td className="px-5 py-3 text-muted-foreground">{item.is_active ? 'Yes' : 'No'}</td>
                  {extraFields.map((f) => (
                    <td key={f.key} className="px-5 py-3 text-muted-foreground">
                      {String((item as Record<string, unknown>)[f.key] ?? '')}
                    </td>
                  ))}
                  <td className="px-5 py-3 flex gap-2">
                    <button type="button" onClick={() => openEdit(item)} className="text-muted-foreground hover:text-foreground" aria-label="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => handleDelete(item)} className="text-muted-foreground hover:text-destructive" aria-label="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
