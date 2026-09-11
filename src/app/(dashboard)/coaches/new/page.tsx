import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NewCoachForm } from './_components/new-coach-form'

export const metadata = { title: 'New · Coaches' }


export default async function NewCoachPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <NewCoachForm />
}
