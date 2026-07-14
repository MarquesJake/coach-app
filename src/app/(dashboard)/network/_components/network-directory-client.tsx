'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { Plus, Search, UserRoundPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createFootballContactAction } from '../../intelligence/trusted-actions'

type ContactRow = {
  id: string
  full_name: string
  current_role_title: string | null
  current_organization: string | null
  stakeholder_group: string
  reliability_score: number | null
  default_attribution_permission: string
  next_follow_up_at: string | null
  relationship_count: number
  session_count: number
}

const inputClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary'

export function NetworkDirectoryClient({ contacts, coaches }: { contacts: ContactRow[]; coaches: Array<{ id: string; name: string }> }) {
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const filtered = useMemo(() => contacts.filter((contact) => `${contact.full_name} ${contact.current_role_title ?? ''} ${contact.current_organization ?? ''}`.toLowerCase().includes(query.toLowerCase())), [contacts, query])

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createFootballContactAction(formData)
      if (!result.ok) { toast.error(result.error); return }
      toast.success('Contact added to the football network')
      window.location.reload()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, role or organisation" className={`${inputClass} pl-9`} />
        </label>
        <details className="group">
          <summary className="list-none">
            <span className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" />Add contact</span>
          </summary>
          <form action={submit} className="mt-3 grid gap-3 border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
            <input name="full_name" required placeholder="Full name" className={inputClass} />
            <input name="current_role" placeholder="Current role" className={inputClass} />
            <input name="current_organization" placeholder="Current organisation" className={inputClass} />
            <select name="stakeholder_group" className={inputClass} defaultValue="industry_network">
              <option value="owners_ceos">Owner / CEO</option><option value="sporting_leadership">Sporting leadership</option><option value="coaching_staff">Coaching staff</option><option value="players">Player</option><option value="industry_network">Industry network</option><option value="journalists">Journalist</option><option value="agents">Agent</option><option value="other">Other</option>
            </select>
            <input name="email" type="email" placeholder="Email" className={inputClass} />
            <input name="phone" placeholder="Phone" className={inputClass} />
            <input name="expertise" placeholder="Expertise, comma separated" className={inputClass} />
            <input name="reliability_score" type="number" min="0" max="100" placeholder="Reliability 0–100" className={inputClass} />
            <select name="default_attribution_permission" className={inputClass} defaultValue="anonymised_external"><option value="internal_only">Internal only</option><option value="anonymised_external">Anonymised externally</option><option value="attributed_external">Attribution approved</option></select>
            <input name="next_follow_up_at" type="datetime-local" className={inputClass} />
            <input name="follow_up_note" placeholder="Next action" className={`${inputClass} sm:col-span-2`} />
            <div className="flex items-center justify-end sm:col-span-2 lg:col-span-4"><Button type="submit" disabled={isPending}><UserRoundPlus className="mr-2 h-4 w-4" />{isPending ? 'Adding…' : 'Add contact'}</Button></div>
          </form>
        </details>
      </div>

      <div className="overflow-x-auto border border-border bg-card">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Contact</th><th className="px-4 py-3 font-medium">Network role</th><th className="px-4 py-3 font-medium">Coverage</th><th className="px-4 py-3 font-medium">Attribution</th><th className="px-4 py-3 font-medium">Follow-up</th></tr></thead>
          <tbody className="divide-y divide-border">
            {filtered.map((contact) => <tr key={contact.id} className="hover:bg-muted/20">
              <td className="px-4 py-3"><Link href={`/network/${contact.id}`} className="font-medium text-foreground hover:text-primary">{contact.full_name}</Link><p className="text-xs text-muted-foreground">{contact.current_role_title || 'Role not recorded'}{contact.current_organization ? ` · ${contact.current_organization}` : ''}</p></td>
              <td className="px-4 py-3"><Badge variant="outline">{contact.stakeholder_group.replaceAll('_', ' ')}</Badge>{contact.reliability_score != null && <span className="ml-2 text-xs text-muted-foreground">{contact.reliability_score}/100</span>}</td>
              <td className="px-4 py-3 text-muted-foreground">{contact.relationship_count} coach link{contact.relationship_count === 1 ? '' : 's'} · {contact.session_count} conversation{contact.session_count === 1 ? '' : 's'}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{contact.default_attribution_permission.replaceAll('_', ' ')}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{contact.next_follow_up_at ? new Date(contact.next_follow_up_at).toLocaleDateString('en-GB') : 'No follow-up set'}</td>
            </tr>)}
            {!filtered.length && <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No contacts match this view.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{coaches.length} coach records are available to link from contact detail pages.</p>
    </div>
  )
}
