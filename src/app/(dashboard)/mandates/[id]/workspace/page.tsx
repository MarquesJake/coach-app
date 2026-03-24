import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MandateWorkspaceClient } from './_components/mandate-workspace-client'
import { MandateTabNav } from '../_components/mandate-tab-nav'

export default async function MandateWorkspacePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch mandate + full club intelligence
  const { data: mandate, error: mandateError } = await supabase
    .from('mandates')
    .select(`
      id, strategic_objective, board_risk_appetite, budget_band, succession_timeline,
      custom_club_name, status, priority,
      clubs (
        id, name, league, country, tier, ownership_model,
        tactical_model, pressing_model, build_model,
        board_risk_tolerance, strategic_priority,
        market_reputation, media_pressure, development_vs_win_now,
        environment_assessment, instability_risk,
        stadium, founded_year, current_manager, website, badge_url,
        notes, last_synced_at
      )
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (mandateError || !mandate) notFound()

  const clubId = (mandate.clubs as { id?: string } | null)?.id ?? null

  // Fetch shortlist with fit fields
  const { data: shortlist } = await supabase
    .from('mandate_shortlist')
    .select(`
      id, coach_id, candidate_stage, placement_probability, risk_rating, status, notes,
      network_source, network_recommender, network_relationship,
      fit_tactical, fit_cultural, fit_level, fit_communication, fit_network, fit_notes,
      coaches ( name, club_current, nationality )
    `)
    .eq('mandate_id', params.id)
    .order('created_at', { ascending: true })

  // Fetch club season results — up to 8 seasons, sorted oldest first for trajectory reading
  const { data: seasonResults } = clubId
    ? await supabase
        .from('club_season_results')
        .select('season, league_position, points, goals_for, goals_against')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .order('season', { ascending: true })
        .limit(8)
    : { data: [] }

  // Fetch club coaching history — up to 10, sorted oldest first
  const { data: coachingHistory } = clubId
    ? await supabase
        .from('club_coaching_history')
        .select('coach_name, start_date, end_date, reason_for_exit, style_tags, data_source')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .order('start_date', { ascending: true })
        .limit(10)
    : { data: [] }

  return (
    <div>
      <MandateTabNav mandateId={params.id} />
      <MandateWorkspaceClient
        mandate={mandate as Parameters<typeof MandateWorkspaceClient>[0]['mandate']}
        shortlist={(shortlist ?? []) as Parameters<typeof MandateWorkspaceClient>[0]['shortlist']}
        seasonResults={(seasonResults ?? []) as Parameters<typeof MandateWorkspaceClient>[0]['seasonResults']}
        coachingHistory={(coachingHistory ?? []) as Parameters<typeof MandateWorkspaceClient>[0]['coachingHistory']}
      />
    </div>
  )
}
