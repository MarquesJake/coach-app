'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { ArrowLeft } from 'lucide-react'
import { ClubAgentsSection } from './_components/club-agents-section'

type Club = { id: string; name: string; country: string; league: string; notes: string | null }

export default function EditClubPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [club, setClub] = useState<Club | null>(null)
  const [form, setForm] = useState({ name: '', country: '', league: '', notes: '' })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('clubs')
      .select('id, name, country, league, notes')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        setLoading(false)
        if (error || !data) {
          toastError(error?.message ?? 'Club not found')
          return
        }
        const d = data as Club
        setClub(d)
        setForm({
          name: d.name,
          country: d.country ?? '',
          league: d.league ?? '',
          notes: d.notes ?? '',
        })
      })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!club) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('clubs')
      .update({
        name: form.name.trim(),
        country: form.country.trim() || 'TBC',
        league: form.league.trim() || 'Other',
        notes: form.notes.trim() || null,
      })
      .eq('id', id)
    setSaving(false)
    if (error) {
      toastError(error.message)
      return
    }
    toastSuccess('Club updated')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this club? This cannot be undone.')) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('clubs').delete().eq('id', id)
    setSaving(false)
    if (error) {
      toastError(error.message)
      return
    }
    toastSuccess('Club deleted')
    router.push('/clubs')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto space-y-5">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }
  if (!club) {
    return (
      <div className="max-w-xl mx-auto space-y-5">
        <p className="text-sm text-muted-foreground">Club not found.</p>
        <Link href="/clubs" className="text-xs text-primary hover:underline">Back to clubs</Link>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <ClubAgentsSection clubId={id} />
      <Link
        href="/clubs"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-widest"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to clubs
      </Link>
      <h1 className="text-lg font-semibold text-foreground">Edit club</h1>
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
            disabled={saving}
            className="px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <Link href="/clubs" className="px-4 h-9 border border-border rounded-lg text-xs font-medium inline-flex items-center">
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="ml-auto px-4 h-9 border border-red-500/50 text-red-500 rounded-lg text-xs font-medium hover:bg-red-500/10 disabled:opacity-50"
          >
            Delete club
          </button>
        </div>
      </form>
    </div>
  )
}
