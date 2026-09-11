import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { currentRosterSeasonCandidates } from '@/lib/integrations/football-season'

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY!
export const dynamic = 'force-dynamic'

const LEAGUES = [
  { id: 39,  label: 'Premier League', tier: '1' },
  { id: 40,  label: 'Championship',   tier: '2' },
  { id: 41,  label: 'League One',     tier: '3' },
  { id: 42,  label: 'League Two',     tier: '4' },
]

type APIFootballTeam = {
  team: {
    id: number
    name: string
    code: string | null
    country: string
    founded: number | null
    logo: string | null
  }
  venue: {
    id: number | null
    name: string | null
    city: string | null
    capacity: number | null
  }
}

export async function POST() {
  if (!API_FOOTBALL_KEY) {
    return NextResponse.json({ error: 'API_FOOTBALL_KEY not configured' }, { status: 500 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch existing clubs for this user (by api-football external_id)
  const { data: existing } = await supabase
    .from('clubs')
    .select('id, name, external_id, external_source, tier, league')

  const byExternalId = new Map<string, { id: string; tier: string | null; league: string }>()
  const byName = new Map<string, { id: string; tier: string | null; league: string }>()
  for (const c of existing ?? []) {
    if (c.external_id && c.external_source === 'api-football') {
      byExternalId.set(c.external_id, c)
    }
    byName.set(c.name.toLowerCase().trim(), c)
  }

  let added = 0
  let updated = 0
  const log: string[] = []
  const errors: string[] = []
  let successfulLeagues = 0
  const seasonCandidates = currentRosterSeasonCandidates()
  let usedSeason: number | null = null

  for (const league of LEAGUES) {
    let teams: APIFootballTeam[] = []
    let leagueSeasonUsed: number | null = null
    let lastLeagueError: string | null = null

    for (const season of seasonCandidates) {
      const res = await fetch(
        `https://v3.football.api-sports.io/teams?league=${league.id}&season=${season}`,
        { headers: { 'x-apisports-key': API_FOOTBALL_KEY } }
      )
      if (!res.ok) {
        lastLeagueError = `${league.label}: API ${res.status} for ${season}`
        continue
      }
      const data = await res.json()
      if (data?.errors && Object.keys(data.errors).length > 0) {
        lastLeagueError = `${league.label}: ${JSON.stringify(data.errors)} for ${season}`
        continue
      }
      teams = (data.response ?? []) as APIFootballTeam[]
      if (!teams.length) {
        lastLeagueError = `${league.label}: no current-season teams available for ${season}; existing records retained`
        continue
      }
      leagueSeasonUsed = season
      usedSeason = season
      break
    }

    if (!leagueSeasonUsed) {
      errors.push(lastLeagueError ?? `${league.label}: no accessible season found`)
      continue
    }
    successfulLeagues++

    for (const { team, venue } of teams) {
      const extId = String(team.id)
      const existing_by_id = byExternalId.get(extId)
      const existing_by_name = byName.get(team.name.toLowerCase().trim())
      const existingRecord = existing_by_id ?? existing_by_name

      const payload = {
        name: team.name,
        country: 'England',
        league: league.label,
        tier: league.tier,
        external_id: extId,
        external_source: 'api-football',
        badge_url: team.logo ?? null,
        founded_year: team.founded ? String(team.founded) : null,
        stadium: venue.name ?? null,
        stadium_location: venue.city ?? null,
        stadium_capacity: venue.capacity ? String(venue.capacity) : null,
        last_synced_at: new Date().toISOString(),
      }

      if (existingRecord) {
        // Update — always correct tier/league/badge from authoritative source
        const { error: updateErr } = await supabase
          .from('clubs')
          .update(payload)
          .eq('id', existingRecord.id)
        if (updateErr) {
          errors.push(`update ${team.name}: ${updateErr.message}`)
        } else {
          updated++
        }
      } else {
        const { error: insertErr } = await supabase
          .from('clubs')
          .insert({ ...payload, user_id: user.id })
        if (insertErr) {
          errors.push(`insert ${team.name}: ${insertErr.message}`)
        } else {
          added++
        }
      }
    }

    log.push(`${league.label} (${leagueSeasonUsed}/${String(leagueSeasonUsed + 1).slice(-2)}): ${teams.length} clubs`)
  }

  // Missing provider rows and name matches are not authority to delete client records.

  return NextResponse.json({
    ok: successfulLeagues > 0,
    partial: errors.length > 0,
    successful_leagues: successfulLeagues,
    added,
    updated,
    cleaned: 0,
    removed_stale_season: 0,
    season: usedSeason,
    season_candidates: seasonCandidates,
    log,
    errors,
  })
}
