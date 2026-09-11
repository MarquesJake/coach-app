import { redirect } from 'next/navigation'
import { legacyComparisonHref } from '@/lib/coaches/route-audit'
import type { ResearchParams } from '@/lib/research-context'

export const metadata = { title: 'Compare' }


/** Redirect legacy /compare to /coaches/compare. */
export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<ResearchParams>
}) {
  const params = await searchParams
  redirect(legacyComparisonHref(params))
}
