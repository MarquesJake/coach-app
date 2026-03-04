'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  Briefcase,
  BarChart3,
  Radio,
  Building2,
  Settings,
  Sliders,
  LogOut,
  Zap,
  Database,
  Bell,
  UserCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const platformNav = [
  { label: 'Coaches', href: '/coaches', icon: Users },
  { label: 'Agents', href: '/agents', icon: UserCircle },
  { label: 'Intelligence', href: '/intelligence', icon: Radio },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'Staff', href: '/staff', icon: Users },
  { label: 'Clubs', href: '/clubs', icon: Building2 },
  { label: 'Mandates', href: '/mandates', icon: Briefcase },
  { label: 'Matches', href: '/matches', icon: BarChart3 },
]

const adminNav = [
  { label: 'Config', href: '/config', icon: Sliders },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Data tools', href: '/admin/data-tools', icon: Database },
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

  return (
    <aside className="w-[220px] bg-card border-r border-border flex flex-col fixed h-full z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <Link href="/coaches" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-[13px] leading-tight tracking-tight">
              Coach First
            </span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-[0.12em] leading-tight">
              Intelligence OS
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="mb-2 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            Platform
          </span>
        </div>
        <div className="space-y-0.5">
          {platformNav.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/coaches' && item.href !== '/agents' && pathname.startsWith(item.href + '/')) ||
              (item.href === '/coaches' && (pathname === '/coaches' || pathname.startsWith('/coaches/'))) ||
              (item.href === '/agents' && (pathname === '/agents' || pathname.startsWith('/agents/')))
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
            Admin
          </span>
        </div>

        <div className="space-y-0.5">
          {adminNav.map((item) => {
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
