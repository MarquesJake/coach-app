'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SubNavItem = { label: string; href: string }

type SectionShellProps = {
  title: string
  description?: string
  actions?: React.ReactNode
  subnav?: SubNavItem[]
  sticky?: boolean
  children?: React.ReactNode
}

export function SectionShell({
  title,
  description,
  actions,
  subnav = [],
  sticky = true,
  children,
}: SectionShellProps) {
  const pathname = usePathname()
  const newRecordLabels: Record<string, string> = { '/mandates/new': 'New mandate', '/coaches/new': 'New coach', '/clubs/new': 'New club', '/agents/new': 'New agent', '/staff/new': 'New staff record' }
  const entityDetail = /^\/(coaches|mandates|clubs|agents|network|coach-portal|staff)\/[0-9a-f-]{36}(?:\/|$)/i.test(pathname) || Boolean(newRecordLabels[pathname])
  const parentHref = `/${pathname.split('/')[1]}`
  // On a record the back link is enough: a trailing "Workspace" crumb appeared on
  // every tab of every record and named nothing. New-record pages keep theirs.
  if (entityDetail) return <div><div className="gaffa-breadcrumb print:hidden"><Link href={parentHref} className="inline-flex items-center gap-2"><ArrowLeft className="h-3.5 w-3.5" />{title}</Link>{newRecordLabels[pathname] && <><ChevronRight className="h-3 w-3" /><span>{newRecordLabels[pathname]}</span></>}</div>{children}</div>
  const showSubnav = subnav.length > 0
  const TitleTag = pathname === parentHref ? 'h1' : 'p'

  // Sticky headers need a solid background so page content does not show through.
  const wrapperClass = sticky
    ? 'gaffa-section-header bg-background border-b border-border pb-0'
    : 'gaffa-section-header border-b border-border pb-4'

  return (
    <div className={`${wrapperClass} print:static print:mx-0 print:border-0 print:px-0`}>
      <div className="flex flex-col gap-3 pb-0 pt-1 print:hidden">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="min-w-0">
            <TitleTag className="gaffa-page-title font-semibold text-foreground tracking-tight">{title}</TitleTag>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0 self-start">{actions}</div>}
        </div>
        {showSubnav && (
          <nav
            className="-mb-px flex max-w-full items-center gap-0.5 overflow-x-auto"
            aria-label="Section navigation"
          >
            {subnav.map((item) => {
              const isExactOnly = ['/coaches', '/agents', '/mandates', '/coach-portal', '/intelligence', '/staff', '/clubs', '/matches'].includes(item.href)
              const isActive =
                pathname === item.href ||
                (!isExactOnly && pathname.startsWith(item.href + '/'))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'shrink-0 px-3 py-2 text-sm font-medium rounded-t-md transition-colors border-b-2',
                    isActive
                      ? 'text-primary border-primary bg-primary/[0.06]'
                      : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}
      </div>
      {children != null ? <div className="pt-4">{children}</div> : null}
    </div>
  )
}
