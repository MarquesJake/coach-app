'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NetworkForm } from './network-form'
import { updateFootballContactAction } from '../../intelligence/trusted-actions'
import { externalVisibilityLabel } from '@/lib/intelligence/display'

export type EditableContact = {
  id: string; full_name: string; current_role_title: string | null; current_organization: string | null
  email: string | null; phone: string | null; stakeholder_group: string; expertise: string[]
  reliability_score: number | null; next_follow_up_at: string | null; follow_up_note: string | null
  default_attribution_permission: string
}
const inputClass = 'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm'
function localDateTime(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
}
export function ContactEditForm({ contact }: { contact: EditableContact }) {
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  return <div>
    {!editing && <Button variant="outline" onClick={() => { setEditing(true); setSaved(false) }}>Edit contact</Button>}
    {saved && <p role="status" className="mt-2 text-sm">Contact updated.</p>}
    {editing && <NetworkForm action={updateFootballContactAction} success="Contact updated." onSaved={() => { setEditing(false); setSaved(true) }}>
      <input type="hidden" name="contact_id" value={contact.id} />
      <label className="text-sm">Full name<input name="full_name" required defaultValue={contact.full_name} className={inputClass} /></label>
      <label className="text-sm">Current role<input name="current_role" defaultValue={contact.current_role_title ?? ''} className={inputClass} /></label>
      <label className="text-sm">Current organisation<input name="current_organization" defaultValue={contact.current_organization ?? ''} className={inputClass} /></label>
      <label className="text-sm">Network role<select name="stakeholder_group" defaultValue={contact.stakeholder_group} className={inputClass}>
        <option value="owners_ceos">Owner / CEO</option><option value="sporting_leadership">Sporting leadership</option><option value="coaching_staff">Coaching staff</option><option value="players">Player</option><option value="industry_network">Industry network</option><option value="journalists">Journalist</option><option value="agents">Agent</option><option value="other">Other</option>
      </select></label>
      <label className="text-sm">Email<input name="email" type="email" defaultValue={contact.email ?? ''} className={inputClass} /></label>
      <label className="text-sm">Phone<input name="phone" defaultValue={contact.phone ?? ''} className={inputClass} /></label>
      <label className="text-sm">Expertise, comma separated<input name="expertise" defaultValue={contact.expertise.join(', ')} className={inputClass} /></label>
      <label className="text-sm">Reliability 0–100<input name="reliability_score" type="number" min="0" max="100" step="1" defaultValue={contact.reliability_score ?? ''} className={inputClass} /></label>
      <label className="text-sm">Follow-up date and time<input name="next_follow_up_at" type="datetime-local" defaultValue={localDateTime(contact.next_follow_up_at)} className={inputClass} /></label>
      <label className="text-sm">Next action<input name="follow_up_note" defaultValue={contact.follow_up_note ?? ''} className={inputClass} /></label>
      <p className="text-xs text-muted-foreground sm:col-span-2">Attribution permission: {externalVisibilityLabel(contact.default_attribution_permission)}. Contact edits do not change source permissions or approve any findings for external use.</p>
      <div className="flex gap-2 sm:col-span-2"><Button type="submit">Save contact</Button><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button></div>
    </NetworkForm>}
  </div>
}
