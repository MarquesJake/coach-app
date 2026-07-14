'use client'

import { useTransition } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FlexibleSelect } from '@/components/ui/flexible-select'
import { upsertTrustedBenchEntryAction } from '../../intelligence/trusted-actions'

const inputClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary'

export function TrustedBenchClient({ coaches, contacts }: { coaches: Array<{ id: string; name: string }>; contacts: Array<{ id: string; full_name: string }> }) {
  const [pending, startTransition] = useTransition()
  return (
    <details>
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-primary"><Plus className="h-4 w-4" />Nominate or move a coach</summary>
      <form className="mt-3 grid gap-3 border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4" action={(formData) => startTransition(async () => {
        const result = await upsertTrustedBenchEntryAction(formData)
        if (!result.ok) { toast.error(result.error); return }
        toast.success('Trusted Bench stage confirmed')
        window.location.reload()
      })}>
        <FlexibleSelect name="coach_id" required options={coaches.map((coach) => ({ id: coach.id, label: coach.name }))} placeholder="Search coach" noMatchMessage="No coach found" selectionOnly />
        <select name="stage" className={inputClass}><option value="nominated">Nominated</option><option value="researching">Researching</option><option value="vetted">Vetted</option><option value="coach_engaged">Coach engaged</option><option value="placement_ready">Placement ready</option><option value="paused">Paused</option></select>
        <select name="nomination_source_contact_id" className={inputClass}><option value="">No nomination source</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.full_name}</option>)}</select>
        <input name="next_review_at" type="datetime-local" className={inputClass} />
        <input name="rationale" placeholder="Analyst rationale" className="sm:col-span-2 lg:col-span-4 rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <div className="grid gap-2 sm:col-span-2 lg:col-span-4 sm:grid-cols-4"><input name="availability_reviewed_at" type="datetime-local" aria-label="Availability reviewed" className={inputClass} /><input name="contract_reviewed_at" type="datetime-local" aria-label="Contract reviewed" className={inputClass} /><input name="staff_reviewed_at" type="datetime-local" aria-label="Staff reviewed" className={inputClass} /><input name="work_permit_reviewed_at" type="datetime-local" aria-label="Work permit reviewed" className={inputClass} /></div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="analyst_confirmed" value="true" required />I confirm this stage change as the responsible analyst.</label>
        <div className="flex justify-end sm:col-span-2"><Button disabled={pending}>{pending ? 'Confirming…' : 'Confirm stage'}</Button></div>
      </form>
    </details>
  )
}
