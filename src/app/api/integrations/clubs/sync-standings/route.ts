import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY!

// League ID → label mapping
const LEAGUES = [
  { id: 39, label: 'Premier League', tier: '1' },
  { id: 40, label: 'Championship',   tier: '2' },
  { id: 41, label: 'League One',     tier: '3' },
  { id: 42, label: 'League Two',     tier: '4' },
]

// Seasons to sync (start year of season)
const SEASONS = [2020, 2021, 2022, 2023, 2024]

type StandingEntry = {
  rank: number
  team: { id: number; name: string }
  points: number
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }
}

export async function POST() {
  if (!API_FOOTBALL_KEY) return NextResponse.json({ error: 'API_FOOTBALL_KEY not configured' }, { status: 500 })

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Build a map of API-Football team ID → our club ID
  const { data: clubs } = await supabase
    .from('clubs')
    .select('id, external_id')
    .eq('user_id', user.id)
    .eq('external_source', 'api-football')

  const clubByApiId = new Map<string, string>()
  for (const c of clubs ?? []) {
    if (c.external_id) clubByApiId.set(c.external_id, c.id)
  }

  let inserted = 0
  let updated = 0
  const log: string[] = []

  for (const season of SEASONS) {
    for (const league of LEAGUES) {
      const res = await fetch(
        `https://v3.football.api-sports.io/standings?league=${league.id}&season=${season}`,
        { headers: { 'x-apisports-key': API_FOOTBALL_KEY } }
      )
      const data = await res.json()
      const standings: StandingEntry[] = data.response?.[0]?.league?.standings?.[0] ?? []

      if (standings.length === 0) {
        log.push(`${league.label} ${season}/${season + 1}: no data`)
        continue
      }

      const seasonLabel = `${season}/${String(season + 1).slice(2)}`

      for (const entry of standings) {
        const clubId = clubByApiId.get(String(entry.team.id))
        if (!clubId) continue

        const rowData = {
          user_id: user.id,
          club_id: clubId,
          season: seasonLabel,
          league_position: entry.rank,
          league_label: league.label,
          points: entry.points,
          goals_for: entry.all.goals.for,
          goals_against: entry.all.goals.against,
          data_source: 'api-football',
        }

        const { data: existing } = await supabase
          .from('club_season_results')
          .select('id, data_source')
          .eq('club_id', clubId)
          .eq('season', seasonLabel)
          .maybeSingle()

        if (!existing) {
          await supabase.from('club_season_results').insert(rowData)
          inserted++
        } else if (existing.data_source !== 'manual') {
          await supabase.from('club_season_results').update(rowData).eq('id', existing.id)
          updated++
        }
      }

      log.push(`${league.label} ${seasonLabel}: ${standings.length} clubs`)
    }
  }

  return NextResponse.json({ ok: true, inserted, updated, log })
}
