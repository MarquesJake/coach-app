'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createStaffAction, updateStaffAction } from '../actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { Button } from '@/components/ui/button'

export function CreateStaffForm({ staff }: { staff?: { id: string; full_name: string; primary_role: string | null; notes: string | null } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState(staff?.full_name ?? '')
  const [primaryRole, setPrimaryRole] = useState(staff?.primary_role ?? '')
  const [notes, setNotes] = useState(staff?.notes ?? '')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    const name = fullName.trim()
    if (!name) {
      toastError('Full name is required')
      return
    }
    setLoading(true)
    setSaveError(null)
    setSaved(false)
    try {
      const input = { full_name: name, primary_role: primaryRole.trim() || null, notes: notes.trim() || null }
      const result = staff ? { ...await updateStaffAction(staff.id, input), data: { id: staff.id } } : await createStaffAction(input)
      if (result.error || !result.data?.id) {
        setSaveError(result.error || 'Save was not confirmed. Please check the directory before retrying.')
        return
      }
      setSaved(true)
      toastSuccess(staff ? 'Staff details saved' : 'Staff created')
      if (!staff) router.push(`/staff/${result.data.id}`)
      router.refresh()
    } catch {
      setSaveError('Save could not be confirmed. Your entries are retained. Check the saved record before retrying.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface rounded-lg p-5 space-y-4">
      {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
      {saved && <p role="status" className="text-sm text-muted-foreground">Staff details saved.</p>}
      <div>
        <label className="block text-xs font-medium text-foreground mb-1.5">Full name *</label>
        <input
          aria-label="Full name"
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
          aria-label="Primary role"
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
          aria-label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm min-h-[80px]"
          placeholder="Optional notes"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : staff ? 'Save details' : 'Create staff'}
        </Button>
        <Button type="button" variant="outline" disabled={loading} onClick={() => router.push('/staff')}>
          Back to staff
        </Button>
      </div>
    </form>
  )
}
