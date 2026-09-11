import { effectiveBrief } from '@/lib/clubs/brief-amendments'
import { BriefAmendmentHistory } from '@/components/clubs/brief-amendment-history'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { linkSubmittedBriefAction } from './actions'
import { briefClubName, createdMandateForBrief, createFromBriefHref, presentBriefHandoff } from '@/lib/clubs/brief-presentation'

export const metadata = { title: 'Club briefs' }


const fields = [
  ['appointment_context','Appointment context'], ['football_identity','Football identity'],
  ['in_possession_requirements','In possession'], ['out_of_possession_requirements','Out of possession'],
  ['transition_requirements','Transitions'], ['set_piece_requirements','Set pieces'],
  ['squad_context','Squad context'], ['player_development_priorities','Player development'],
  ['leadership_and_culture','Leadership and culture'], ['budget_parameters','Financial parameters'],
  ['availability_timeline','Timeline'], ['location_requirements','Location'],
  ['work_permit_position','Eligibility requiring confirmation'], ['process_requirements','Decision process'],
  ['confidentiality_notes','Confidentiality boundary'],
] as const

export default async function ClubBriefsPage({searchParams}:{searchParams:Promise<{saved?:string;error?:string;brief_id?:string;created_mandate?:string}>}) {
  const db = await createServerSupabaseClient()
  const {data:{user}} = await db.auth.getUser()
  if (!user) redirect('/login')
  const org = await getInternalOrganizationId(user.id)
  if (!org) redirect('/no-access')
  const query = await searchParams
  const briefs = await db.from('club_briefs').select('*').eq('service_organization_id',org).in('status',['submitted','in_review','converted']).order('submitted_at',{ascending:false})
  const amendmentResult = briefs.data?.length ? await db.from('club_brief_amendments').select('*').in('brief_id', briefs.data.map(b => b.id)).order('requested_at', { ascending: false }) : { data: [], error: null }
  const mandates = await db.from('mandates').select('id,club_id,custom_club_name,status')
  const organizations = briefs.data?.length ? await db.from('organizations').select('id,name').in('id', [...new Set(briefs.data.map(brief => brief.buyer_organization_id))]) : { data: [], error: null }
  const organizationById = new Map((organizations.data ?? []).map(organization => [organization.id, organization.name]))
  // Analysts can read linked club records without reading private buyer organisations.
  const clubIds = [...new Set((briefs.data ?? []).flatMap(brief => brief.club_id ? [brief.club_id] : []))]
  const clubs = clubIds.length ? await db.from('clubs').select('id,name').in('id', clubIds) : { data: [], error: null }
  const clubById = new Map((clubs.data ?? []).map(club => [club.id, club.name]))
  return <div className="mx-auto max-w-4xl space-y-6">
    <header><p className="text-xs uppercase tracking-wide text-muted-foreground">Club to Gaffa handoff</p><h1 className="mt-2 font-serif text-3xl">Submitted club briefs</h1><p className="mt-3 text-sm text-muted-foreground">Read the brief in the club’s own words, fill any gaps with them, then link it to that club’s mandate. A submitted brief doesn’t mean we’ve taken the job or can contact coaches.</p></header>
    <nav className="flex gap-4 text-sm"><Link className="underline" href="/dashboard">Today</Link><Link className="underline" href="/mandates/new">Create a mandate</Link><Link className="underline" href="/coach-portal">Review coach submissions</Link></nav>
    {query.saved && <p role="status" className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm">Brief linked. Carry on in the mandate — the club’s original wording is kept here.</p>}
    {query.error && <p role="alert" className="rounded border border-red-300 p-3 text-sm">Couldn’t link the brief. Refresh, then pick an unlinked brief and a mandate for the same club.</p>}
    {(briefs.error || mandates.error) && <p role="alert">Briefs didn’t load. Refresh before assuming there are none.</p>}
    {!briefs.error && !briefs.data?.length && <p className="rounded border border-border p-5">No club briefs yet. A club director writes their brief privately and sends it when they press Submit to Gaffa.</p>}
    {amendmentResult.error && <p role="alert" className="rounded border border-red-300 p-4 text-sm">Changes to the brief didn’t load, so this wording may be out of date. Refresh before relying on it.</p>}
    {organizations.error && <p role="alert" className="rounded border border-red-300 p-4 text-sm">Club names didn’t load. Refresh before accepting a brief.</p>}
    {clubs.error && <p role="alert" className="rounded border border-red-300 p-4 text-sm">Club records didn’t load. Refresh before accepting a brief.</p>}
    {(briefs.data ?? []).map(original => {
      const amendments = (amendmentResult.data ?? []).filter(a => a.brief_id === original.id)
      const agreed = effectiveBrief(original, amendments)
      const brief = { ...original, ...agreed.snapshot }
      const handoff = presentBriefHandoff(original, amendmentResult.error ? null : agreed.version, amendments.some(amendment => amendment.status === 'pending'))
      const matchingMandates = (mandates.data ?? []).filter(mandate => brief.club_id && mandate.club_id === brief.club_id && mandate.status !== 'Completed')
      const clubName = briefClubName(organizationById.get(brief.buyer_organization_id), clubById.get(brief.club_id ?? ''))
      const canReview = !briefs.error && !mandates.error && !amendmentResult.error && !organizations.error && !clubs.error && clubName !== 'Club identity unconfirmed'
      const createdMandate = canReview ? createdMandateForBrief(query, original, matchingMandates) : ''
      return <section id={`brief-${brief.id}`} key={brief.id} className="space-y-4 rounded-md border border-border bg-card p-5">
      <p className="text-xs font-semibold">{handoff.label}{amendments.some(a => a.status === 'pending') ? ' · Amendment awaiting review' : ''}</p>
      <h2 className="font-serif text-xl">{clubName} · {brief.role_title}</h2>
      <p className="text-sm">{brief.title}</p><p className="text-xs text-muted-foreground">Submitted {brief.submitted_at?.slice(0,10) ?? 'date not recorded'} · Next owner: {handoff.owner}</p>
      <p className="text-sm text-muted-foreground">{handoff.nextAction}</p>
      {createdMandate && <p role="status" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">Mandate created. It’s selected below — check the brief and the mandate, then press Link reviewed brief to confirm. This doesn’t change the brief or give permission to contact coaches. <Link href={`/mandates/${createdMandate}/decision`} className="underline">Review created appointment</Link></p>}
      <details><summary className="cursor-pointer text-sm font-semibold">Read the complete club brief</summary><dl className="mt-4 grid gap-4 sm:grid-cols-2">{fields.map(([key,label])=><div key={key}><dt className="text-xs font-semibold">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{brief[key] || 'Not given — check with the club'}</dd></div>)}</dl></details>
      {brief.linked_mandate_id ? <Link href={`/mandates/${brief.linked_mandate_id}/decision`} className="text-sm underline">Open agreed appointment</Link> : canReview ? <div className="space-y-4">
        <Link href={createFromBriefHref(brief.id)} className="inline-flex rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Start a mandate from this brief</Link>
        <p className="text-xs text-muted-foreground">Check the requirements before taking on the mandate. The club’s original wording stays attached to the brief.</p>
        {matchingMandates.length > 0 ? <form action={linkSubmittedBriefAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="brief_id" value={brief.id}/>
        <label className="space-y-1 text-sm">Same-club mandate<select key={`${brief.id}:${createdMandate}`} name="mandate_id" required defaultValue={createdMandate} className="block rounded border border-border bg-background p-2"><option value="" disabled>Select an existing mandate</option>{matchingMandates.map(m=><option key={m.id} value={m.id}>{m.custom_club_name || brief.title}</option>)}</select></label>
        <button className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Link reviewed brief</button>
        <p className="w-full text-xs text-muted-foreground">Linking keeps the original brief. It doesn’t turn what the club said into confirmed evidence, or give permission to contact coaches.</p>
      </form> : <p className="text-xs text-muted-foreground">No open mandate for this club. Start one from this brief.</p>}
      </div> : <p className="text-sm text-muted-foreground">Refresh to check the full brief and the club before creating or linking a mandate.</p>}
      {brief.linked_mandate_id && !amendmentResult.error && <details open={amendments.some(a => a.status === 'pending')}><summary className="cursor-pointer text-sm font-semibold">Amendment requests and decisions</summary><div className="mt-4"><BriefAmendmentHistory amendments={amendments} canReview /></div></details>}
    </section>})}
  </div>
}
