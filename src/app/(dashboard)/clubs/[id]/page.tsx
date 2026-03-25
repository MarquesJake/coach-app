'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { ClubAgentsSection } from './_components/club-agents-section'
import { ClubSeasonResultsSection } from './_components/club-season-results-section'

const OWNERSHIP_TYPES = [
  'Private',
  'Group / Consortium',
  'State / Government',
  'Listed / Public',
  'Fan-owned',
  'Unknown',
]


type Club = {
  id: string
  name: string
  country: string
  league: string
  tier: string | null
  ownership_model: string | null
  notes: string | null
  badge_url: string | null
  description: string | null
  stadium: string | null
  founded_year: string | null
  external_source: string | null
  current_manager: string | null
  website: string | null
  stadium_location: string | null
  stadium_capacity: string | null
  id_league: string | null
  last_synced_at: string | null
  squad_synced_at: string | null
  coaches_synced_at: string | null
}

export default function ClubOverviewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [club, setClub] = useState<Club | null>(null)
  const [form, setForm] = useState({
    name: '',
    country: '',
    league: '',
    tier: '',
    ownership_model: '',
    notes: '',
    description: '',
    stadium: '',
    founded_year: '',
    current_manager: '',
    website: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('clubs')
      .select('id, name, country, league, tier, ownership_model, notes, badge_url, description, stadium, founded_year, external_source, current_manager, website, stadium_location, stadium_capacity, id_league, last_synced_at, squad_synced_at, coaches_synced_at')
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
          tier: d.tier ?? '',
          ownership_model: d.ownership_model ?? '',
          notes: d.notes ?? '',
          description: d.description ?? '',
          stadium: d.stadium ?? '',
          founded_year: d.founded_year ?? '',
          current_manager: d.current_manager ?? '',
          website: d.website ?? '',
        })

        // Auto-sync squad + coaches if never synced or >48h ago
        if (d.external_source === 'api-football') {
          const stale = (ts: string | null) => {
            if (!ts) return true
            return Date.now() - new Date(ts).getTime() > 48 * 60 * 60 * 1000
          }
          if (stale(d.squad_synced_at) || stale(d.coaches_synced_at)) {
            fetch(`/api/integrations/clubs/sync-club/${id}`, { method: 'POST' }).catch(() => {})
          }
        }
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
        tier: form.tier.trim() || undefined,
        ownership_model: form.ownership_model.trim() || undefined,
        notes: form.notes.trim() || null,
        description: form.description.trim() || null,
        stadium: form.stadium.trim() || null,
        founded_year: form.founded_year.trim() || null,
        current_manager: form.current_manager.trim() || null,
        website: form.website.trim() || null,
        updated_at: new Date().toISOString(),
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
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }
  if (!club) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Club not found.</p>
        <Link href="/clubs" className="text-xs text-primary hover:underline">Back to clubs</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* External context panel — shown when synced from TheSportsDB */}
      {(club.description || club.stadium || club.founded_year || club.current_manager || club.website) && (
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Club context</h2>
            {club.external_source && (
              <span className="text-[10px] text-emerald-400 font-medium">via TheSportsDB</span>
            )}
          </div>
          <div className="flex gap-4 flex-wrap">
            {club.stadium && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Stadium</p>
                <p className="text-sm text-foreground mt-0.5">{club.stadium}</p>
              </div>
            )}
            {club.founded_year && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Founded</p>
                <p className="text-sm text-foreground mt-0.5">{club.founded_year}</p>
              </div>
            )}
            {club.current_manager && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Manager</p>
                <p className="text-sm text-foreground mt-0.5">{club.current_manager}</p>
              </div>
            )}
            {club.website && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Website</p>
                <a
                  href={club.website.startsWith('http') ? club.website : `https://${club.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-0.5 block"
                >
                  {club.website}
                </a>
              </div>
            )}
          </div>
          {club.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{club.description}</p>
          )}
        </section>
      )}

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-medium text-foreground mb-4">Club details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Stadium</span>
              <input
                type="text"
                value={form.stadium}
                onChange={(e) => setForm((f) => ({ ...f, stadium: e.target.value }))}
                placeholder="Home ground"
                className="mt-1 w-full h-10 rounded bg-surface border border-border px-3 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Founded</span>
              <input
                type="text"
                value={form.founded_year}
                onChange={(e) => setForm((f) => ({ ...f, founded_year: e.target.value }))}
                placeholder="e.g. 1892"
                className="mt-1 w-full h-10 rounded bg-surface border border-border px-3 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Current manager</span>
              <input
                type="text"
                value={form.current_manager}
                onChange={(e) => setForm((f) => ({ ...f, current_manager: e.target.value }))}
                placeholder="e.g. Pep Guardiola"
                className="mt-1 w-full h-10 rounded bg-surface border border-border px-3 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Website</span>
              <input
                type="text"
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                placeholder="e.g. www.mancity.com"
                className="mt-1 w-full h-10 rounded bg-surface border border-border px-3 text-sm"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Club overview / description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Brief overview of the club — auto-filled from TheSportsDB on import"
              className="mt-1 w-full rounded bg-surface border border-border px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Internal notes</span>
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
      </section>

      <ClubSeasonResultsSection clubId={id} />

      <ClubAgentsSection clubId={id} />
    </div>
  )
}
