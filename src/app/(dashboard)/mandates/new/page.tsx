import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getConfigList } from '@/lib/db/config'
import { FlexibleSelect } from '@/components/ui/flexible-select'
import { MandateToasts } from '../_components/mandate-toasts'
import { MandateStatusSelect } from '../_components/mandate-status-select'
import { SelectWithOther } from '@/components/ui/select-with-other'
import { createMandateStep1Action } from '../actions'

const PRIORITIES = ['High', 'Medium', 'Low', 'Other']

export default async function NewMandatePage({
  searchParams,
}: {
  searchParams: { club_id?: string; club_name?: string }
}) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Pre-fill from club profile "Open mandate" button
  const prefilledClubId = searchParams.club_id ?? null
  const prefilledClubName = searchParams.club_name ? decodeURIComponent(searchParams.club_name) : null

  if (!user) {
    redirect('/login')
  }

  const { data: clubsData, error } = await supabase
    .from('clubs')
    .select('id, name, league')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to load clubs: ${error.message}`)
  }

  const clubs = clubsData ?? []
  const clubOptions = clubs.map((c: { id: string; name: string; league: string }) => ({
    id: c.id,
    label: `${c.name} (${c.league})`,
  }))

  const { data: pipelineStages } = await getConfigList(user.id, 'config_pipeline_stages')
  const pipelineOptions = (pipelineStages ?? []).map((r) => ({ id: r.id, name: r.name }))
  const defaultStatus = pipelineOptions.length > 0 ? pipelineOptions[0].name : 'Active'

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <MandateToasts />
      <Link
        href="/mandates"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-bold uppercase tracking-widest"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to mandates
      </Link>

      <div className="card-surface rounded p-5">
        <h1 className="text-lg font-semibold text-foreground uppercase tracking-wide">Create mandate — Step 1 of 3</h1>
        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Basics: club, role, budget, timeframe, notes</p>
      </div>

      <form action={createMandateStep1Action} className="card-surface rounded p-5 space-y-4">
        {clubOptions.length === 0 && (
          <p className="text-xs text-muted-foreground mb-2">
            Type a club name to create a new club, or add clubs in setup first.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1 md:col-span-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Club</span>
            <FlexibleSelect
              options={clubOptions}
              name="club_id_or_name"
              placeholder="Select or type club name"
              emptyMessage="No clubs"
              noMatchMessage="No match — will create new club"
              allowCustomOnly
              required
              aria-label="Club"
              defaultValue={prefilledClubId ?? undefined}
              defaultDisplay={prefilledClubName ?? undefined}
            />
          </label>

          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Status</span>
            <MandateStatusSelect options={pipelineOptions} defaultValue={defaultStatus} />
          </label>

          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Priority</span>
            <SelectWithOther name="priority" options={PRIORITIES} defaultValue="High" required placeholder="Select priority..." otherPlaceholder="Type priority..." />
          </label>

          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Engagement date</span>
            <input name="engagement_date" type="date" required className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground" />
          </label>

          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Target completion date</span>
            <input name="target_completion_date" type="date" required className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground" />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Budget band</span>
            <input name="budget_band" required className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground" placeholder="e.g. £2M–£4M" />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Succession timeline</span>
            <textarea name="succession_timeline" required rows={2} className="w-full rounded bg-surface border border-border px-3 py-2 text-sm text-foreground" placeholder="e.g. Appointment within 30 days" />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Notes</span>
            <textarea name="strategic_objective" rows={4} className="w-full rounded bg-surface border border-border px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50" placeholder="Strategic objective, context, key requirements..." />
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
            Next: Preferences
          </button>
        </div>
      </form>
    </div>
  )
}
