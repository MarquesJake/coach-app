'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = (id: string) => [
  { label: 'Overview', href: `/mandates/${id}/decision`, matches: [`/mandates/${id}`, `/mandates/${id}/decision`, `/mandates/${id}/plan`] },
  { label: 'Brief', href: `/mandates/${id}/workspace`, matches: [`/mandates/${id}/workspace`, `/mandates/${id}/preferences`, `/mandates/${id}/edit`] },
  { label: 'Candidates', href: `/mandates/${id}/candidates`, matches: [`/mandates/${id}/candidates`, `/mandates/${id}/longlist`, `/mandates/${id}/shortlist`] },
  { label: 'Research', href: `/mandates/${id}/research`, matches: [`/mandates/${id}/research`] },
  { label: 'Assessment', href: `/mandates/${id}/assessment`, matches: [`/mandates/${id}/assessment`] },
  { label: 'Board report', href: `/mandates/${id}/pack`, matches: [`/mandates/${id}/pack`] },
]

export function MandateTabNav({ mandateId }: { mandateId: string }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Mandate sections" className="gaffa-tabs">
      {tabs(mandateId).map(({ label, href, matches }) => {
        const assessmentPackPath = pathname.includes('/assessment/') && pathname.endsWith('/board-pack')
        const active = href.endsWith('/pack')
          ? pathname.startsWith(href) || assessmentPackPath
          : href.endsWith('/assessment')
            ? pathname.startsWith(`/mandates/${mandateId}/assessment`) && !assessmentPackPath
            : href.endsWith('/research')
              ? pathname.startsWith(href)
              : matches.some((match) => match === `/mandates/${mandateId}` ? pathname === match : pathname.startsWith(match))
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
