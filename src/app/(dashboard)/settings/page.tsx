import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-foreground tracking-tight">Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Personal and workspace settings: default currency, timezone, feature toggles
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
