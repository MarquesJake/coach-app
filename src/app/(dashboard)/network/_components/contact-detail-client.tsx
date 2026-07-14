'use client'

import { useTransition } from 'react'
import { Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FlexibleSelect } from '@/components/ui/flexible-select'
import { createContactCoachRelationshipAction } from '../../intelligence/trusted-actions'

const inputClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary'

export function ContactDetailClient({ contactId, coaches }: { contactId: string; coaches: Array<{ id: string; name: string }> }) {
  const [pending, startTransition] = useTransition()
  return (
    <details>
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-primary"><Link2 className="h-4 w-4" />Link this contact to a coach</summary>
      <form className="mt-3 grid gap-3 border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4" action={(formData) => startTransition(async () => {
        const result = await createContactCoachRelationshipAction(formData)
        if (!result.ok) { toast.error(result.error); return }
        toast.success('Coach relationship added')
        window.location.reload()
      })}>
        <input type="hidden" name="contact_id" value={contactId} />
        <FlexibleSelect name="coach_id" required options={coaches.map((coach) => ({ id: coach.id, label: coach.name }))} placeholder="Search coach" noMatchMessage="No coach found" selectionOnly />
        <input name="relationship_type" required placeholder="e.g. former player" className={inputClass} />
        <input name="role_at_time" placeholder="Source role at the time" className={inputClass} />
        <input name="club_context" placeholder="Club / career context" className={inputClass} />
        <select name="stakeholder_group" className={inputClass} defaultValue="industry_network"><option value="owners_ceos">Owner / CEO</option><option value="sporting_leadership">Sporting leadership</option><option value="coaching_staff">Coaching staff</option><option value="players">Player</option><option value="industry_network">Industry network</option><option value="journalists">Journalist</option><option value="agents">Agent</option><option value="other">Other</option></select>
        <select name="proximity" className={inputClass} defaultValue="direct"><option value="indirect">Indirect</option><option value="working_proximity">Working proximity</option><option value="direct">Direct</option><option value="close">Close</option></select>
        <input name="topic_credibility" placeholder="Credible topics, comma separated" className={inputClass} />
        <input name="confidence" type="number" min="0" max="100" placeholder="Confidence 0–100" className={inputClass} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="first_hand" value="true" defaultChecked />First-hand</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="independence_confirmed" value="true" />Independence confirmed</label>
        <div className="sm:col-span-2 lg:col-span-4"><Button disabled={pending}>{pending ? 'Linking…' : 'Link coach'}</Button></div>
      </form>
    </details>
  )
}
