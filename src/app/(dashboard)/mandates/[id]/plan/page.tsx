import { redirect } from 'next/navigation'

export const metadata = { title: 'Plan' }


export default async function AppointmentPlanAlias({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const search = new URLSearchParams()
  if (query.success) search.set('success', query.success)
  if (query.error) search.set('error', query.error)
  redirect(`/mandates/${encodeURIComponent(id)}/decision${search.size ? `?${search}` : ''}`)
}
