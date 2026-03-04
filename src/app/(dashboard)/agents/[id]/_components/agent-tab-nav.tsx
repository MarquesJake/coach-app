'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Overview', href: '' },
  { label: 'Coaches', href: '/coaches' },
  { label: 'Clubs', href: '/clubs' },
  { label: 'Interactions', href: '/interactions' },
  { label: 'Deals', href: '/deals' },
] as const

export function AgentTabNav({ agentId }: { agentId: string }) {
  const pathname = usePathname()
  const base = `/agents/${agentId}`

  return (
    <div className="flex gap-1 border-b border-border mb-4 mt-2 overflow-x-auto">
      {TABS.map((tab) => {
        const href = tab.href ? `${base}${tab.href}` : base
        const isActive = pathname === href
        return (
          <Link
            key={tab.href || 'overview'}
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
