import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ResearchQueue } from '@/components/research-queue'
import { MandateTabNav } from '../_components/mandate-tab-nav'

export const metadata = { title: 'Research' }


export default async function AppointmentResearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await createServerSupabaseClient()
  const [{ data: mandate }, candidates] = await Promise.all([
    db.from('mandates').select('id,custom_club_name,clubs(name)').eq('id', id).maybeSingle(),
    db.from('mandate_shortlist').select('coach_id,coaches(name)').eq('mandate_id', id),
  ])
  if (!mandate) notFound()
  return <div className="mx-auto max-w-5xl space-y-5">
    <MandateTabNav mandateId={id} />
    <header><h1 className="text-2xl font-semibold">Appointment research</h1><p className="mt-2 text-sm text-muted-foreground">{mandate.custom_club_name || mandate.clubs?.name || 'Confidential appointment'} · Check the questions that could change the shortlist.</p></header>
    <ResearchQueue mandateId={id} expanded />
    <section className="gaffa-panel"><h2 className="font-semibold">Research by candidate</h2><p className="mt-1 text-sm text-muted-foreground">Review answers and sources, or add a question for this appointment.</p>
      {candidates.error ? <p role="alert" className="mt-3 text-sm">Candidates could not be loaded. Please refresh.</p> : candidates.data?.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{candidates.data.map(c => <Link key={c.coach_id} className="rounded border p-3 text-sm text-primary hover:bg-muted" href={`/coaches/${c.coach_id}/research?mandate=${id}`}>{c.coaches?.name || 'Coach'} · Open research</Link>)}</div> : <p className="mt-3 text-sm">No shortlisted candidates yet. <Link className="text-primary underline" href={`/mandates/${id}/candidates`}>Review candidates</Link>.</p>}
    </section>
    <Link className="inline-block text-sm text-primary underline" href={`/mandates/${id}/plan`}>Manage appointment tasks</Link>
  </div>
}
