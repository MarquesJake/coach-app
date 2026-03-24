'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = (id: string) => [
  { label: 'Workspace', href: `/mandates/${id}/workspace` },
  { label: 'Overview', href: `/mandates/${id}` },
  { label: 'Longlist', href: `/mandates/${id}/longlist` },
  { label: 'Shortlist', href: `/mandates/${id}/shortlist` },
]

export function MandateTabNav({ mandateId }: { mandateId: string }) {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 border-b border-border mb-5">
      {tabs(mandateId).map(({ label, href }) => {
        const active =
          href === `/mandates/${mandateId}`
            ? pathname === `/mandates/${mandateId}`
            : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'px-3 py-2 text-xs font-medium -mb-px border-b-2 transition-colors',
              active
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            )}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
