'use client'

import { useState } from 'react'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { SourceConfidenceFields } from '@/components/source-confidence-fields'
import { createIntelligenceItemAction } from '@/app/(dashboard)/intelligence/actions'
import { toastSuccess } from '@/lib/ui/toast'

const CATEGORY_OPTIONS = ['Media', 'Performance', 'Reputation', 'Contract', 'Background', 'Other']

type Props = {
  coachId: string
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddIntelligenceDrawer({ coachId, open, onClose, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    const title = (formData.get('title') as string)?.trim()
    const category = (formData.get('category') as string)?.trim() || null
    const detail = (formData.get('detail') as string)?.trim() || null
    const occurred_at = (formData.get('occurred_at') as string)?.trim() || null
    const source_type = (formData.get('source_type') as string)?.trim() || null
    const source_name = (formData.get('source_name') as string)?.trim() || null
    const source_link = (formData.get('source_link') as string)?.trim() || null
    const source_notes = (formData.get('source_notes') as string)?.trim() || null
    const confidenceRaw = formData.get('confidence')
    const confidence = confidenceRaw !== '' && confidenceRaw != null ? Math.max(0, Math.min(100, Number(confidenceRaw))) : null
    const verified = formData.get('verified') === 'on'
    const verified_by = (formData.get('verified_by') as string)?.trim() || null

    if (!title) {
      setError('Title is required')
      setSubmitting(false)
      return
    }

    const { error: err } = await createIntelligenceItemAction({
      entity_type: 'coach',
      entity_id: coachId,
      title,
      detail,
      category,
      occurred_at: occurred_at || undefined,
      source_type,
      source_name,
      source_link,
      source_notes,
      confidence,
      verified,
      verified_by,
    })
    setSubmitting(false)
    if (err) {
      setError(err)
      return
    }
    toastSuccess('Evidence item added')
    onClose()
    onSuccess?.()
    form.reset()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Add intelligence"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="add-intelligence-form" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add'}
          </Button>
        </>
      }
    >
      <form id="add-intelligence-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
          <select
            name="category"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="">Select</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
          <input
            name="title"
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Detail</label>
          <textarea
            name="detail"
            rows={3}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
          <input
            type="date"
            name="occurred_at"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
          />
        </div>
        <SourceConfidenceFields />
      </form>
    </Drawer>
  )
}
