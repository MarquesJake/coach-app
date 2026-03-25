import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type SportsDBTeam = {
  idTeam: string
  idLeague: string | null
  strTeam: string
  strLeague: string | null
  strCountry: string | null
  strBadge: string | null
  strDescriptionEN: string | null
  strManager: string | null
  strStadium: string | null
  intFormedYear: string | null
  strWebsite: string | null
  strStadiumLocation: string | null
  intStadiumCapacity: string | null
  strSport?: string | null
}

type TableEntry = {
  teamid: string
  name: string
  intRank: string
  points: string
  goalsfor: string
  goalsagainst: string
  played: string
  win: string
  draw: string
  loss: string
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const { clubId } = params
  const supabase = createServerSupabaseClient()

  // 1. Verify session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Verify club exists and belongs to user
  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .select('id, external_id, external_source, user_id, id_league')
    .eq('id', clubId)
    .eq('user_id', user.id)
    .single()

  if (clubError || !club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 })
  }

  // 3. Check external_id
  if (!club.external_id) {
    return NextResponse.json(
      { error: 'Club has no external source to sync from' },
      { status: 400 }
    )
  }

  // 4. Fetch full team details from TheSportsDB
  const lookupUrl = `https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id=${club.external_id}`
  let team: SportsDBTeam | null = null
  try {
    const res = await fetch(lookupUrl)
    if (res.ok) {
      const data = await res.json()
      team = data.teams?.[0] ?? null
    }
  } catch {
    // ignore fetch errors
  }

  if (!team) {
    return NextResponse.json({ error: 'Team not found in TheSportsDB' }, { status: 404 })
  }

  // Safety check: if TheSportsDB returned a different team ID, the lookup is broken
  // (free tier lookupteam.php is known to return wrong data — fall back to search)
  if (team.idTeam !== club.external_id) {
    // Try to recover via searchteams — find the matching entry by external_id
    const { data: clubRecord } = await supabase
      .from('clubs')
      .select('name')
      .eq('id', clubId)
      .single()

    let recovered = false
    if (clubRecord?.name) {
      try {
        const searchRes = await fetch(
          `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(clubRecord.name)}`
        )
        if (searchRes.ok) {
          const searchData = await searchRes.json()
          const match = (searchData.teams ?? []).find(
            (t: SportsDBTeam) => t.idTeam === club.external_id && t.strSport === 'Soccer'
          )
          if (match) {
            team = match
            recovered = true
          }
        }
      } catch {
        // ignore
      }
    }

    if (!recovered) {
      return NextResponse.json(
        { error: 'TheSportsDB returned mismatched team — lookup may be unavailable on free tier' },
        { status: 422 }
      )
    }
  }

  // team is guaranteed non-null here (early returns handle null cases above)
  const safeTeam = team!

  // 5. Build club update object
  const clubUpdate: Record<string, unknown> = {
    last_synced_at: new Date().toISOString(),
  }
  if (safeTeam.strBadge) clubUpdate.badge_url = safeTeam.strBadge
  if (safeTeam.strDescriptionEN) clubUpdate.description = safeTeam.strDescriptionEN
  if (safeTeam.strStadium) clubUpdate.stadium = safeTeam.strStadium
  if (safeTeam.intFormedYear) clubUpdate.founded_year = safeTeam.intFormedYear
  if (safeTeam.idLeague) clubUpdate.id_league = safeTeam.idLeague
  if (safeTeam.strManager) clubUpdate.current_manager = safeTeam.strManager
  if (safeTeam.strWebsite) clubUpdate.website = safeTeam.strWebsite
  if (safeTeam.strStadiumLocation) clubUpdate.stadium_location = safeTeam.strStadiumLocation
  if (safeTeam.intStadiumCapacity) clubUpdate.stadium_capacity = safeTeam.intStadiumCapacity

  // 6. Update the club record
  await supabase.from('clubs').update(clubUpdate).eq('id', clubId)

  const idLeague = safeTeam.idLeague ?? club.id_league

  // 7. Season standings sync
  let seasons_added = 0
  let seasons_updated = 0
  let seasons_skipped = 0

  if (idLeague) {
    const now = new Date()
    const month = now.getMonth() + 1
    const startYear = month >= 7 ? now.getFullYear() : now.getFullYear() - 1
    const seasons: string[] = []
    for (let i = 0; i < 7; i++) {
      seasons.push(`${startYear - i}-${startYear - i + 1}`)
    }

    // Fetch existing season results for this club
    const { data: existingRows } = await supabase
      .from('club_season_results')
      .select('id, season, data_source')
      .eq('club_id', clubId)

    const existingMap = new Map<string, { id: string; data_source: string }>()
    for (const row of existingRows ?? []) {
      existingMap.set(row.season, { id: row.id, data_source: row.data_source ?? 'manual' })
    }

    for (const season of seasons) {
      let tableData: TableEntry[] | null = null
      try {
        const tableUrl = `https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=${idLeague}&s=${season}`
        const tableRes = await fetch(tableUrl)
        if (tableRes.ok) {
          const tableJson = await tableRes.json()
          tableData = tableJson.table ?? null
        }
      } catch {
        // ignore
      }

      if (!tableData) continue

      const entry = tableData.find((e) => e.teamid === club.external_id)
      if (!entry) continue

      const rowData = {
        league_position: parseInt(entry.intRank, 10) || null,
        points: parseInt(entry.points, 10) || null,
        goals_for: parseInt(entry.goalsfor, 10) || null,
        goals_against: parseInt(entry.goalsagainst, 10) || null,
      }

      const existing = existingMap.get(season)

      if (!existing) {
        // INSERT
        await supabase.from('club_season_results').insert({
          user_id: user.id,
          club_id: clubId,
          season,
          data_source: 'thesportsdb',
          ...rowData,
        })
        seasons_added++
      } else if (existing.data_source === 'thesportsdb') {
        // UPDATE
        await supabase
          .from('club_season_results')
          .update({ ...rowData })
          .eq('id', existing.id)
        seasons_updated++
      } else {
        // manual — skip
        seasons_skipped++
      }
    }
  }

  // 8. Coaching history sync
  let manager_added = false

  if (safeTeam.strManager) {
    const { data: existingCoach } = await supabase
      .from('club_coaching_history')
      .select('id')
      .eq('club_id', clubId)
      .eq('coach_name', safeTeam.strManager)
      .is('end_date', null)
      .eq('data_source', 'thesportsdb')
      .maybeSingle()

    if (!existingCoach) {
      await supabase.from('club_coaching_history').insert({
        user_id: user.id,
        club_id: clubId,
        coach_name: safeTeam.strManager,
        end_date: null,
        data_source: 'thesportsdb',
        style_tags: [],
      })
      manager_added = true
    }
  }

  return NextResponse.json({
    ok: true,
    synced: {
      club: clubUpdate,
      seasons_added,
      seasons_updated,
      seasons_skipped,
      manager_added,
    },
  })
}
