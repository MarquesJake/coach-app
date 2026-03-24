import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getClubById } from '@/lib/db/clubs'
import { ClubCommandBar } from './_components/club-command-bar'
import { ClubTabNav } from './_components/club-tab-nav'

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const { data: club, error } = await getClubById(user.id, id)
  if (error || !club) notFound()

  return (
    <div className="animate-fade-in">
      <ClubCommandBar club={club} />
      <ClubTabNav clubId={id} />
      {children}
    </div>
  )
}
