import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { displayClubName } from '@/lib/display-names'
import { getStageLabel } from '@/lib/constants/mandateStages'
import { effectiveBrief } from '@/lib/clubs/brief-amendments'
import type { Metadata } from 'next'

// Names the entity in the tab so several open records can be told apart; child
// tabs supply their own label through the template ("Career · Kieran McKenna").
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('mandates').select('custom_club_name, clubs(name)').eq('id', id).maybeSingle()
  const name = data
    ? displayClubName(
        (data as { custom_club_name?: string | null }).custom_club_name,
        (data as { clubs?: { name?: string } | null }).clubs?.name,
        'Mandate'
      )
    : 'Mandate'
  return { title: { default: name, template: `%s · ${name} · Gaffa` } }
}

export default async function AppointmentLayout({ children, params }: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const db = await createServerSupabaseClient()
  const { data: appointment, error } = await db.from('mandates').select('id,custom_club_name,engagement_owner,pipeline_stage,target_completion_date,clubs(name)').eq('id', id).maybeSingle()
  if (error) throw new Error('The mandate could not be loaded. Please retry.')
  if (!appointment) notFound()
  const briefs = await db.from('club_briefs').select('*').eq('linked_mandate_id', id)
  const amendments = briefs.data?.length ? await db.from('club_brief_amendments').select('*').in('brief_id', briefs.data.map(brief => brief.id)) : { data: [], error: null }
  return <div className="min-w-0">
    <aside aria-label="Current mandate" className="mx-auto mb-5 flex max-w-[1200px] flex-wrap items-center justify-between gap-3 border-b border-border pb-4 print:hidden">
      <div className="min-w-0 text-sm">
        <Link href={`/mandates/${id}/decision`} className="font-semibold text-primary underline-offset-4 hover:underline">{displayClubName(appointment.custom_club_name, appointment.clubs?.name)}</Link>
        <span className="ml-2 text-muted-foreground">{getStageLabel(appointment.pipeline_stage ?? 'identified')}</span>
        <p className="mt-1 text-xs text-muted-foreground">Owner: {appointment.engagement_owner?.trim() || 'Unassigned'} · Target: {appointment.target_completion_date || 'Not agreed'}</p>
        {briefs.error || amendments.error ? <p role="alert" className="mt-1 text-xs text-amber-700 dark:text-amber-400">Club brief version unavailable. Check intake before relying on these requirements.</p> : briefs.data?.length ? briefs.data.map(brief => {
          const agreed = effectiveBrief(brief, (amendments.data ?? []).filter(row => row.brief_id === brief.id))
          return <p className="mt-1 text-xs text-muted-foreground" key={brief.id}>{agreed.snapshot.role_title || 'Role not recorded'} · Club brief v{agreed.version}{(amendments.data ?? []).some(row => row.brief_id === brief.id && row.status === 'pending') ? ' · Amendment awaiting review' : ''}</p>
        }) : <p className="mt-1 text-xs text-muted-foreground">Internal brief · No agreed club submission linked</p>}
      </div>
    </aside>
    {children}
  </div>
}
