import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  GitBranch,
  Award,
  Clock,
  Palette,
  Activity,
  Box,
  FolderKanban,
  LayoutGrid,
  Scale,
} from 'lucide-react'

const configCards = [
  { label: 'Pipeline stages', href: '/config/pipeline-stages', icon: GitBranch },
  { label: 'Reputation tiers', href: '/config/reputation-tiers', icon: Award },
  { label: 'Availability statuses', href: '/config/availability-statuses', icon: Clock },
  { label: 'Preferred styles list', href: '/config/preferred-styles', icon: Palette },
  { label: 'Pressing intensity list', href: '/config/pressing-intensity', icon: Activity },
  { label: 'Build preference list', href: '/config/build-preference', icon: Box },
  { label: 'Mandate preference categories', href: '/config/mandate-preference-categories', icon: FolderKanban },
  { label: 'Formation presets', href: '/config/formation-presets', icon: LayoutGrid },
  { label: 'Scoring weights', href: '/config/scoring-weights', icon: Scale },
]

export default async function ConfigPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Config</h1>
          <span className="rounded border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
            Internal
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Admin only system data that drives dropdowns and scoring. Keep this out of stakeholder demos unless configuration is the topic.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {configCards.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="card-surface rounded-xl p-5 flex items-center gap-4 hover:bg-surface-overlay/30 transition-colors border border-border"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium text-foreground text-sm">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
