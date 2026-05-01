import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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

function getCurrentFootballSeasonStartYear(): number {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1
  // European football seasons roll over around July.
  return month >= 7 ? year : year - 1
}

function getSeasonCandidates(): number[] {
  const current = getCurrentFootballSeasonStartYear()
  const preferred = [current, current - 1, 2024, 2023, 2022]
  return Array.from(new Set(preferred)).filter((y) => y >= 2022)
}

export async function POST() {
  if (!API_FOOTBALL_KEY) {
    return NextResponse.json({ error: 'API_FOOTBALL_KEY not configured' }, { status: 500 })
  }

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch existing clubs for this user (by api-football external_id)
  const { data: existing } = await supabase
    .from('clubs')
    .select('id, name, external_id, external_source, tier, league')
    .eq('user_id', user.id)

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
  const seenExternalIds = new Set<string>()
  const seasonCandidates = getSeasonCandidates()
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
      seenExternalIds.add(extId)
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
          .eq('user_id', user.id)
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

  // Clean up any remaining stale TheSportsDB-only entries that are now duplicated
  // (clubs that were seeded with thesportsdb but now have an api-football twin by name)
  const { data: allClubs } = await supabase
    .from('clubs')
    .select('id, name, external_source')
    .eq('user_id', user.id)

  const apiFootballNames = new Set(
    (allClubs ?? [])
      .filter(c => c.external_source === 'api-football')
      .map(c => c.name.toLowerCase().trim())
  )
  const staleIds = (allClubs ?? [])
    .filter(c => c.external_source !== 'api-football' && apiFootballNames.has(c.name.toLowerCase().trim()))
    .map(c => c.id)

  let cleaned = 0
  if (staleIds.length > 0) {
    const { error: cleanupErr } = await supabase.from('clubs').delete().in('id', staleIds).eq('user_id', user.id)
    if (cleanupErr) errors.push(`cleanup duplicate stale: ${cleanupErr.message}`)
    else cleaned = staleIds.length
  }

  // Remove stale API-Football clubs from tracked English divisions that are no longer present this season.
  const leagueLabels = LEAGUES.map((l) => l.label)
  const { data: englishApiClubs } = await supabase
    .from('clubs')
    .select('id, external_id, league')
    .eq('user_id', user.id)
    .eq('external_source', 'api-football')
    .eq('country', 'England')
    .in('league', leagueLabels)

  const staleSeasonIds = (englishApiClubs ?? [])
    .filter((c) => c.external_id && !seenExternalIds.has(c.external_id))
    .map((c) => c.id)

  let removedStaleSeason = 0
  if (staleSeasonIds.length > 0) {
    const { error: seasonCleanupErr } = await supabase.from('clubs').delete().in('id', staleSeasonIds).eq('user_id', user.id)
    if (seasonCleanupErr) errors.push(`cleanup season stale: ${seasonCleanupErr.message}`)
    else removedStaleSeason = staleSeasonIds.length
  }

  return NextResponse.json({
    ok: successfulLeagues > 0,
    partial: errors.length > 0,
    successful_leagues: successfulLeagues,
    added,
    updated,
    cleaned,
    removed_stale_season: removedStaleSeason,
    season: usedSeason,
    season_candidates: seasonCandidates,
    log,
    errors,
  })
}
