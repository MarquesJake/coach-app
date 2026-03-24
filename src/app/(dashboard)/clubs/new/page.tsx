'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { ArrowLeft, Search, Loader2, X } from 'lucide-react'

const OWNERSHIP_TYPES = [
  'Private',
  'Group / Consortium',
  'State / Government',
  'Listed / Public',
  'Fan-owned',
  'Unknown',
]

type SearchResult = {
  external_id: string
  external_source: string
  name: string
  league: string
  country: string
  badge_url: string | null
  description: string | null
  manager: string | null
}

export default function NewClubPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [imported, setImported] = useState<{ external_id: string; external_source: string } | null>(null)
  const [form, setForm] = useState({
    name: '',
    country: '',
    league: 'Other',
    tier: '',
    ownership_model: '',
    notes: '',
  })

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchResults([])
    try {
      const res = await fetch(`/api/integrations/clubs/search?q=${encodeURIComponent(searchQuery)}`)
      const { results } = await res.json()
      setSearchResults(results ?? [])
    } catch {
      toastError('Search failed')
    }
    setSearching(false)
  }

  function handleImport(result: SearchResult) {
    setForm({
      name: result.name,
      country: result.country,
      league: result.league || 'Other',
      tier: '',
      ownership_model: '',
      notes: result.description ?? '',
    })
    setImported({ external_id: result.external_id, external_source: result.external_source })
    setSearchResults([])
    setSearchQuery('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { error, data } = await supabase.from('clubs').insert({
      user_id: user.id,
      name: form.name.trim(),
      country: form.country.trim() || 'TBC',
      league: form.league.trim() || 'Other',
      tier: form.tier.trim() || undefined,
      ownership_model: form.ownership_model.trim() || undefined,
      notes: form.notes.trim() || null,
      ...(imported ?? {}),
    }).select('id').single()

    setLoading(false)
    if (error) { toastError(error.message); return }
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

      {/* Search & import */}
      <div className="card-surface rounded-xl p-5 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Import from database
        </p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a real club e.g. Arsenal…"
            className="flex-1 h-10 rounded bg-surface border border-border px-3 text-sm"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-4 h-10 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {searching
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Search className="w-3.5 h-3.5" />}
            Search
          </button>
        </form>

        {searchResults.length > 0 && (
          <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {searchResults.map((r) => (
              <li key={r.external_id} className="flex items-center justify-between px-4 py-2.5 bg-surface hover:bg-surface-overlay/30 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.league} · {r.country}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleImport(r)}
                  className="shrink-0 text-xs text-primary hover:underline font-medium"
                >
                  Import
                </button>
              </li>
            ))}
          </ul>
        )}

        {searchResults.length === 0 && searchQuery && !searching && (
          <p className="text-xs text-muted-foreground">No results. Fill in the form below manually.</p>
        )}

        {imported && (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            Imported from TheSportsDB — edit any fields below
            <button
              type="button"
              onClick={() => setImported(null)}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Form */}
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
