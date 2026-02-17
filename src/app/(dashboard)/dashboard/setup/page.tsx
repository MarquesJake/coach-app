'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Club } from '@/lib/types/database'
import { Zap } from 'lucide-react'

export default function SetupPage() {
  const [form, setForm] = useState({
    name: '',
    league: '',
    country: '',
    ownership_model: 'Private',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be signed in to create a club.')
      setSubmitting(false)
      return
    }

    const { error: insertError } = await supabase
      .from('clubs')
      .insert({
        user_id: user.id,
        ...form,
      })
      .select()
      .single() as { data: Club | null; error: unknown }

    if (insertError) {
      setError('Failed to create club. Please try again.')
      setSubmitting(false)
      return
    }

    // Refresh server state so the layout guard recognises the new club,
    // then redirect to the dashboard overview (stable destination).
    router.refresh()
    router.push('/dashboard/overview')
  }

  return (
    <div className="max-w-md mx-auto mt-16 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">Set up your club</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Create your club profile to begin building shortlists.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card-surface rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
            Club Name
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors"
            placeholder="e.g. Manchester United"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
            League
          </label>
          <input
            type="text"
            required
            value={form.league}
            onChange={(e) => setForm({ ...form, league: e.target.value })}
            className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors"
            placeholder="e.g. Premier League"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
            Country
          </label>
          <input
            type="text"
            required
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors"
            placeholder="e.g. England"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
            Ownership Model
          </label>
          <select
            value={form.ownership_model}
            onChange={(e) => setForm({ ...form, ownership_model: e.target.value })}
            className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors"
          >
            <option>Private</option>
            <option>State-owned</option>
            <option>Fan-owned</option>
            <option>Consortium</option>
            <option>Public</option>
          </select>
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creating...' : 'Create Club Profile'}
        </button>
      </form>
    </div>
  )
}
