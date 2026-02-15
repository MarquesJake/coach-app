'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Radio,
  Target,
  Zap,
  LogOut,
  LayoutDashboard,
} from 'lucide-react'

const tabs = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Match Results', href: '/matches', icon: BarChart3 },
  { label: 'Vacancy Builder', href: '/vacancies/new', icon: Target },
  { label: 'Intelligence Feed', href: '/intelligence', icon: Radio },
]

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      {/* Top bar */}
      <div className="h-[var(--nav-height)] flex items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-[13px] leading-tight tracking-tight">
              Coach Intelligence Platform
            </span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-[0.12em] leading-tight">
              Club Recruitment System
            </span>
          </div>
        </Link>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-surface-overlay/50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

      {/* Tab navigation */}
      <nav className="h-[var(--tab-height)] flex items-end px-6 gap-1">
        {tabs.map((tab) => {
          const isActive =
            tab.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(tab.href)
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-4 pb-2.5 text-[13px] font-medium transition-colors relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t" />
              )}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
