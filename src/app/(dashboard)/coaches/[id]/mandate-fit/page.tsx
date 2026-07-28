import { redirect } from 'next/navigation'

/** Redirect legacy mandate-fit to fit. */
export default async function MandateFitRedirectPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  redirect(`/coaches/${params.id}/fit`)
}
