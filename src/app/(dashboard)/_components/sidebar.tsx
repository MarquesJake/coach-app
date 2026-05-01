'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  Briefcase,
  LayoutDashboard,
  Building2,
  Settings,
  Zap,
  Database,
  Radio,
  UserCircle,
  LogOut,
  Bell,
  GitCompare,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const workspaceNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Mandates', href: '/mandates', icon: Briefcase },
]

const intelligenceNav = [
  { label: 'Coaches', href: '/coaches', icon: Users },
  { label: 'Clubs', href: '/clubs', icon: Building2 },
  { label: 'Agents', href: '/agents', icon: UserCircle },
  { label: 'Intelligence', href: '/intelligence', icon: Radio },
]

const internalNav = [
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'Matches', href: '/matches', icon: GitCompare },
  { label: 'Staff', href: '/staff', icon: Users },
  { label: 'Config', href: '/config', icon: SlidersHorizontal },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Data tools', href: '/admin/data-tools', icon: Database },
]

const navSections = [
  { label: 'Workspace', items: workspaceNav },
  { label: 'Market intelligence', items: intelligenceNav },
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

  function isActive(href: string) {
    if (pathname === href) return true
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-[220px] bg-card border-r border-border flex flex-col fixed h-full z-30 shadow-[12px_0_40px_rgba(0,0,0,0.12)]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border bg-gradient-to-b from-surface-raised/70 to-transparent">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.12)]">
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
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="mb-1 px-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
                {section.label}
              </span>
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors relative',
                      active
                        ? 'text-primary bg-primary/[0.06]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    )}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-primary rounded-r" />
                    )}
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        <details className="group rounded-lg border border-border/60 bg-surface/30">
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70 transition-colors hover:text-foreground">
            Internal tools
            <span className="rounded border border-amber-400/20 bg-amber-400/10 px-1.5 py-0.5 text-[8px] text-amber-300">
              Admin only
            </span>
          </summary>
          <div className="space-y-0.5 border-t border-border/60 p-2">
            {internalNav.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] font-medium transition-colors relative',
                    active
                      ? 'text-primary bg-primary/[0.06]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </details>
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
