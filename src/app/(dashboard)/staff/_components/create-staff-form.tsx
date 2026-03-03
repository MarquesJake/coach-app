'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createStaffAction } from '../actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { Button } from '@/components/ui/button'

export function CreateStaffForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [primaryRole, setPrimaryRole] = useState('')
  const [notes, setNotes] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = fullName.trim()
    if (!name) {
      toastError('Full name is required')
      return
    }
    setLoading(true)
    const { data, error } = await createStaffAction({ full_name: name, primary_role: primaryRole.trim() || null, notes: notes.trim() || null })
    setLoading(false)
    if (error) {
      toastError(error)
      return
    }
    toastSuccess('Staff created')
    router.push(data?.id ? `/staff/${data.id}` : '/staff')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface rounded-lg p-5 space-y-4">
      <div>
        <label className="block text-xs font-medium text-foreground mb-1.5">Full name *</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm"
          placeholder="e.g. John Smith"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-foreground mb-1.5">Primary role</label>
        <input
          type="text"
          value={primaryRole}
          onChange={(e) => setPrimaryRole(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm"
          placeholder="e.g. Assistant coach"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-foreground mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm min-h-[80px]"
          placeholder="Optional notes"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create staff'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
