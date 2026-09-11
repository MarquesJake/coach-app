import { redirect } from 'next/navigation'
import { legacyVacancyHref } from '@/lib/coaches/route-audit'
import type { ResearchParams } from '@/lib/research-context'

export const metadata = { title: 'New · Vacancies' }


export default async function LegacyVacancyRedirectPage({ searchParams }: { searchParams: Promise<ResearchParams> }) {
  redirect(legacyVacancyHref(await searchParams))
}
