'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { ComponentProps } from 'react'
import { readResearchContext, researchHref, researchResumeHref } from '@/lib/research-context'

export default function ResearchContextLink(props: ComponentProps<typeof Link>) {
  const params = useSearchParams()
  const pathname = usePathname()
  const context = readResearchContext(params)
  context.coach ??= pathname.match(/^\/coaches\/([0-9a-f-]{36})(?:\/|$)/i)?.[1]
  if (typeof props.href === 'string') {
    const anchor = props.href.match(/#question-([a-zA-Z0-9_-]+)$/)?.[1]
    if (anchor) context.question = anchor
  }
  return <Link {...props} href={typeof props.href === 'string' ? researchHref(props.href, context) : props.href} />
}

export function ResearchContextBanner() {
  const context = readResearchContext(useSearchParams())
  const resume = researchResumeHref(context)
  if (!resume) return null
  return <div className="mb-4 flex flex-wrap gap-4 rounded border p-3 text-sm">
    <Link href={resume} className="text-primary underline">{context.question ? 'Return to research question' : 'Return to appointment'}</Link>
    {context.briefVersion && <span>Brief version {context.briefVersion}</span>}
    {context.returnTo && context.returnTo !== resume && <Link href={context.returnTo} className="text-primary underline">Continue appointment work</Link>}
    <span className="text-muted-foreground">Research kept. Findings still need checking.</span>
  </div>
}
