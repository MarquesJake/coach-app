'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRIMARY_TABS: { label: string; segment: string | null }[] = [
  { label: 'Overview', segment: null },
  { label: 'Football', segment: 'tactical' },
  { label: 'Career', segment: 'career' },
  { label: 'Intelligence', segment: 'intelligence' },
]

const DETAIL_TABS = [
  { label: 'Leadership', segment: 'leadership' },
  { label: 'Coaching model', segment: 'coaching-model' },
  { label: 'Staff Network', segment: 'staff-network' },
  { label: 'Similar', segment: 'similar' },
  { label: 'Data', segment: 'data' },
  { label: 'Due diligence', segment: 'risk' },
  { label: 'Scoring', segment: 'scoring' },
  { label: 'Fit', segment: 'fit' },
] as const

export function CoachTabNav({ coachId }: { coachId: string }) {
  const pathname = usePathname()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const base = `/coaches/${coachId}`
  const detailsActive = DETAIL_TABS.some((tab) => pathname === `${base}/${tab.segment}`)
  return (
    <div className="mb-4 mt-2 flex items-end border-b border-border">
      <div className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto">
      {PRIMARY_TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base
        const isActive = pathname === href
        return (
          <Link
            key={tab.label}
            href={href}
            className={cn(
              '-mb-px shrink-0 border-b-2 px-3 py-2 text-xs font-medium',
              isActive ? 'text-primary border-primary' : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
      </div>
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setDetailsOpen((open) => !open)}
          aria-expanded={detailsOpen}
          className={cn(
          '-mb-px flex items-center gap-1 border-b-2 px-3 py-2 text-xs font-medium',
          detailsActive ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
        )}>
          More
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', detailsOpen && 'rotate-180')} />
        </button>
        {detailsOpen && <div className="absolute right-0 z-40 mt-1 grid min-w-48 gap-1 border border-border bg-card p-1.5 shadow-lg">
          {DETAIL_TABS.map((tab) => {
            const href = `${base}/${tab.segment}`
            return (
              <Link
                key={tab.segment}
                href={href}
                onClick={() => setDetailsOpen(false)}
                className={cn(
                  'rounded px-3 py-2 text-xs font-medium',
                  pathname === href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>}
      </div>
    </div>
  )
}
