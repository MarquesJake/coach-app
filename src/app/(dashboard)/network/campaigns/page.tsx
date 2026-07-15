import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { ReferenceCampaignClient } from '../_components/reference-campaign-client'

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function ReferenceCampaignsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const organizationId = await getInternalOrganizationId(user.id)
  if (!organizationId) return <p className="text-sm text-destructive">Internal analyst access is required.</p>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [{ data: campaigns }, { data: targets }, { data: coaches }, { data: contacts }, { data: mandates }] = await Promise.all([
    db.from('reference_campaigns').select('*').eq('org_id', organizationId).order('created_at', { ascending: false }),
    db.from('reference_campaign_contacts').select('*').eq('org_id', organizationId).order('created_at', { ascending: false }),
    supabase.from('coaches').select('id, name').eq('user_id', user.id).order('name'),
    db.from('football_contacts').select('id, full_name').eq('org_id', organizationId).order('full_name'),
    supabase.from('mandates').select('id, custom_club_name').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])
  const coachMap = new Map((coaches ?? []).map((coach) => [coach.id, coach.name]))
  return <div className="space-y-4"><ReferenceCampaignClient coaches={coaches ?? []} contacts={contacts ?? []} mandates={(mandates ?? []).map((mandate) => ({ id: mandate.id, label: mandate.custom_club_name || 'Mandate' }))} campaigns={campaigns ?? []} /><div className="divide-y divide-border border-y border-border">{(campaigns ?? []).map((campaign: Record<string, any>) => { const rows = (targets ?? []).filter((target: Record<string, any>) => target.campaign_id === campaign.id); return <div key={campaign.id} className="grid gap-3 py-4 md:grid-cols-[1fr_140px_1fr]"><div><Link href={`/coaches/${campaign.coach_id}/intelligence`} className="font-medium hover:text-primary">{campaign.title}</Link><p className="text-xs text-muted-foreground">{coachMap.get(campaign.coach_id)} · {campaign.evidence_gap || 'No evidence gap specified'}</p></div><p className="text-sm text-muted-foreground">{rows.filter((row: Record<string, any>) => row.status === 'completed').length}/{rows.length} complete</p><p className="text-sm text-muted-foreground">{campaign.next_action || 'No next action set'}</p></div>})}{!(campaigns ?? []).length && <p className="py-10 text-center text-sm text-muted-foreground">No reference rounds yet.</p>}</div></div>
}
