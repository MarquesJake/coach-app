import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getMandateDetailForUser } from '@/lib/db/mandate'
import { MandateToasts } from '../../_components/mandate-toasts'
import { SelectWithOther } from '@/components/ui/select-with-other'
import { updateMandateAction } from '../../actions'

const RISK_APPETITE = ['Conservative', 'Moderate', 'Aggressive', 'Other']
const CONFIDENTIALITY_LEVELS = ['Standard', 'High', 'Board Only', 'Other']

export default async function MandatePreferencesPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { mandateResult } = await getMandateDetailForUser(user.id, params.id)
  if (mandateResult.error || !mandateResult.data) notFound()

  const mandate = mandateResult.data

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <MandateToasts />
      <Link
        href={`/mandates/${params.id}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-bold uppercase tracking-widest"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to mandate
      </Link>

      <div className="card-surface rounded p-5">
        <h1 className="text-lg font-semibold text-foreground uppercase tracking-wide">Step 2 of 3 — Preferences</h1>
        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Categories, weights, free text</p>
      </div>

      <form action={updateMandateAction} className="card-surface rounded p-5 space-y-4">
        <input type="hidden" name="mandate_id" value={params.id} />

        <label className="space-y-1 block">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Ownership structure</span>
          <input
            name="ownership_structure"
            defaultValue={mandate.ownership_structure ?? ''}
            className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground"
            placeholder="e.g. Private ownership, PLC"
          />
        </label>

        <label className="space-y-1 block">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Board risk appetite</span>
          <SelectWithOther
            name="board_risk_appetite"
            options={RISK_APPETITE}
            defaultValue={mandate.board_risk_appetite ?? 'Moderate'}
            placeholder="Select risk appetite..."
            otherPlaceholder="Type risk appetite..."
          />
        </label>

        <label className="space-y-1 block">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Strategic objective</span>
          <textarea
            name="strategic_objective"
            defaultValue={mandate.strategic_objective ?? ''}
            rows={4}
            className="w-full rounded bg-surface border border-border px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50"
            placeholder="Key objectives, success criteria..."
          />
        </label>

        <label className="space-y-1 block">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Key stakeholders</span>
          <textarea
            name="key_stakeholders"
            defaultValue={(mandate.key_stakeholders ?? []).join(', ')}
            rows={3}
            className="w-full rounded bg-surface border border-border px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50"
            placeholder="One per line or comma-separated — e.g. Chair, Chief Executive"
          />
        </label>

        <label className="space-y-1 block">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Confidentiality level</span>
          <SelectWithOther
            name="confidentiality_level"
            options={CONFIDENTIALITY_LEVELS}
            defaultValue={mandate.confidentiality_level ?? 'High'}
            placeholder="Select level..."
            otherPlaceholder="Type confidentiality level..."
          />
        </label>

        <div className="pt-2 flex items-center justify-end gap-3">
          <Link
            href={`/mandates/${params.id}`}
            className="inline-flex items-center px-4 h-9 bg-surface border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-overlay/30"
          >
            Skip to shortlist
          </Link>
          <button
            type="submit"
            className="inline-flex items-center px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90"
          >
            Next: Shortlist
          </button>
        </div>
      </form>
    </div>
  )
}
