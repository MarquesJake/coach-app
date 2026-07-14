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
  ShieldCheck,
  Activity,
  ChevronDown,
  PackageCheck,
  Landmark,
  ContactRound,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

const primaryNav = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Succession', href: '/succession', icon: Activity },
  { label: 'Mandates', href: '/mandates', icon: Briefcase },
  { label: 'Coaches', href: '/coaches', icon: Users },
  { label: 'Intelligence', href: '/intelligence', icon: Radio },
]

const networkNav = [
  { label: 'Football network', href: '/network', icon: ContactRound },
  { label: 'Clubs', href: '/clubs', icon: Building2 },
  { label: 'Agents', href: '/agents', icon: UserCircle },
]

const internalNav = [
  { label: 'Dossier orders', href: '/dossier-orders', icon: PackageCheck },
  { label: 'Coach portal', href: '/coach-portal', icon: ShieldCheck },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'Matches', href: '/matches', icon: GitCompare },
  { label: 'Staff', href: '/staff', icon: Users },
  { label: 'Config', href: '/config', icon: SlidersHorizontal },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Data tools', href: '/admin/data-tools', icon: Database },
]

const mobileNav = [...primaryNav, ...networkNav, ...internalNav]

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
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
            <Zap className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold leading-tight text-foreground">Coach First</span>
            <span className="text-[9px] uppercase leading-tight tracking-[0.12em] text-muted-foreground">Intelligence OS</span>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <details className="group">
            <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground" aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </summary>
            <div className="fixed inset-x-3 top-[62px] max-h-[calc(100vh-74px)] overflow-y-auto border border-border bg-card p-2 shadow-lg">
              <nav aria-label="Mobile navigation" className="grid gap-1 sm:grid-cols-2">
                {mobileNav.map((item) => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex min-h-10 items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
                        active ? 'bg-primary/[0.06] text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
              <button
                onClick={handleSignOut}
                className="mt-2 flex min-h-10 w-full items-center gap-2.5 border-t border-border px-3 pt-3 text-[13px] font-medium text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </details>
        </div>
      </header>

      <aside className="fixed z-30 hidden h-full w-[220px] flex-col border-r border-border bg-card md:flex">
      {/* Logo */}
      <div className="border-b border-border px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
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
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        <div>
          <div className="mb-1 px-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
              Work
            </span>
          </div>
          <div className="space-y-0.5">
            {primaryNav.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
                    active
                      ? 'bg-primary/[0.06] text-primary'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )}
                >
                  {active && <div className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r bg-primary" />}
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        <details className="group" open={networkNav.some((item) => isActive(item.href))}>
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground">
            <span className="flex items-center gap-2.5">
              <Landmark className="h-4 w-4" />
              Network
            </span>
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-0.5 space-y-0.5 pl-3">
            {networkNav.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2 text-[12px] font-medium transition-colors',
                    active ? 'bg-primary/[0.06] text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </details>

        <details className="group rounded-lg border border-border/60 bg-surface/30" open={internalNav.some((item) => isActive(item.href))}>
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70 transition-colors hover:text-foreground">
            Internal tools
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
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
      <div className="flex items-center gap-1 border-t border-border px-3 py-3">
        <button
          onClick={handleSignOut}
          className="flex flex-1 items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
        <ThemeToggle />
      </div>
      </aside>
    </>
  )
}
