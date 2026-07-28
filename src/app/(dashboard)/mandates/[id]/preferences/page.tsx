import { redirect } from 'next/navigation'

// The mandate builder (edit page) replaces the old step-2 preferences flow.
export default async function MandatePreferencesPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  redirect(`/mandates/${params.id}/edit`)
}
