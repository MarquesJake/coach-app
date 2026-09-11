import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getClubById } from '@/lib/db/clubs'
import { ClubCommandBar } from './_components/club-command-bar'
import { ClubTabNav } from './_components/club-tab-nav'
import type { Metadata } from 'next'

// Names the entity in the tab so several open records can be told apart; child
// tabs supply their own label through the template ("Career · Kieran McKenna").
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('clubs').select('name').eq('id', id).maybeSingle()
  const name = data?.name?.trim() || 'Club'
  return { title: { default: name, template: `%s · ${name} · Gaffa` } }
}

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const { data: club, error } = await getClubById(id)
  if (error) throw new Error('Club could not be loaded. Reload before relying on this view.')
  if (!club) notFound()

  const { data: appointments, error: appointmentsError } = await supabase.from('mandates')
    .select('id').eq('club_id', id).in('status', ['Active', 'In Progress', 'On Hold'])
    .order('created_at', { ascending: false })

  return (
    <div className="animate-fade-in flex flex-col min-h-full">
      <ClubCommandBar club={club} appointmentIds={appointments?.map(row => row.id) ?? []} appointmentsUnavailable={!!appointmentsError} />
      <div className="px-6 pt-4 flex-1">
        <ClubTabNav clubId={id} />
        {children}
      </div>
    </div>
  )
}
