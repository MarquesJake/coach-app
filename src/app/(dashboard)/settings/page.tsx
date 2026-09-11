import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = { title: 'Settings' }


export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Settings</h1>
          <span className="rounded border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
            Internal
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          What you can change, and where.
        </p>
      </div>

      <div className="card-surface rounded-xl p-8">
        <p className="text-sm text-muted-foreground">
          Currency, time zone and feature settings can’t be changed yet. Switch between light and dark mode with the button in the sidebar.
        </p>
        <nav aria-label="Available workspace controls" className="mt-5 flex flex-wrap gap-4 text-sm underline">
          <Link href="/config">Manage configuration lists</Link>
          <Link href="/dashboard">Return to Today</Link>
          <Link href="/investor-guide">Sources and methodology</Link>
        </nav>
      </div>
    </div>
  )
}
