'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = (id: string) => [
  { label: 'Plan', href: `/mandates/${id}/plan`, matches: [`/mandates/${id}/plan`] },
  { label: 'Brief', href: `/mandates/${id}/workspace`, matches: [`/mandates/${id}`, `/mandates/${id}/workspace`, `/mandates/${id}/preferences`, `/mandates/${id}/edit`] },
  { label: 'Candidates', href: `/mandates/${id}/candidates`, matches: [`/mandates/${id}/candidates`, `/mandates/${id}/longlist`, `/mandates/${id}/shortlist`] },
  { label: 'Assessment', href: `/mandates/${id}/assessment`, matches: [`/mandates/${id}/assessment`] },
  { label: 'Pack', href: `/mandates/${id}/pack`, matches: [`/mandates/${id}/pack`] },
]

export function MandateTabNav({ mandateId }: { mandateId: string }) {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 border-b border-border mb-5">
      {tabs(mandateId).map(({ label, href, matches }) => {
        const assessmentPackPath = pathname.includes('/assessment/') && pathname.endsWith('/board-pack')
        const active = label === 'Pack'
          ? pathname.startsWith(href) || assessmentPackPath
          : label === 'Assessment'
            ? pathname.startsWith(`/mandates/${mandateId}/assessment`) && !assessmentPackPath
            : label === 'Plan'
              ? pathname.startsWith(href)
              : matches.some((match) => match === `/mandates/${mandateId}` ? pathname === match : pathname.startsWith(match))
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
