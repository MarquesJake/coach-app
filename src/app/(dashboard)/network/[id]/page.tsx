import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { evidenceStrengthLabel, formatEnumLabel, reviewStatusLabel, stakeholderGroupLabel } from '@/lib/intelligence/display'
import { ContactDetailClient } from '../_components/contact-detail-client'

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const organizationId = await getInternalOrganizationId(user.id)
  if (!organizationId) notFound()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [{ data: contact }, { data: relationships }, { data: sessions }, { data: claims }, { data: coaches }] = await Promise.all([
    db.from('football_contacts').select('*').eq('id', params.id).eq('org_id', organizationId).maybeSingle(),
    db.from('contact_coach_relationships').select('*').eq('contact_id', params.id).eq('org_id', organizationId).order('created_at', { ascending: false }),
    db.from('intelligence_sessions').select('id, coach_id, title, intake_method, occurred_at, processing_status').eq('contact_id', params.id).eq('org_id', organizationId).order('occurred_at', { ascending: false }),
    db.from('profile_claims').select('id, coach_id, session_id, claimed_value, review_status, evidence_strength, external_visibility').eq('contact_id', params.id).eq('org_id', organizationId).is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('coaches').select('id, name').eq('user_id', user.id).order('name'),
  ])
  if (!contact) notFound()
  const coachMap = new Map((coaches ?? []).map((coach) => [coach.id, coach.name]))
  return (
    <div className="space-y-5">
      <div><Link href="/network" className="text-xs text-muted-foreground hover:text-foreground">← Football network</Link><h2 className="mt-1 text-xl font-semibold text-foreground">{contact.full_name}</h2><p className="text-sm text-muted-foreground">{contact.current_role_title || 'Role not recorded'}{contact.current_organization ? ` · ${contact.current_organization}` : ''}</p></div>
      <ContactDetailClient contactId={params.id} coaches={coaches ?? []} />
      <section className="border-t border-border pt-4"><h3 className="text-sm font-semibold text-foreground">Coach relationships</h3><div className="mt-2 divide-y divide-border border-y border-border">{(relationships ?? []).map((row: Record<string, any>) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><div><Link href={`/coaches/${row.coach_id}/intelligence`} className="font-medium hover:text-primary">{coachMap.get(row.coach_id) || 'Coach'}</Link><p className="text-xs text-muted-foreground">{formatEnumLabel(row.relationship_type)} · {row.role_at_time || stakeholderGroupLabel(row.stakeholder_group)} · {formatEnumLabel(row.proximity)}</p></div><span className="text-xs text-muted-foreground">{row.first_hand ? 'First-hand' : 'Indirect'} · {row.independence_confirmed ? 'independence confirmed' : 'independence pending'}</span></div>)}{!(relationships ?? []).length && <p className="py-6 text-sm text-muted-foreground">No coach relationship recorded.</p>}</div></section>
      <section><h3 className="text-sm font-semibold text-foreground">Conversations and findings</h3><div className="mt-2 grid gap-4 lg:grid-cols-2"><div className="border border-border bg-card"><div className="border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground">Conversations</div>{(sessions ?? []).map((row: Record<string, any>) => <Link key={row.id} href={`/intelligence/conversations?session=${row.id}`} className="block border-b border-border px-4 py-3 last:border-0 hover:bg-muted/20"><p className="text-sm font-medium">{row.title}</p><p className="text-xs text-muted-foreground">{coachMap.get(row.coach_id) || 'General network intelligence'} · {new Date(row.occurred_at).toLocaleDateString('en-GB')}</p></Link>)}{!(sessions ?? []).length && <p className="p-4 text-sm text-muted-foreground">No conversations recorded.</p>}</div><div className="border border-border bg-card"><div className="border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground">Findings</div>{(claims ?? []).map((row: Record<string, any>) => <Link key={row.id} href={`/intelligence/review?claim=${row.id}`} className="block border-b border-border px-4 py-3 last:border-0 hover:bg-muted/20"><p className="line-clamp-2 text-sm font-medium">{row.claimed_value}</p><p className="text-xs text-muted-foreground">{coachMap.get(row.coach_id) || 'Coach'} · {reviewStatusLabel(row.review_status)} · {evidenceStrengthLabel(row.evidence_strength)}</p></Link>)}{!(claims ?? []).length && <p className="p-4 text-sm text-muted-foreground">No findings captured.</p>}</div></div></section>
    </div>
  )
}
