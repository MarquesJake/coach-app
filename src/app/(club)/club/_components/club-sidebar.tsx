'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Building2, ClipboardList, FileLock2, Home, LogOut, Settings, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

const navigation = [
  { label: 'Home', href: '/club', icon: Home },
  { label: 'Club brief', href: '/club/brief', icon: ClipboardList },
  { label: 'Dossiers', href: '/club/dossiers', icon: FileLock2 },
  { label: 'Account', href: '/club/account', icon: Settings },
]

export function ClubSidebar({ organizationName }: { organizationName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    await createClient().auth.signOut()
    router.push('/club/login')
    router.refresh()
  }

  return (
    <aside className="fixed z-30 flex h-full w-[220px] flex-col border-r border-border bg-card">
      <div className="border-b border-border px-5 py-5">
        <Link href="/club" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-foreground">{organizationName}</p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Club decision room</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navigation.map((item) => {
          const active = item.href === '/club' ? pathname === '/club' : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className={cn('relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors', active ? 'bg-primary/[0.06] text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground')}>
              {active && <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r bg-primary" />}
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link href="/dashboard" className="mb-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground">
          <ShieldCheck className="h-4 w-4" />
          Coach First workspace
        </Link>
        <div className="flex items-center gap-1">
          <button onClick={signOut} className="flex flex-1 items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
