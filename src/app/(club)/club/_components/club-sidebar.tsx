'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Building2, ClipboardList, FileLock2, Home, LogOut, Menu, Settings, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { useEffect, useRef, useState } from 'react'
import { hasUnsavedRoleForm } from '@/lib/portals/form-exit'
import { portalLoginHref } from '@/lib/organizations/portal-entry'

const navigation = [
  { label: 'Home', href: '/club', icon: Home },
  { label: 'Club brief', href: '/club/brief', icon: ClipboardList },
  { label: 'Dossiers', href: '/club/dossiers', icon: FileLock2 },
  { label: 'Account', href: '/club/account', icon: Settings },
]

export function ClubSidebar({
  organizationName,
  showInternalWorkspaceLink,
}: {
  organizationName: string
  showInternalWorkspaceLink: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const menu = useRef<HTMLDetailsElement>(null)
  const signingOut = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const changed = () => hasUnsavedRoleForm(document.querySelector('main') ?? document)
    const warn = (event: BeforeUnloadEvent) => {
      if (!changed()) return
      event.preventDefault()
      event.returnValue = ''
    }
    const follow = (event: MouseEvent) => {
      const link = (event.target as Element).closest('main a') as HTMLAnchorElement | null
      if (!link || link.target === '_blank' || event.metaKey || event.ctrlKey || link.getAttribute('href')?.startsWith('#')) return
      if (changed() && !window.confirm('You have unsaved club form changes. Leave without saving them?')) { event.preventDefault(); event.stopPropagation() }
    }
    window.addEventListener('beforeunload', warn)
    document.addEventListener('click', follow, true)
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', follow, true) }
  }, [])
  const allowExit = () => !hasUnsavedRoleForm(document.querySelector('main') ?? document) || window.confirm('You have unsaved club form changes. Leave without saving them?')
  function navigate(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!allowExit()) { event.preventDefault(); return }
    if (menu.current) menu.current.open = false
  }

  async function signOut() {
    if (signingOut.current || !allowExit()) return
    signingOut.current = true
    setPending(true)
    setError(null)
    try {
      const result = await createClient().auth.signOut()
      if (result.error) { setError('Sign-out was not confirmed. Retry before leaving this device.'); return }
      router.push(portalLoginHref('club', `${window.location.pathname}${window.location.search}${window.location.hash}`))
      router.refresh()
    } catch { setError('Unable to connect. Retry sign-out before leaving this device.') }
    finally { signingOut.current = false; setPending(false) }
  }

  return (
    <>
    {error && <p role="alert" className="fixed bottom-4 left-4 right-4 z-50 rounded border border-destructive bg-card p-3 text-sm md:left-[236px]">{error}</p>}
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
      <Link href="/club" onClick={navigate} className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-foreground">{organizationName}</p>
          <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Club decision room</p>
        </div>
      </Link>
      <details ref={menu} className="group shrink-0">
        <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/50 hover:text-foreground" aria-label="Open club navigation">
          <Menu className="h-5 w-5" />
        </summary>
        <div className="fixed inset-x-3 top-[62px] border border-border bg-card p-2 shadow-lg">
          <nav className="grid gap-1">
            {navigation.map((item) => {
              const active = item.href === '/club' ? pathname === '/club' : pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} onClick={navigate} aria-current={active ? 'page' : undefined} className={cn('flex min-h-11 items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium', active ? 'bg-primary/[0.06] text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground')}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="mt-2 flex items-center gap-1 border-t border-border pt-2">
            {showInternalWorkspaceLink && (
              <Link href="/dashboard" onClick={navigate} className="flex min-h-10 flex-1 items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground">
                <ShieldCheck className="h-4 w-4" />
                Gaffa workspace
              </Link>
            )}
            <button onClick={signOut} disabled={pending} aria-label={pending ? 'Signing out' : 'Sign out'} title="Sign out" className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/50 hover:text-foreground disabled:opacity-50">
              <LogOut className="h-4 w-4" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </details>
    </header>

    <aside className="fixed z-30 hidden h-full w-[220px] flex-col border-r border-border bg-card md:flex">
      <div className="border-b border-border px-5 py-5">
        <Link href="/club" onClick={navigate} className="flex items-center gap-2.5">
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
            <Link key={item.href} href={item.href} onClick={navigate} aria-current={active ? 'page' : undefined} className={cn('relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors', active ? 'bg-primary/[0.06] text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground')}>
              {active && <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r bg-primary" />}
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        {showInternalWorkspaceLink && (
          <Link href="/dashboard" onClick={navigate} className="mb-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground">
            <ShieldCheck className="h-4 w-4" />
            Gaffa workspace
          </Link>
        )}
        <div className="flex items-center gap-1">
          <button onClick={signOut} disabled={pending} className="flex flex-1 items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground disabled:opacity-50">
            <LogOut className="h-4 w-4" />
            {pending ? 'Signing out...' : 'Sign out'}
          </button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
    </>
  )
}
