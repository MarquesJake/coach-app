import { redirect } from 'next/navigation'

/** Redirect legacy mandate-fit to fit. */
export default async function MandateFitRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/coaches/${params.id}/fit`)
}
