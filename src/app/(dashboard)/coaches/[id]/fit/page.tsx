import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { getMandatesForUser } from '@/lib/db/mandate'
import { getEvidenceCountForCoach } from '@/lib/db/fit'
import { computeCompleteness } from '@/app/(dashboard)/coaches/[id]/_lib/coach-completeness'
import { FitClient } from './_components/fit-client'

export default async function CoachFitPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error: coachError } = await getCoachById(user.id, params.id)
  if (coachError || !coach) notFound()

  const { data: mandatesList } = await getMandatesForUser(user.id)
  const mandates = (mandatesList ?? []).map((m: { id: string; custom_club_name?: string | null; clubs?: { name?: string | null } | null }) => ({
    id: m.id,
    label: (m.custom_club_name || (m.clubs as { name?: string } | null)?.name) || 'Mandate',
  }))

  const evidenceCount = await getEvidenceCountForCoach(user.id, params.id)
  const completeness = computeCompleteness(coach as Record<string, unknown>)

  return (
    <FitClient
      coachId={params.id}
      coach={{
        name: coach.name,
        preferred_name: coach.preferred_name,
        availability_status: coach.availability_status,
        market_status: coach.market_status,
        overall_manual_score: coach.overall_manual_score,
        intelligence_confidence: coach.intelligence_confidence,
      }}
      mandates={mandates}
      evidenceCount={evidenceCount}
      completenessPercent={completeness}
    />
  )
}
