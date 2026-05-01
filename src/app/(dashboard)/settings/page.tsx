import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = createServerSupabaseClient()
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
          Admin only workspace controls for defaults, timezone and feature toggles.
        </p>
      </div>

      <div className="card-surface rounded-xl p-8">
        <p className="text-sm text-muted-foreground">
          Settings options will be available here. Configure default currency, default league, default timezone and feature toggles.
        </p>
      </div>
    </div>
  )
}
