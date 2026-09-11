'use client'

import { Link2 } from 'lucide-react'
import Link from 'next/link'
import { NetworkForm } from './network-form'
import { Button } from '@/components/ui/button'
import { FlexibleSelect } from '@/components/ui/flexible-select'
import { createContactCoachRelationshipAction } from '../../intelligence/trusted-actions'

const inputClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary'

export function ContactDetailClient({ contactId, coaches }: { contactId: string; coaches: Array<{ id: string; name: string }> }) {
  return (
    <details>
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-primary"><Link2 className="h-4 w-4" />Link this contact to a coach</summary>
      <NetworkForm action={createContactCoachRelationshipAction} success="Coach relationship saved. Review this source before using its statements as evidence.">
        <input type="hidden" name="contact_id" value={contactId} />
        <FlexibleSelect name="coach_id" required options={coaches.map((coach) => ({ id: coach.id, label: coach.name }))} placeholder="Search coach" noMatchMessage="No coach found" selectionOnly />
        <input name="relationship_type" required placeholder="e.g. former player" className={inputClass} />
        <input name="role_at_time" placeholder="Source role at the time" className={inputClass} />
        <input name="club_context" placeholder="Club / career context" className={inputClass} />
        <select name="stakeholder_group" className={inputClass} defaultValue="industry_network"><option value="owners_ceos">Owner / CEO</option><option value="sporting_leadership">Sporting leadership</option><option value="coaching_staff">Coaching staff</option><option value="players">Player</option><option value="industry_network">Industry network</option><option value="journalists">Journalist</option><option value="agents">Agent</option><option value="other">Other</option></select>
        <select name="proximity" className={inputClass} defaultValue="direct"><option value="indirect">Indirect</option><option value="working_proximity">Working proximity</option><option value="direct">Direct</option><option value="close">Close</option></select>
        <input name="topic_credibility" placeholder="Credible topics, comma separated" className={inputClass} />
        <input name="confidence" type="number" min="0" max="100" placeholder="Confidence 0–100" className={inputClass} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="first_hand" value="true" />First-hand confirmed</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="independence_confirmed" value="true" />Independence confirmed</label>
        {!coaches.length && <p className="text-sm text-muted-foreground">No coach records are available. <Link href="/coaches" className="text-primary underline">Open coach directory</Link></p>}
        <div className="sm:col-span-2"><Button disabled={!coaches.length}>Link coach</Button></div>
      </NetworkForm>
    </details>
  )
}
