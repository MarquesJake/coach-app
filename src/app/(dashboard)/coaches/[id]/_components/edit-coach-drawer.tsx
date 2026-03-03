'use client'

import { useState } from 'react'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'

export type EditCoachField =
  | { key: string; label: string; type: 'text'; placeholder?: string; helperText?: string }
  | { key: string; label: string; type: 'textarea'; placeholder?: string; helperText?: string; rows?: number }
  | { key: string; label: string; type: 'number'; min?: number; max?: number; placeholder?: string; helperText?: string }
  | { key: string; label: string; type: 'checkbox'; helperText?: string }
  | { key: string; label: string; type: 'comma'; placeholder?: string; helperText?: string }

type Props = {
  title: string
  triggerLabel: string
  fields: EditCoachField[]
  initialValues: Record<string, unknown>
  onSave: (payload: Record<string, unknown>) => Promise<{ ok?: boolean; error?: string | null }>
  onSuccess?: () => void
  /** When set, drawer is controlled by parent (no internal trigger). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** When false, do not render the trigger button (use with open/onOpenChange). */
  renderTrigger?: boolean
}

const inputClass = 'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground'

function getDefaultValue(field: EditCoachField, initial: unknown): string | number | boolean {
  if (field.type === 'checkbox') return initial === true || initial === 'true'
  if (field.type === 'comma' && Array.isArray(initial)) return initial.join(', ')
  if (field.type === 'comma' && typeof initial === 'string') return initial
  if (field.type === 'number') {
    if (initial == null || initial === '') return ''
    const n = Number(initial)
    return Number.isNaN(n) ? '' : n
  }
  if (initial == null || initial === undefined) return ''
  return String(initial)
}

export function EditCoachDrawer({ title, triggerLabel, fields, initialValues, onSave, onSuccess, open: controlledOpen, onOpenChange, renderTrigger = true }: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    const payload: Record<string, unknown> = {}
    for (const field of fields) {
      if (field.type === 'checkbox') {
        payload[field.key] = formData.get(field.key) === 'on'
        continue
      }
      if (field.type === 'comma') {
        const v = formData.get(field.key)
        const s = v != null ? String(v).trim() : ''
        payload[field.key] = s ? s.split(',').map((x) => x.trim()).filter(Boolean) : []
        continue
      }
      if (field.type === 'number') {
        const v = formData.get(field.key)
        if (v === '' || v === null || v === undefined) {
          payload[field.key] = null
          continue
        }
        const n = Number(v)
        if (Number.isNaN(n)) {
          payload[field.key] = null
          continue
        }
        const min = field.min ?? 0
        const max = field.max ?? 100
        payload[field.key] = Math.min(max, Math.max(min, n))
        continue
      }
      const v = formData.get(field.key)
      const s = v != null ? String(v).trim() : ''
      payload[field.key] = s === '' ? null : s
    }
    const result = await onSave(payload)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setOpen(false)
    onSuccess?.()
  }

  return (
    <>
      {renderTrigger && (
        <Button variant="outline" onClick={() => { setOpen(true); setError(null) }}>
          {triggerLabel}
        </Button>
      )}
      <Drawer
        open={open}
        onClose={() => { setOpen(false); setError(null) }}
        title={title}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="edit-coach-form" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        }
      >
        <form id="edit-coach-form" onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {fields.map((field) => (
            <div key={field.key}>
              {field.type === 'checkbox' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name={field.key}
                    defaultChecked={getDefaultValue(field, initialValues[field.key]) as boolean}
                    className="rounded border-border"
                  />
                  <label className="text-sm font-medium text-foreground">{field.label}</label>
                </div>
              ) : (
                <>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      name={field.key}
                      defaultValue={getDefaultValue(field, initialValues[field.key]) as string}
                      placeholder={field.placeholder}
                      rows={field.rows ?? 3}
                      className={`${inputClass} resize-none`}
                    />
                  ) : field.type === 'number' ? (
                    <input
                      type="number"
                      name={field.key}
                      defaultValue={getDefaultValue(field, initialValues[field.key]) as number | ''}
                      placeholder={field.placeholder}
                      min={field.min ?? 0}
                      max={field.max ?? 100}
                      step="1"
                      className={inputClass}
                    />
                  ) : (
                    <input
                      type="text"
                      name={field.key}
                      defaultValue={getDefaultValue(field, initialValues[field.key]) as string}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  )}
                </>
              )}
              {field.helperText && (
                <p className="text-[10px] text-muted-foreground mt-1">{field.helperText}</p>
              )}
            </div>
          ))}
        </form>
      </Drawer>
    </>
  )
}
