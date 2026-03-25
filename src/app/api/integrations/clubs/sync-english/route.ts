import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY!

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

export async function GET() {
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

  for (const league of LEAGUES) {
    const res = await fetch(
      `https://v3.football.api-sports.io/teams?league=${league.id}&season=2024`,
      { headers: { 'x-apisports-key': API_FOOTBALL_KEY } }
    )
    const data = await res.json()
    const teams: APIFootballTeam[] = data.response ?? []

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
        await supabase
          .from('clubs')
          .update(payload)
          .eq('id', existingRecord.id)
          .eq('user_id', user.id)
        updated++
      } else {
        await supabase
          .from('clubs')
          .insert({ ...payload, user_id: user.id })
        added++
      }
    }

    log.push(`${league.label}: ${teams.length} clubs`)
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
    await supabase.from('clubs').delete().in('id', staleIds).eq('user_id', user.id)
    cleaned = staleIds.length
  }

  return NextResponse.json({ ok: true, added, updated, cleaned, log })
}
