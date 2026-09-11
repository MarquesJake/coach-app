import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MandateLonglistClient } from './_components/mandate-longlist-client'
import { MandateTabNav } from '../_components/mandate-tab-nav'

export const metadata = { title: 'Research pool' }


export default async function MandateLonglistPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = params
  const { data: mandate } = await supabase
    .from('mandates')
    .select('id, custom_club_name, club_id, clubs(name)')
    .eq('id', id)
    .single()
  if (!mandate) notFound()

  const { data: longlist, error: longlistError } = await supabase
    .from('mandate_longlist')
    .select('id, coach_id, ranking_score, fit_explanation')
    .eq('mandate_id', id)
    .order('ranking_score', { ascending: false, nullsFirst: false })

  const { data: coaches, error: coachesError } = await supabase
    .from('coaches')
    .select('id, name, club_current, pressing_intensity, build_preference, leadership_style, overall_manual_score, tactical_fit_score, leadership_score, media_risk_score, intelligence_confidence, wage_expectation')
    .order('name')

  const clubName = (mandate as { custom_club_name?: string | null; clubs?: { name?: string } | null }).custom_club_name
    ?? (mandate as { clubs?: { name?: string } | null }).clubs?.name
    ?? 'Mandate'

  const { data: shortlist, error: shortlistError } = await supabase.from('mandate_shortlist').select('coach_id').eq('mandate_id', id)
  if (longlistError || coachesError || shortlistError) throw new Error('The candidate field could not be loaded. Refresh to retry.')

  return (
    <div className="max-w-[1200px] mx-auto">
      <MandateTabNav mandateId={id} />
      <Link href={`/mandates/${id}/candidates`} className="text-sm text-primary underline">Back to candidates</Link>
      <h1 className="text-lg font-semibold text-foreground mt-1">Research pool · {clubName}</h1>
      <p className="text-xs text-muted-foreground mt-0.5">Rank and filter coaches for this mandate.</p>

      <MandateLonglistClient
        mandateId={id}
        initialLonglist={longlist ?? []}
        coaches={coaches ?? []}
        shortlistedCoachIds={(shortlist ?? []).map(row => row.coach_id)}
      />
    </div>
  )
}
