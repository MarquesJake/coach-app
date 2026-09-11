'use client'

import { usePathname } from 'next/navigation'
import Link from '@/app/(dashboard)/coaches/_components/research-context-link'
import { INTELLIGENCE_SUBNAV } from '../../_components/module-nav'

export function ResearchSectionNav() {
  const pathname = usePathname()
  return <nav aria-label="Research sections" className="gaffa-tabs mb-4">{INTELLIGENCE_SUBNAV.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined}>{item.label}</Link>)}</nav>
}
