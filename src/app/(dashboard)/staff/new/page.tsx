import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CreateStaffForm } from '../_components/create-staff-form'

export default async function NewStaffPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/staff" className="text-xs text-muted-foreground hover:text-foreground">← Staff</Link>
        <h1 className="text-lg font-semibold text-foreground mt-1">Add staff</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Create a new staff profile for your network.</p>
      </div>
      <CreateStaffForm />
    </div>
  )
}
