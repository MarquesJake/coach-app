import { redirect } from 'next/navigation'



export default async function AppointmentHome({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params
  const legacy = await searchParams
  const query = new URLSearchParams()
  for (const kind of ['success', 'error']) {
    const message = legacy[kind] ?? legacy[`shortlist_${kind}`] ?? legacy[`deliverable_${kind}`]
    if (typeof message === 'string') query.set(kind, message)
  }
  redirect(`/mandates/${encodeURIComponent(id)}/decision${query.size ? `?${query}` : ''}`)
}
