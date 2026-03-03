'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS: { label: string; segment: string | null }[] = [
  { label: 'Overview', segment: null },
  { label: 'Tactical', segment: 'tactical' },
  { label: 'Leadership', segment: 'leadership' },
  { label: 'Coaching Model', segment: 'coaching-model' },
  { label: 'Career', segment: 'career' },
  { label: 'Staff Network', segment: 'staff-network' },
  { label: 'Similar', segment: 'similar' },
  { label: 'Data', segment: 'data' },
  { label: 'Risk & Intelligence', segment: 'risk' },
  { label: 'Scoring', segment: 'scoring' },
  { label: 'Fit', segment: 'fit' },
]

export function CoachTabNav({ coachId }: { coachId: string }) {
  const pathname = usePathname()
  const base = `/coaches/${coachId}`
  const isOverview = pathname === base
  return (
    <div className="flex gap-1 border-b border-border mb-4 mt-2 overflow-x-auto">
      <Link
        href={base}
        className={cn(
          'px-3 py-2 text-xs font-medium border-b-2 -mb-px shrink-0',
          isOverview ? 'text-primary border-primary' : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border'
        )}
      >
        Overview
      </Link>
      {TABS.filter((t) => t.segment).map((tab) => {
        const href = `${base}/${tab.segment}`
        const isActive = pathname === href
        return (
          <Link
            key={tab.segment}
            href={href}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px shrink-0',
              isActive ? 'text-primary border-primary' : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
