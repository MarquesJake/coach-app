import { redirect } from 'next/navigation'

// The mandate builder (edit page) replaces the old step-2 preferences flow.
export default function MandatePreferencesPage({ params }: { params: { id: string } }) {
  redirect(`/mandates/${params.id}/edit`)
}
