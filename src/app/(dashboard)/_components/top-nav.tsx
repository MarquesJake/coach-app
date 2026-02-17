'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Radio,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Mandates', href: '/mandates', icon: Briefcase },
  { label: 'Coach Inventory', href: '/coaches', icon: Users },
  { label: 'Intelligence', href: '/intelligence', icon: Radio },
]

export function TopNav() {
  const pathname = usePathname()

  return (
    <>
      {/* Top bar: logo + brand */}
      <header
        className="fixed top-0 left-0 right-0 z-40 h-[var(--nav-height)] border-b border-border bg-background"
        style={{ height: 'var(--nav-height)' }}
      >
        <div className="flex h-full items-center px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-sm leading-tight tracking-tight">
                Executive Search
              </span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider leading-tight">
                Confidential Advisory Platform
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* Tab bar: main nav links */}
      <div
        className="fixed left-0 right-0 z-30 flex items-center gap-0.5 border-b border-border bg-card px-6"
        style={{ top: 'var(--nav-height)', height: 'var(--tab-height)' }}
      >
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard' || pathname.startsWith('/dashboard/')
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-t text-[13px] font-medium transition-colors -mb-px',
                isActive
                  ? 'text-primary bg-background border border-border border-b-transparent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-overlay/30'
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </>
  )
}
