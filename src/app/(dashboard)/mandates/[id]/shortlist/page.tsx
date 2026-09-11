import { redirect } from 'next/navigation'

export const metadata = { title: 'Shortlist' }


export default async function MandateShortlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Keep old links working while using the single authoritative shortlist editor.
  redirect(`/mandates/${encodeURIComponent(id)}/candidates#shortlist-decisions`)
}
