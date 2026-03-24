'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { ArrowLeft } from 'lucide-react'

const OWNERSHIP_TYPES = [
  'Private',
  'Group / Consortium',
  'State / Government',
  'Listed / Public',
  'Fan-owned',
  'Unknown',
]

export default function NewClubPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    country: '',
    league: 'Other',
    tier: '',
    ownership_model: '',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const { error, data } = await supabase.from('clubs').insert({
      user_id: user.id,
      name: form.name.trim(),
      country: form.country.trim() || 'TBC',
      league: form.league.trim() || 'Other',
      tier: form.tier.trim() || undefined,
      ownership_model: form.ownership_model.trim() || undefined,
      notes: form.notes.trim() || null,
    }).select('id').single()
    setLoading(false)
    if (error) {
      toastError(error.message)
      return
    }
    toastSuccess('Club created')
    router.push(`/clubs/${data.id}`)
    router.refresh()
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <Link
        href="/clubs"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-widest"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to clubs
      </Link>
      <h1 className="text-lg font-semibold text-foreground">Add club</h1>
      <form onSubmit={handleSubmit} className="card-surface rounded-xl p-5 space-y-4">
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Name</span>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 w-full h-10 rounded bg-surface border border-border px-3 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Country</span>
          <input
            type="text"
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            placeholder="e.g. England"
            className="mt-1 w-full h-10 rounded bg-surface border border-border px-3 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">League</span>
          <input
            type="text"
            value={form.league}
            onChange={(e) => setForm((f) => ({ ...f, league: e.target.value }))}
            className="mt-1 w-full h-10 rounded bg-surface border border-border px-3 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Tier</span>
          <input
            type="text"
            value={form.tier}
            onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
            placeholder="e.g. Tier 1, Championship"
            className="mt-1 w-full h-10 rounded bg-surface border border-border px-3 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Ownership type</span>
          <select
            value={form.ownership_model}
            onChange={(e) => setForm((f) => ({ ...f, ownership_model: e.target.value }))}
            className="mt-1 w-full h-10 rounded bg-surface border border-border px-3 text-sm"
          >
            <option value="">Select…</option>
            {OWNERSHIP_TYPES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Notes</span>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            className="mt-1 w-full rounded bg-surface border border-border px-3 py-2 text-sm"
          />
        </label>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Create club'}
          </button>
          <Link href="/clubs" className="px-4 h-9 border border-border rounded-lg text-xs font-medium inline-flex items-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
