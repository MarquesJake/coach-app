import { redirect } from 'next/navigation'

/** Redirect legacy /compare to /coaches/compare. */
export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const params = await searchParams
  const ids = (params.ids ?? '').trim()
  redirect(ids ? `/coaches/compare?ids=${encodeURIComponent(ids)}` : '/coaches/compare')
}
