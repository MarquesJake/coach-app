import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { NewAgentForm } from '../_components/new-agent-form'

export default async function NewAgentPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/agents" className="text-xs text-muted-foreground hover:text-foreground">← Agents</Link>
        <h1 className="text-lg font-semibold text-foreground mt-1">Add agent</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Create a new agent profile and link to coaches and clubs.</p>
      </div>
      <NewAgentForm />
    </div>
  )
}
