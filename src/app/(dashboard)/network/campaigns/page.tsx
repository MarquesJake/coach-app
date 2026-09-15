import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { canonicalCoachName } from '@/lib/coaches/canonical-name'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { ReferenceCampaignClient } from '../_components/reference-campaign-client'

export const metadata = { title: 'Campaigns · Football network' }


/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function ReferenceCampaignsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const organizationId = await getInternalOrganizationId(user.id)
  if (!organizationId) return <p className="text-sm text-destructive">Internal analyst access is required.</p>
  const db = supabase as any
  const results = await Promise.all([
    db.from('reference_campaigns').select('*').eq('org_id', organizationId).order('created_at', { ascending: false }),
    db.from('reference_campaign_contacts').select('*').eq('org_id', organizationId).order('created_at', { ascending: false }),
    supabase.from('coaches').select('id, name').order('name'),
    db.from('football_contacts').select('id, full_name').eq('org_id', organizationId).order('full_name'),
    supabase.from('mandates').select('id, custom_club_name').order('created_at', { ascending: false }),
  ])
  if (results.some((result) => result.error)) throw new Error('Could not load reference rounds')
  const [{ data: campaigns }, { data: targets }, { data: coaches }, { data: contacts }, { data: mandates }] = results
  const coachMap = new Map((coaches ?? []).map((coach) => [coach.id, canonicalCoachName(coach.id, coach.name)]))
  const contactMap = new Map((contacts ?? []).map((contact: { id: string; full_name: string }) => [contact.id, contact.full_name]))
  const mandateMap = new Map((mandates ?? []).map((mandate) => [mandate.id, mandate.custom_club_name || 'Mandate']))
  const statusLabel: Record<string, string> = { planned: 'Planned — not yet contacted', contacted: 'Awaiting response', scheduled: 'Scheduled', completed: 'Completed', declined: 'Declined' }
  const roundLabel: Record<string, string> = { draft: 'Draft', active: 'Active', paused: 'Paused', complete: 'Complete' }
  return <div className="space-y-4"><h1 className="sr-only">Reference rounds</h1>
    <p className="text-sm text-muted-foreground">A reference round is one coach, one evidence gap, and the people we plan to ask. Each source moves from planned to contacted, scheduled and completed; answers are recorded against Rasmus’s question set on the coach’s assessment and only count once an analyst has checked them.</p>
    <ReferenceCampaignClient coaches={coaches ?? []} contacts={contacts ?? []} mandates={(mandates ?? []).map((mandate) => ({ id: mandate.id, label: mandate.custom_club_name || 'Mandate' }))} campaigns={campaigns ?? []} />
    <div className="divide-y divide-border border-y border-border">{(campaigns ?? []).map((campaign: Record<string, any>) => {
      const rows = (targets ?? []).filter((target: Record<string, any>) => target.campaign_id === campaign.id)
      const demo = /^DEMO/i.test(String(campaign.title ?? ''))
      return <div key={campaign.id} className="space-y-3 py-4">
        <div className="grid gap-3 md:grid-cols-[1fr_140px_1fr]">
          <div>
            <Link href={campaign.mandate_id ? `/mandates/${campaign.mandate_id}/assessment/${campaign.coach_id}` : `/coaches/${campaign.coach_id}/intelligence`} className="font-medium hover:text-primary">{campaign.title}</Link>
            <p className="text-xs text-muted-foreground">{coachMap.get(campaign.coach_id)}{campaign.mandate_id ? ` · ${mandateMap.get(campaign.mandate_id) ?? 'Mandate'}` : ' · Pre-mandate research'} · {roundLabel[campaign.status] ?? campaign.status}</p>
            <p className="mt-1 text-xs text-muted-foreground">Evidence gap: {campaign.evidence_gap || 'Not specified'}</p>
            {demo && <p role="note" className="mt-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300">Fictional demo reference round — not real intelligence. Every source and answer in it is invented to show the process.</p>}
          </div>
          <p className="text-sm text-muted-foreground">{rows.filter((row: Record<string, any>) => row.status === 'completed').length}/{rows.length} complete</p>
          <p className="text-sm text-muted-foreground">{campaign.next_action || 'No next action set'}</p>
        </div>
        {rows.length > 0 && <ul className="grid gap-2 text-xs md:grid-cols-2">{rows.map((row: Record<string, any>) => <li key={row.id} className="rounded border border-border px-3 py-2">
          <p className="font-medium">{row.contact_id ? contactMap.get(row.contact_id) ?? 'Contact' : row.prospect_name} <span className="font-normal text-muted-foreground">· {row.prospect_role || row.stakeholder_group?.replaceAll('_', ' ')}</span></p>
          <p className="mt-0.5 text-muted-foreground">{statusLabel[row.status] ?? row.status}{row.scheduled_at ? ` · ${new Date(row.scheduled_at).toLocaleDateString('en-GB')}` : ''}{row.completed_at ? ` · done ${new Date(row.completed_at).toLocaleDateString('en-GB')}` : ''}</p>
          {row.next_action && <p className="mt-0.5 text-muted-foreground">{row.next_action}</p>}
          {row.session_id && <Link className="mt-0.5 inline-block text-primary underline" href={`/intelligence/review?session=${row.session_id}`}>Open the conversation</Link>}
        </li>)}</ul>}
      </div>
    })}{!(campaigns ?? []).length && <p className="py-10 text-center text-sm text-muted-foreground">No reference rounds yet.</p>}</div></div>
}
