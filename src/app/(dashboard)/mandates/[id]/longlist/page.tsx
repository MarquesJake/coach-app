import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MandateLonglistClient } from './_components/mandate-longlist-client'

export default async function MandateLonglistPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = params
  const { data: mandate } = await supabase
    .from('mandates')
    .select('id, custom_club_name, club_id, clubs(name)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!mandate) notFound()

  const { data: longlist } = await supabase
    .from('mandate_longlist')
    .select('id, coach_id, ranking_score, fit_explanation')
    .eq('mandate_id', id)
    .order('ranking_score', { ascending: false, nullsFirst: false })

  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, name, club_current, pressing_intensity, build_preference, leadership_style, overall_manual_score, tactical_fit_score, leadership_score, media_risk_score, intelligence_confidence, wage_expectation')
    .eq('user_id', user.id)
    .order('name')

  const clubName = (mandate as { custom_club_name?: string | null; clubs?: { name?: string } | null }).custom_club_name
    ?? (mandate as { clubs?: { name?: string } | null }).clubs?.name
    ?? 'Mandate'

  return (
    <div className="max-w-[1200px] mx-auto">
      <Link href={`/mandates/${id}`} className="text-xs text-muted-foreground hover:text-foreground">← Mandate</Link>
      <h1 className="text-lg font-semibold text-foreground mt-1">Longlist · {clubName}</h1>
      <p className="text-xs text-muted-foreground mt-0.5">Rank and filter coaches for this mandate.</p>

      <MandateLonglistClient
        mandateId={id}
        initialLonglist={longlist ?? []}
        coaches={coaches ?? []}
      />
    </div>
  )
}
