import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/types/db'
import { fetchApiFootball, getApiFootballKey } from '@/lib/integrations/api-football'


type APICoach = {
  id: number
  name: string
  age?: number | null
  nationality?: string | null
  firstname?: string | null
  lastname?: string | null
  photo?: string | null
  height?: string | null
  weight?: string | null
  birth?: { date?: string | null; place?: string | null; country?: string | null } | null
  team?: { id?: number | null; name?: string | null }
  career?: Array<{ team?: { id?: number | null; name?: string | null }; start?: string | null; end?: string | null }>
}

type ExistingCoach = Pick<Database['public']['Tables']['coaches']['Row'], 'id' | 'name' | 'nationality' | 'club_current' | 'league_experience' | 'date_of_birth' | 'age' | 'base_location' | 'languages'>
type CoachEnrichmentResult = {
  created: boolean
  updated: boolean
  matched: boolean
  skippedHistorical: boolean
  note?: string
  error?: string
}

function normaliseKey(value: string | null | undefined): string {
  return (value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim()
}

function nonEmptyString(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function isoDate(value: string | null | undefined): string | null {
  return value ? value.slice(0, 10) : null
}

function empty(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  return false
}

function isCurrentCoachForClub(coach: APICoach, apiTeamId: string): boolean {
  return (coach.career ?? []).some((stint) => String(stint.team?.id ?? '') === apiTeamId && !stint.end)
}

async function enrichClubCoachProfile(params: {
  supabase: ReturnType<typeof createServerSupabaseClient>
  userId: string
  clubId: string
  clubName: string
  clubLeague: string | null
  apiTeamId: string
  coach: APICoach
}): Promise<CoachEnrichmentResult> {
  const { supabase, userId, clubId, clubName, clubLeague, apiTeamId, coach } = params
  const name = nonEmptyString(coach.name)
  if (!name) return { created: false, updated: false, matched: false, skippedHistorical: false }
  const appearsCurrentForClub = isCurrentCoachForClub(coach, apiTeamId)

  const { data: externalMatches } = await supabase
    .from('coach_external_profiles')
    .select('coach_id')
    .eq('api_coach_id', String(coach.id))

  let matchStrategy: 'api_coach_id' | 'name_current_team' | 'name_nationality' | 'created' = 'created'
  let matchConfidence = 72
  let existing: ExistingCoach | null = null

  const externalCoachIds = (externalMatches ?? []).map((profile) => profile.coach_id).filter(Boolean)
  if (externalCoachIds.length > 0) {
    const { data } = await supabase
      .from('coaches')
      .select('id, name, nationality, club_current, league_experience, date_of_birth, age, base_location, languages')
      .in('id', externalCoachIds)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()
    existing = data as ExistingCoach | null
    if (existing) {
      matchStrategy = 'api_coach_id'
      matchConfidence = 98
    }
  }

  if (!existing) {
    const { data: candidates } = await supabase
      .from('coaches')
      .select('id, name, nationality, club_current, league_experience, date_of_birth, age, base_location, languages')
      .eq('user_id', userId)
    const nameKey = normaliseKey(name)
    const clubKey = normaliseKey(clubName)
    const nationalityKey = normaliseKey(coach.nationality)
    existing = ((candidates ?? []) as ExistingCoach[]).find((c) => normaliseKey(c.name) === nameKey && normaliseKey(c.club_current) === clubKey) ?? null
    if (existing) {
      matchStrategy = 'name_current_team'
      matchConfidence = 88
    } else {
      existing = ((candidates ?? []) as ExistingCoach[]).find((c) => normaliseKey(c.name) === nameKey && normaliseKey(c.nationality) === nationalityKey) ?? null
      if (existing) {
        matchStrategy = 'name_nationality'
        matchConfidence = 76
      }
    }
  }

  const birthPlace = nonEmptyString(coach.birth?.place ?? null)
  const birthCountry = nonEmptyString(coach.birth?.country ?? null)
  const baseLocation = [birthPlace, birthCountry].filter(Boolean).join(', ') || null
  const nationality = nonEmptyString(coach.nationality ?? null)
  const leagueExperience = clubLeague ? [clubLeague] : []
  let coachId = existing?.id ?? null

  if (existing) {
    const update: Database['public']['Tables']['coaches']['Update'] = {
      league_experience: Array.from(new Set([...(existing.league_experience ?? []), ...leagueExperience])),
      last_updated: new Date().toISOString(),
    }
    if (empty(existing.nationality) && nationality) update.nationality = nationality
    if (empty(existing.club_current)) update.club_current = clubName
    if (empty(existing.age) && coach.age != null) update.age = coach.age
    if (empty(existing.date_of_birth)) update.date_of_birth = isoDate(coach.birth?.date)
    if (empty(existing.base_location)) update.base_location = baseLocation
    if (empty(existing.languages) && nationality) update.languages = [nationality]
    const { error } = await supabase.from('coaches').update(update).eq('id', existing.id).eq('user_id', userId)
    if (error) return { created: false, updated: false, matched: true, skippedHistorical: false, error: error.message }
  } else if (!appearsCurrentForClub) {
    return {
      created: false,
      updated: false,
      matched: false,
      skippedHistorical: true,
      note: `${name}: skipped historical API-Football coach without an existing coach match`,
    }
  } else {
    const { data, error } = await supabase.from('coaches').insert({
      user_id: userId,
      name,
      preferred_name: nonEmptyString(coach.firstname ?? null),
      nationality,
      age: coach.age ?? null,
      date_of_birth: isoDate(coach.birth?.date),
      base_location: baseLocation,
      languages: nationality ? [nationality] : [],
      role_current: 'Head Coach',
      club_current: clubName,
      available_status: 'Under contract',
      availability_status: 'Under contract',
      market_status: 'Not Available',
      league_experience: leagueExperience,
      last_updated: new Date().toISOString(),
      preferred_style: 'Mixed',
      pressing_intensity: 'Medium',
      build_preference: 'Mixed',
      leadership_style: 'Collaborative',
      wage_expectation: 'TBC',
      staff_cost_estimate: 'TBC',
      reputation_tier: 'Established',
    }).select('id').single()
    if (error) return { created: false, updated: false, matched: false, skippedHistorical: false, error: error.message }
    coachId = data.id
  }

  if (!coachId) return { created: false, updated: false, matched: !!existing, skippedHistorical: false }

  const now = new Date().toISOString()
  const externalPayload: Database['public']['Tables']['coach_external_profiles']['Insert'] = {
    coach_id: coachId,
    api_coach_id: String(coach.id),
    api_team_id: apiTeamId,
    current_team_id: apiTeamId,
    full_name: name,
    first_name: nonEmptyString(coach.firstname ?? null),
    last_name: nonEmptyString(coach.lastname ?? null),
    nationality,
    birth_date: isoDate(coach.birth?.date),
    birth_place: birthPlace,
    birth_country: birthCountry,
    height: nonEmptyString(coach.height ?? null),
    weight: nonEmptyString(coach.weight ?? null),
    photo_url: nonEmptyString(coach.photo ?? null),
    current_team_name: clubName,
    profile_payload: JSON.parse(JSON.stringify(coach)) as Json,
    source_name: 'API-Football',
    source_link: 'https://www.api-football.com/documentation-v3#tag/Coachs/operation/get-coachs',
    confidence: 82,
    match_strategy: matchStrategy,
    match_confidence: matchConfidence,
    synced_at: now,
    updated_at: now,
  }

  const { data: existingExternal } = await supabase.from('coach_external_profiles').select('id').eq('coach_id', coachId).maybeSingle()
  const externalError = existingExternal?.id
    ? (await supabase.from('coach_external_profiles').update(externalPayload).eq('id', existingExternal.id)).error
    : (await supabase.from('coach_external_profiles').insert(externalPayload)).error
  if (externalError) return { created: false, updated: false, matched: !!existing, skippedHistorical: false, error: externalError.message }

  await supabase.from('coach_stints').delete().eq('coach_id', coachId).eq('source_type', 'api-football')
  const stintRows = (coach.career ?? [])
    .filter((stint) => stint.team?.id || stint.team?.name)
    .map((stint) => ({
      coach_id: coachId,
      club_id: String(stint.team?.id ?? '') === apiTeamId ? clubId : null,
      club_name: nonEmptyString(stint.team?.name ?? null) ?? clubName,
      country: String(stint.team?.id ?? '') === apiTeamId ? 'England' : null,
      league: String(stint.team?.id ?? '') === apiTeamId ? clubLeague : null,
      role_title: 'Head Coach',
      started_on: isoDate(stint.start),
      ended_on: isoDate(stint.end),
      appointment_context: 'Imported from API-Football',
      source_type: 'api-football',
      source_name: 'API-Football',
      source_notes: 'Career entry imported from coach profile endpoint',
      confidence: 78,
      verified: false,
    }))
  if (stintRows.length > 0) await supabase.from('coach_stints').insert(stintRows)

  return { created: !existing, updated: !!existing, matched: !!existing, skippedHistorical: false }
}


export async function POST(
  _req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  if (!getApiFootballKey()) return NextResponse.json({ error: 'API_FOOTBALL_KEY not configured' }, { status: 500 })

  const { clubId } = params
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: club } = await supabase
    .from('clubs')
    .select('id, name, league, external_id, external_source, squad_synced_at, coaches_synced_at')
    .eq('id', clubId)
    .eq('user_id', user.id)
    .single()

  if (!club?.external_id || club.external_source !== 'api-football') {
    return NextResponse.json({ error: 'Club has no API-Football ID' }, { status: 400 })
  }

  const apiId = club.external_id
  const now = new Date().toISOString()
  const result: Record<string, unknown> = {}

  // ── Squad ──────────────────────────────────────────────────────────────────
  const squadData = await fetchApiFootball<Array<{ players?: Array<{ id: number; name: string; age: number; number: number; position: string; photo: string }> }>>(`/players/squads?team=${apiId}`)
  if (!squadData.ok) return NextResponse.json({ error: squadData.error }, { status: 502 })
  const players = squadData.data.response?.[0]?.players ?? []

  if (players.length > 0) {
    // Delete existing squad for this club and re-insert
    await supabase.from('club_squad').delete().eq('club_id', clubId).eq('user_id', user.id)
    const rows = players.map((p: { id: number; name: string; age: number; number: number; position: string; photo: string }) => ({
      user_id: user.id,
      club_id: clubId,
      player_id: p.id,
      name: p.name,
      age: p.age ?? null,
      number: p.number ?? null,
      position: p.position ?? null,
      photo_url: p.photo ?? null,
      season: '2024',
      synced_at: now,
    }))
    await supabase.from('club_squad').insert(rows)
    await supabase.from('clubs').update({ squad_synced_at: now }).eq('id', clubId)
    result.squad = players.length
  }

  // ── Coaching staff / history ───────────────────────────────────────────────
  const coachData = await fetchApiFootball<APICoach[]>(`/coachs?team=${apiId}`)
  if (!coachData.ok) return NextResponse.json({ error: coachData.error }, { status: 502 })
  const coaches = coachData.data.response ?? []

  // Delete existing api-football coaching entries and re-insert fresh (avoids duplicates)
  await supabase
    .from('club_coaching_history')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', user.id)
    .eq('data_source', 'api-football')

  let coachesAdded = 0
  let coachProfilesCreated = 0
  let coachProfilesUpdated = 0
  let coachProfilesMatched = 0
  let skippedHistoricalCoaches = 0
  const coachProfileErrors: string[] = []
  const coachProfileNotes: string[] = []
  for (const coach of coaches) {
    // Find the career entry for this club
    const stint = (coach.career ?? []).find((c) => String(c.team?.id) === String(apiId))
    if (!stint) continue

    const startDate = stint.start ? stint.start.split('T')[0] : null
    const endDate = stint.end ? stint.end.split('T')[0] : null

    await supabase.from('club_coaching_history').insert({
      user_id: user.id,
      club_id: clubId,
      coach_name: coach.name,
      start_date: startDate,
      end_date: endDate,
      style_tags: [],
      data_source: 'api-football',
    })
    coachesAdded++

    const enrichment = await enrichClubCoachProfile({
      supabase,
      userId: user.id,
      clubId,
      clubName: club.name,
      clubLeague: club.league ?? null,
      apiTeamId: String(apiId),
      coach,
    })
    if (enrichment.error) coachProfileErrors.push(`${coach.name}: ${enrichment.error}`)
    if (enrichment.note) coachProfileNotes.push(enrichment.note)
    if (enrichment.created) coachProfilesCreated++
    if (enrichment.updated) coachProfilesUpdated++
    if (enrichment.matched) coachProfilesMatched++
    if (enrichment.skippedHistorical) skippedHistoricalCoaches++
  }

  await supabase.from('clubs').update({ coaches_synced_at: now }).eq('id', clubId)
  result.coaches = coachesAdded
  result.coach_profiles_matched = coachProfilesMatched
  result.coach_profiles_created = coachProfilesCreated
  result.coach_profiles_updated = coachProfilesUpdated
  result.skipped_historical_coaches = skippedHistoricalCoaches
  if (coachProfileErrors.length > 0) result.coach_profile_errors = coachProfileErrors.slice(0, 5)
  if (coachProfileNotes.length > 0) result.coach_profile_notes = coachProfileNotes.slice(0, 5)

  // ── Transfers (recent season) ─────────────────────────────────────────────
  const transferData = await fetchApiFootball<Array<{ player?: { name?: string; id?: number }; transfers?: Array<{ date?: string; teams?: { in?: { id?: number; name?: string }; out?: { id?: number; name?: string } }; type?: string; fees?: { amount?: string | number | null; currency?: string | null } }> }>>(`/transfers?team=${apiId}`)
  if (!transferData.ok) return NextResponse.json({ error: transferData.error }, { status: 502 })
  const transferPlayers = transferData.data.response ?? []

  // Only keep 2023 and 2024 season transfers
  let transfersAdded = 0
  const recentTransfers: Array<{
    player_name: string; player_id: number | null; direction: string;
    other_club: string | null; transfer_type: string | null; fee_amount: number | null;
    fee_currency: string | null; transfer_date: string | null; season: string;
  }> = []

  for (const p of transferPlayers) {
    for (const t of (p.transfers ?? [])) {
      const season = t.date ? t.date.slice(0, 4) : null
      if (!season || parseInt(season) < 2022) continue

      const isIn = String(t.teams?.in?.id) === String(apiId)
      const isOut = String(t.teams?.out?.id) === String(apiId)
      if (!isIn && !isOut) continue

      recentTransfers.push({
        player_name: p.player?.name ?? 'Unknown',
        player_id: p.player?.id ?? null,
        direction: isIn ? 'in' : 'out',
        other_club: isIn ? (t.teams?.out?.name ?? null) : (t.teams?.in?.name ?? null),
        transfer_type: t.type ?? null,
        fee_amount: t.fees?.amount != null ? Number(t.fees.amount) : null,
        fee_currency: t.fees?.currency ?? null,
        transfer_date: t.date ?? null,
        season: season,
      })
    }
  }

  // Delete and re-insert recent transfers for this club
  if (recentTransfers.length > 0) {
    await supabase.from('club_transfers').delete().eq('club_id', clubId).eq('user_id', user.id)
    const rows = recentTransfers.map(t => ({
      user_id: user.id,
      club_id: clubId,
      ...t,
    }))
    // Insert in chunks
    for (let i = 0; i < rows.length; i += 50) {
      await supabase.from('club_transfers').insert(rows.slice(i, i + 50))
    }
    await supabase.from('clubs').update({ transfers_synced_at: now }).eq('id', clubId)
    transfersAdded = recentTransfers.length
  }

  result.transfers = transfersAdded

  await supabase.from('integration_sync_state').upsert({
    user_id: user.id,
    sync_key: `club-${clubId}-api-football`,
    status: 'completed',
    cursor: 1,
    total: 1,
    result: result as Json,
    error: coachProfileErrors.length > 0 ? coachProfileErrors.slice(0, 5).join(' | ') : null,
    started_at: now,
    updated_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  }, { onConflict: 'user_id,sync_key' })

  return NextResponse.json({ ok: true, ...result })
}
