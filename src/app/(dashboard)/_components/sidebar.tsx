'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  BarChart3,
  Radio,
  LogOut,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    section: 'main',
  },
  {
    label: 'New Search',
    href: '/vacancies/new',
    icon: PlusCircle,
    section: 'main',
  },
  {
    label: 'Coach Database',
    href: '/coaches',
    icon: Users,
    section: 'intelligence',
  },
  {
    label: 'Shortlists',
    href: '/matches',
    icon: BarChart3,
    section: 'intelligence',
  },
  {
    label: 'Intel Feed',
    href: '/intelligence',
    icon: Radio,
    section: 'intelligence',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const mainNav = navItems.filter((i) => i.section === 'main')
  const intelNav = navItems.filter((i) => i.section === 'intelligence')

  return (
    <aside className="w-[220px] bg-card border-r border-border flex flex-col fixed h-full z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-[13px] leading-tight tracking-tight">
              CoachMatch
            </span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-[0.12em] leading-tight">
              Intelligence
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-0.5">
          {mainNav.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors relative',
                  isActive
                    ? 'text-primary bg-primary/[0.06]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-primary rounded-r" />
                )}
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="mt-6 mb-2 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            Intelligence
          </span>
        </div>

        <div className="space-y-0.5">
          {intelNav.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors relative',
                  isActive
                    ? 'text-primary bg-primary/[0.06]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-primary rounded-r" />
                )}
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
