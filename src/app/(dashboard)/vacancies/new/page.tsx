import { redirect } from 'next/navigation'

export default function LegacyVacancyRedirectPage() {
  redirect('/mandates/new')
}
