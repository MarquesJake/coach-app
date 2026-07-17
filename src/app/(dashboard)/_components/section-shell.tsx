'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  const showSubnav = subnav.length > 0

  const wrapperClass = sticky
    ? 'sticky top-0 z-20 bg-background border-b border-border pb-0 -mx-4 px-4 pt-0 -mt-5 sm:-mx-6 sm:px-6 sm:-mt-6'
    : 'border-b border-border pb-4'

  return (
    <div className={wrapperClass}>
      <div className="flex flex-col gap-3 py-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h1>
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
