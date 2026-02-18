import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createMandateAction } from '../actions'

const MANDATE_STATUS = ['Active', 'In Progress', 'Completed', 'On Hold']
const PRIORITIES = ['High', 'Medium', 'Low']
const RISK_APPETITE = ['Conservative', 'Moderate', 'Aggressive']
const CONFIDENTIALITY_LEVELS = ['Standard', 'High', 'Board Only']

function readSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function NewMandatePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: clubs, error } = await supabase
    .from('clubs')
    .select('id, name, league')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to load clubs: ${error.message}`)
  }

  const message = readSearchParam(searchParams?.error)

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link
        href="/mandates"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-bold uppercase tracking-widest"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to mandates
      </Link>

      <div className="card-surface rounded p-5">
        <h1 className="text-lg font-semibold text-foreground uppercase tracking-wide">Create mandate</h1>
        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Add a new engagement record</p>
      </div>

      {message && (
        <div className="rounded border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs text-red-400">
          {message}
        </div>
      )}

      {clubs.length === 0 ? (
        <div className="card-surface rounded p-6 text-sm text-muted-foreground">
          Add a club in setup before creating a mandate.
        </div>
      ) : (
        <form action={createMandateAction} className="card-surface rounded p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Club</span>
              <select
                name="club_id"
                required
                className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground"
                defaultValue=""
              >
                <option value="" disabled>Select club</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>{club.name} ({club.league})</option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Status</span>
              <select name="status" required className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground" defaultValue="Active">
                {MANDATE_STATUS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Engagement date</span>
              <input name="engagement_date" type="date" required className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground" />
            </label>

            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Target completion date</span>
              <input name="target_completion_date" type="date" required className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground" />
            </label>

            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Priority</span>
              <select name="priority" required className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground" defaultValue="High">
                {PRIORITIES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Board risk appetite</span>
              <select name="board_risk_appetite" required className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground" defaultValue="Moderate">
                {RISK_APPETITE.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Ownership structure</span>
              <input name="ownership_structure" required className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground" />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Budget band</span>
              <input name="budget_band" required className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground" />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Strategic objective</span>
              <textarea name="strategic_objective" required rows={4} className="w-full rounded bg-surface border border-border px-3 py-2 text-sm text-foreground" />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Succession timeline</span>
              <textarea name="succession_timeline" required rows={3} className="w-full rounded bg-surface border border-border px-3 py-2 text-sm text-foreground" />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Key stakeholders</span>
              <input
                name="key_stakeholders"
                placeholder="Chair, Chief Executive, Sporting Director"
                className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground"
              />
            </label>

            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Confidentiality level</span>
              <select name="confidentiality_level" required className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground" defaultValue="High">
                {CONFIDENTIALITY_LEVELS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              href="/mandates"
              className="inline-flex items-center px-4 h-9 bg-surface border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-overlay/30"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90"
            >
              Create mandate
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
