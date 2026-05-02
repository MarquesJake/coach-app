import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/types/db'
import { fetchApiFootball, getApiFootballKey, isApiFootballRateLimit } from '@/lib/integrations/api-football'

export const dynamic = 'force-dynamic'
const SYNC_KEY = 'coaches-english-api-football'
const MAX_TEAMS_PER_RUN = 10

const LEAGUES = [
  { id: 39, label: 'Premier League' },
  { id: 40, label: 'Championship' },
  { id: 41, label: 'League One' },
  { id: 42, label: 'League Two' },
]

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
  birth?: {
    date?: string | null
    place?: string | null
    country?: string | null
  } | null
  team?: { id?: number | null; name?: string | null }
  career?: Array<{
    team?: { id?: number | null; name?: string | null }
    start?: string | null
    end?: string | null
  }>
}

type APITeamResponse = {
  team: { id: number; name: string }
}

type ExistingCoach = Pick<
  Database['public']['Tables']['coaches']['Row'],
  | 'id'
  | 'name'
  | 'nationality'
  | 'league_experience'
  | 'club_current'
  | 'role_current'
  | 'age'
  | 'date_of_birth'
  | 'base_location'
  | 'languages'
  | 'available_status'
  | 'availability_status'
  | 'market_status'
  | 'due_diligence_summary'
>

type ExternalProfileLookup = {
  coach_id: string
  api_coach_id: string | null
  current_team_name: string | null
  api_team_id?: string | null
}

type CoachMatch = {
  coach: ExistingCoach
  strategy: 'api_coach_id' | 'name_current_team' | 'name_nationality'
  confidence: number
}

function normaliseKey(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  return false
}

function setIfEmpty<K extends keyof Database['public']['Tables']['coaches']['Update']>(
  payload: Database['public']['Tables']['coaches']['Update'],
  coach: ExistingCoach,
  key: K,
  value: Database['public']['Tables']['coaches']['Update'][K]
) {
  if (value === null || value === undefined) return
  if (isEmptyValue(coach[key as keyof ExistingCoach])) payload[key] = value
}

function matchCoach(params: {
  apiCoachId: string
  name: string
  currentClub: string | null
  nationality: string | null
  coachesById: Map<string, ExistingCoach>
  externalByApiId: Map<string, ExternalProfileLookup>
  byNameCurrentClub: Map<string, ExistingCoach>
  byNameNationality: Map<string, ExistingCoach>
}): CoachMatch | null {
  const external = params.externalByApiId.get(params.apiCoachId)
  if (external) {
    const coach = params.coachesById.get(external.coach_id)
    if (coach) return { coach, strategy: 'api_coach_id', confidence: 98 }
  }

  const nameKey = normaliseKey(params.name)
  const clubKey = normaliseKey(params.currentClub)
  if (nameKey && clubKey) {
    const coach = params.byNameCurrentClub.get(`${nameKey}|${clubKey}`)
    if (coach) return { coach, strategy: 'name_current_team', confidence: 88 }
  }

  const nationalityKey = normaliseKey(params.nationality)
  if (nameKey && nationalityKey) {
    const coach = params.byNameNationality.get(`${nameKey}|${nationalityKey}`)
    if (coach) return { coach, strategy: 'name_nationality', confidence: 76 }
  }

  return null
}


function getCurrentFootballSeasonStartYear(): number {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1
  return month >= 7 ? year : year - 1
}

function getSeasonCandidates(): number[] {
  const current = getCurrentFootballSeasonStartYear()
  const preferred = [current, current - 1, 2024, 2023, 2022]
  return Array.from(new Set(preferred)).filter((y) => y >= 2022)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry<T>(url: string, attempts = 3) {
  let waitMs = 700
  for (let i = 0; i < attempts; i++) {
    const res = await fetchApiFootball<T>(url)
    if (res.ok) return { ...res, rateLimited: false as const }
    const isRateLimit = isApiFootballRateLimit(res.error)
    if (!isRateLimit || i === attempts - 1) {
      return { ...res, rateLimited: isRateLimit as boolean }
    }
    await sleep(waitMs)
    waitMs *= 2
  }
  return { ok: false as const, error: 'Unknown retry failure', rateLimited: false as const }
}

function isWithinLastTwoYears(start?: string | null, end?: string | null): boolean {
  const cutoff = new Date()
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 2)
  const startDate = start ? new Date(start) : null
  const endDate = end ? new Date(end) : null
  if (endDate) return endDate >= cutoff
  if (startDate) return startDate >= cutoff
  return true
}

function firstValue<T>(...values: Array<T | null | undefined>): T | null {
  for (const v of values) {
    if (v !== null && v !== undefined) return v
  }
  return null
}

function nonEmptyString(value: string | null | undefined): string | null {
  if (!value) return null
  const t = value.trim()
  return t.length > 0 ? t : null
}

function isoDate(value: string | null | undefined): string | null {
  if (!value) return null
  return value.slice(0, 10)
}

type CoachStintInsert = Database['public']['Tables']['coach_stints']['Insert']

function isMissingTableError(message: string | undefined): boolean {
  if (!message) return false
  const m = message.toLowerCase()
  return m.includes('could not find the table') || m.includes('relation') && m.includes('does not exist')
}

function clampScore(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

async function insertCoachStintsResilient(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  rows: CoachStintInsert[]
): Promise<{ ok: boolean; error?: string; inserted: number }> {
  if (rows.length === 0) return { ok: true, inserted: 0 }
  const firstTry = await supabase.from('coach_stints').insert(rows)
  if (!firstTry.error) return { ok: true, inserted: rows.length }
  const msg = firstTry.error.message.toLowerCase()
  const missingEnrichmentColumn =
    msg.includes('confidence') ||
    msg.includes('source_type') ||
    msg.includes('source_name') ||
    msg.includes('source_link') ||
    msg.includes('source_notes') ||
    msg.includes('verified')
  if (!missingEnrichmentColumn) return { ok: false, error: firstTry.error.message, inserted: 0 }

  const fallbackRows = rows.map((r) => ({
    coach_id: r.coach_id,
    club_name: r.club_name,
    club_id: r.club_id ?? null,
    country: r.country ?? null,
    league: r.league ?? null,
    role_title: r.role_title,
    started_on: r.started_on ?? null,
    ended_on: r.ended_on ?? null,
    appointment_context: r.appointment_context ?? null,
    exit_context: r.exit_context ?? null,
  }))
  const retry = await supabase.from('coach_stints').insert(fallbackRows)
  if (!retry.error) return { ok: true, inserted: fallbackRows.length }
  return { ok: false, error: retry.error.message, inserted: 0 }
}

async function readSyncRequestBody(request: Request): Promise<{ confirmReset?: unknown }> {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

export async function POST(request: Request) {
  if (!getApiFootballKey()) {
    return NextResponse.json({ error: 'API_FOOTBALL_KEY not configured' }, { status: 500 })
  }

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(request.url)
  const body = await readSyncRequestBody(request)
  const resetRequestedByQuery = url.searchParams.get('reset') === '1'
  if (resetRequestedByQuery && body.confirmReset !== true) {
    return NextResponse.json({ error: 'Reset requires confirmReset true in the POST body' }, { status: 400 })
  }
  const reset = body.confirmReset === true

  const { data: existingCoaches } = await supabase
    .from('coaches')
    .select('id, name, nationality, league_experience, club_current, role_current, age, date_of_birth, base_location, languages, available_status, availability_status, market_status, due_diligence_summary')
    .eq('user_id', user.id)

  const coachesById = new Map<string, ExistingCoach>()
  const byNameNationality = new Map<string, ExistingCoach>()
  const byNameCurrentClub = new Map<string, ExistingCoach>()
  const externalByApiId = new Map<string, ExternalProfileLookup>()

  for (const c of (existingCoaches ?? []) as ExistingCoach[]) {
    coachesById.set(c.id, c)
    const nameKey = normaliseKey(c.name)
    const nationalityKey = normaliseKey(c.nationality)
    const clubKey = normaliseKey(c.club_current)
    if (nameKey && nationalityKey) byNameNationality.set(`${nameKey}|${nationalityKey}`, c)
    if (nameKey && clubKey) byNameCurrentClub.set(`${nameKey}|${clubKey}`, c)
  }

  const coachIds = Array.from(coachesById.keys())
  const { data: existingExternalProfiles } = coachIds.length > 0
    ? await supabase
        .from('coach_external_profiles')
        .select('coach_id, api_coach_id, current_team_name, api_team_id')
        .in('coach_id', coachIds)
    : { data: [] }

  for (const profile of (existingExternalProfiles ?? []) as ExternalProfileLookup[]) {
    if (profile.api_coach_id) externalByApiId.set(String(profile.api_coach_id), profile)
    const coach = coachesById.get(profile.coach_id)
    const nameKey = normaliseKey(coach?.name)
    const teamKey = normaliseKey(profile.current_team_name)
    if (coach && nameKey && teamKey) byNameCurrentClub.set(`${nameKey}|${teamKey}`, coach)
  }

  const seasonCandidates = getSeasonCandidates()
  const errors: string[] = []
  const log: string[] = []
  let added = 0
  let updated = 0
  let stintsInserted = 0
  let externalProfilesUpdated = 0
  let dataProfilesUpdated = 0
  let mediaEventsInserted = 0
  let recruitmentRowsInserted = 0
  let matchedCoaches = 0
  let createdCurrentCoaches = 0
  let skippedHistoricalCoaches = 0

  const teamIdToLeague = new Map<number, string>()
  const teamIdToName = new Map<number, string>()
  const teamIds = new Set<number>()

  for (const league of LEAGUES) {
    let leagueSeasonUsed: number | null = null
    let teams: APITeamResponse[] = []
    let lastLeagueError: string | null = null

    for (const season of seasonCandidates) {
      const res = await fetchApiFootball<APITeamResponse[]>(`/teams?league=${league.id}&season=${season}`)
      if (!res.ok) {
        lastLeagueError = `${league.label}: ${res.error} for ${season}`
        continue
      }
      teams = (res.data.response ?? []) as APITeamResponse[]
      leagueSeasonUsed = season
      break
    }

    if (!leagueSeasonUsed) {
      errors.push(lastLeagueError ?? `${league.label}: no accessible season found`)
      continue
    }

    for (const item of teams) {
      const teamId = item.team.id
      if (!teamId) continue
      teamIds.add(teamId)
      teamIdToLeague.set(teamId, league.label)
      teamIdToName.set(teamId, item.team.name)
    }

    log.push(`${league.label} (${leagueSeasonUsed}/${String(leagueSeasonUsed + 1).slice(-2)}): ${teams.length} teams`)
  }

  const sortedTeamIds = Array.from(teamIds).sort((a, b) => a - b)
  const nowIso = new Date().toISOString()
  const stateSelect = await supabase
    .from('integration_sync_state')
    .select('id, status, cursor, total, updated_at')
    .eq('user_id', user.id)
    .eq('sync_key', SYNC_KEY)
    .maybeSingle()

  let state = stateSelect.data as { id: string; status: string; cursor: number; total: number; updated_at: string } | null
  if (!state?.id) {
    const created = await supabase
      .from('integration_sync_state')
      .insert({
        user_id: user.id,
        sync_key: SYNC_KEY,
        status: 'running',
        cursor: 0,
        total: sortedTeamIds.length,
        started_at: nowIso,
        updated_at: nowIso,
      })
      .select('id, status, cursor, total, updated_at')
      .single()
    state = (created.data ?? null) as { id: string; status: string; cursor: number; total: number; updated_at: string } | null
  } else {
    const updatedAt = new Date(state.updated_at).getTime()
    const freshRunning = state.status === 'running' && Date.now() - updatedAt < 30_000
    if (freshRunning) {
      return NextResponse.json({
        ok: false,
        error: 'Coach sync already running',
        status: state.status,
        progress: { cursor: state.cursor, total: Math.max(state.total, sortedTeamIds.length) },
      }, { status: 409 })
    }
    const nextCursor = reset ? 0 : state.cursor
    await supabase
      .from('integration_sync_state')
      .update({
        status: 'running',
        cursor: nextCursor,
        total: sortedTeamIds.length,
        updated_at: nowIso,
        error: null,
        completed_at: reset ? null : undefined,
      })
      .eq('id', state.id)
      .eq('user_id', user.id)
    state = {
      ...state,
      cursor: nextCursor,
      status: 'running',
    }
  }

  // Gather coaches by team, then filter to those with English stints in last 2 years.
  const coachMap = new Map<string, { coach: APICoach; leagues: Set<string>; currentClub: string | null; isCurrentForSyncedClub: boolean }>()
  const teamErrors: string[] = []
  const startCursor = Math.max(0, Math.min((state?.cursor ?? 0), sortedTeamIds.length))
  const endExclusive = Math.min(startCursor + MAX_TEAMS_PER_RUN, sortedTeamIds.length)
  const teamIdList = sortedTeamIds.slice(startCursor, endExclusive)
  const BATCH_SIZE = 2
  const BATCH_DELAY_MS = 1100
  let rateLimitedCount = 0
  let stoppedEarlyOnRateLimit = false
  let processedTeams = 0

  for (let batchStart = 0; batchStart < teamIdList.length; batchStart += BATCH_SIZE) {
    const batch = teamIdList.slice(batchStart, batchStart + BATCH_SIZE)
    for (const teamId of batch) {
      processedTeams++
      const res = await fetchWithRetry<APICoach[]>(`/coachs?team=${teamId}`)
      if (res.rateLimited) {
        rateLimitedCount++
      }
      if (!res.ok) {
        teamErrors.push(`${teamIdToName.get(teamId) ?? `team ${teamId}`}: ${res.error}`)
        if (res.rateLimited && rateLimitedCount >= 3) {
          stoppedEarlyOnRateLimit = true
          break
        }
        continue
      }

      const coaches = (res.data.response ?? []) as APICoach[]
      for (const coach of coaches) {
        const name = (coach.name ?? '').trim()
        if (!name) continue
        const nationality = (coach.nationality ?? '').trim()
        const key = `${coach.id}|${name.toLowerCase()}|${nationality.toLowerCase()}`

        const relevantCareer = (coach.career ?? []).filter((stint) => {
          const stintTeamId = stint.team?.id ?? null
          return !!stintTeamId && teamIds.has(stintTeamId) && isWithinLastTwoYears(stint.start, stint.end)
        })
        if (relevantCareer.length === 0) continue

        const leagues = new Set<string>()
        for (const stint of relevantCareer) {
          const league = stint.team?.id ? teamIdToLeague.get(stint.team.id) : null
          if (league) leagues.add(league)
        }
        if (leagues.size === 0) continue

        const activeStint = relevantCareer.find((s) => !s.end) ?? relevantCareer[0]
        const isCurrentForSyncedClub = relevantCareer.some((s) => !s.end && !!s.team?.id && teamIds.has(s.team.id))
        const currentClub = activeStint.team?.id
          ? (teamIdToName.get(activeStint.team.id) ?? activeStint.team?.name ?? null)
          : (activeStint.team?.name ?? null)

        const existing = coachMap.get(key)
        if (!existing) {
          coachMap.set(key, { coach, leagues, currentClub, isCurrentForSyncedClub })
        } else {
          leagues.forEach((l) => existing.leagues.add(l))
          if (!existing.currentClub && currentClub) existing.currentClub = currentClub
          existing.isCurrentForSyncedClub = existing.isCurrentForSyncedClub || isCurrentForSyncedClub
        }
      }
    }

    if (stoppedEarlyOnRateLimit) break
    if (batchStart + BATCH_SIZE < teamIdList.length) await sleep(BATCH_DELAY_MS)
  }
  errors.push(...teamErrors.slice(0, 15))
  if (teamErrors.length > 15) errors.push(`Additional team coach-fetch errors: ${teamErrors.length - 15}`)
  if (stoppedEarlyOnRateLimit) {
    errors.push('Stopped early due to repeated API rate-limits. Re-run sync in ~1 minute to continue.')
  }

  for (const value of Array.from(coachMap.values())) {
    const coach = value.coach
    const name = coach.name.trim()
    const nationality = (coach.nationality ?? null)?.trim() || null
    const leagueExperience: string[] = Array.from(value.leagues)
    const currentClub = value.currentClub ?? (coach.team?.name?.trim() || null)
    const currentTeamId = firstValue(
      coach.team?.id != null ? String(coach.team.id) : null,
      (coach.career ?? []).find((s) => !s.end)?.team?.id != null ? String((coach.career ?? []).find((s) => !s.end)?.team?.id) : null,
      (coach.career ?? [])[0]?.team?.id != null ? String((coach.career ?? [])[0]?.team?.id) : null
    )

    const birthDate = nonEmptyString(coach.birth?.date ?? null)
    const birthPlace = nonEmptyString(coach.birth?.place ?? null)
    const birthCountry = nonEmptyString(coach.birth?.country ?? null)
    const baseLocation = [birthPlace, birthCountry].filter(Boolean).join(', ') || null
    const primaryName = firstValue(nonEmptyString(coach.firstname ?? null), nonEmptyString(name.split(' ')[0] ?? null))
    const dueDiligenceBits = [nonEmptyString(coach.height ?? null), nonEmptyString(coach.weight ?? null)].filter(Boolean)
    const dueDiligenceSummary = dueDiligenceBits.length > 0 ? `API-Football profile: ${dueDiligenceBits.join(' | ')}` : null

    const match = matchCoach({
      apiCoachId: String(coach.id),
      name,
      currentClub,
      nationality,
      coachesById,
      externalByApiId,
      byNameCurrentClub,
      byNameNationality,
    })
    const existing = match?.coach ?? null

    let coachRowId: string | null = existing?.id ?? null
    const matchStrategy: CoachMatch['strategy'] | 'created' = match?.strategy ?? 'created'
    const matchConfidence = match?.confidence ?? 72

    if (existing) {
      matchedCoaches++
      const mergedLeagues = Array.from(new Set([...(existing.league_experience ?? []), ...leagueExperience]))
      const updatePayload: Database['public']['Tables']['coaches']['Update'] = {
        league_experience: mergedLeagues,
        last_updated: new Date().toISOString(),
      }
      setIfEmpty(updatePayload, existing, 'preferred_name', primaryName)
      setIfEmpty(updatePayload, existing, 'nationality', nationality)
      setIfEmpty(updatePayload, existing, 'age', coach.age ?? null)
      setIfEmpty(updatePayload, existing, 'date_of_birth', birthDate)
      setIfEmpty(updatePayload, existing, 'base_location', baseLocation)
      setIfEmpty(updatePayload, existing, 'languages', nationality ? [nationality] : [])
      setIfEmpty(updatePayload, existing, 'role_current', 'Head Coach')
      setIfEmpty(updatePayload, existing, 'club_current', currentClub)
      setIfEmpty(updatePayload, existing, 'available_status', currentClub ? 'Under contract' : 'Open to offers')
      setIfEmpty(updatePayload, existing, 'availability_status', currentClub ? 'Under contract' : 'Open to offers')
      setIfEmpty(updatePayload, existing, 'market_status', currentClub ? 'Not Available' : 'Open to offers')
      setIfEmpty(updatePayload, existing, 'due_diligence_summary', dueDiligenceSummary)

      const { error } = await supabase
        .from('coaches')
        .update(updatePayload)
        .eq('id', existing.id)
        .eq('user_id', user.id)
      if (error) errors.push(`update ${name}: ${error.message}`)
      else {
        updated++
        coachRowId = existing.id
      }
    } else if (!value.isCurrentForSyncedClub) {
      skippedHistoricalCoaches++
      log.push(`${name}: skipped historical API-Football coach without an existing coach match`)
    } else {
      const insertPayload: Database['public']['Tables']['coaches']['Insert'] = {
        name,
        preferred_name: primaryName,
        nationality,
        age: coach.age ?? null,
        date_of_birth: birthDate,
        base_location: baseLocation,
        languages: nationality ? [nationality] : [],
        role_current: 'Head Coach',
        club_current: currentClub,
        available_status: currentClub ? 'Under contract' : 'Open to offers',
        availability_status: currentClub ? 'Under contract' : 'Open to offers',
        market_status: currentClub ? 'Not Available' : 'Open to offers',
        league_experience: leagueExperience,
        last_updated: new Date().toISOString(),
        due_diligence_summary: dueDiligenceSummary,
        preferred_style: 'Mixed',
        pressing_intensity: 'Medium',
        build_preference: 'Mixed',
        leadership_style: 'Collaborative',
        wage_expectation: 'TBC',
        staff_cost_estimate: 'TBC',
        reputation_tier: 'Established',
        user_id: user.id,
      }
      const { data: inserted, error } = await supabase
        .from('coaches')
        .insert(insertPayload)
        .select('id')
        .single()
      if (error) errors.push(`insert ${name}: ${error.message}`)
      else {
        added++
        createdCurrentCoaches++
        coachRowId = inserted?.id ?? null
      }
    }

    // Keep API stints in sync for career tab while preserving manual stints.
    if (coachRowId) {
      const now = new Date().toISOString()
      const fullName = name
      const firstName = nonEmptyString(coach.firstname ?? null)
      const lastName = nonEmptyString(coach.lastname ?? null)
      const sourceLink = coach.id ? `https://www.api-football.com/documentation-v3#tag/Coachs/operation/get-coachs` : null
      const profilePayload = JSON.parse(JSON.stringify(coach)) as Json

      const existingExternal = await supabase
        .from('coach_external_profiles')
        .select('id')
        .eq('coach_id', coachRowId)
        .maybeSingle()
      if (existingExternal.data?.id) {
        const { error: externalUpdateErr } = await supabase
          .from('coach_external_profiles')
          .update({
            api_coach_id: String(coach.id),
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            nationality,
            birth_date: isoDate(coach.birth?.date),
            birth_place: nonEmptyString(coach.birth?.place ?? null),
            birth_country: nonEmptyString(coach.birth?.country ?? null),
            height: nonEmptyString(coach.height ?? null),
            weight: nonEmptyString(coach.weight ?? null),
            photo_url: nonEmptyString(coach.photo ?? null),
            current_team_name: currentClub,
            api_team_id: currentTeamId,
            current_team_id: currentTeamId,
            match_strategy: matchStrategy,
            match_confidence: matchConfidence,
            profile_payload: profilePayload,
            source_name: 'API-Football',
            source_link: sourceLink,
            confidence: 82,
            synced_at: now,
            updated_at: now,
          })
          .eq('id', existingExternal.data.id)
        if (externalUpdateErr) {
          if (!isMissingTableError(externalUpdateErr.message)) {
            errors.push(`external profile ${name}: ${externalUpdateErr.message}`)
          }
        }
        else externalProfilesUpdated++
      } else {
        const { error: externalInsertErr } = await supabase
          .from('coach_external_profiles')
          .insert({
            coach_id: coachRowId,
            api_coach_id: String(coach.id),
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            nationality,
            birth_date: isoDate(coach.birth?.date),
            birth_place: nonEmptyString(coach.birth?.place ?? null),
            birth_country: nonEmptyString(coach.birth?.country ?? null),
            height: nonEmptyString(coach.height ?? null),
            weight: nonEmptyString(coach.weight ?? null),
            photo_url: nonEmptyString(coach.photo ?? null),
            current_team_name: currentClub,
            api_team_id: currentTeamId,
            current_team_id: currentTeamId,
            match_strategy: matchStrategy,
            match_confidence: matchConfidence,
            profile_payload: profilePayload,
            source_name: 'API-Football',
            source_link: sourceLink,
            confidence: 82,
            synced_at: now,
            updated_at: now,
          })
        if (externalInsertErr) {
          if (!isMissingTableError(externalInsertErr.message)) {
            errors.push(`external profile ${name}: ${externalInsertErr.message}`)
          }
        }
        else externalProfilesUpdated++
      }

      await supabase
        .from('coach_stints')
        .delete()
        .eq('coach_id', coachRowId)
        .eq('source_type', 'api-football')

      const stints = (coach.career ?? [])
        .filter((s) => s?.team?.id || s?.team?.name)
        .map((s, idx) => {
          const teamId = s.team?.id ?? null
          const teamName = nonEmptyString(s.team?.name ?? null) ?? 'Unknown Club'
          const league = teamId ? (teamIdToLeague.get(teamId) ?? null) : null
          const country = teamId && teamIds.has(teamId) ? 'England' : null
          return {
            coach_id: coachRowId,
            club_name: teamName,
            club_id: null,
            country,
            league,
            role_title: 'Head Coach',
            started_on: s.start ? s.start.slice(0, 10) : null,
            ended_on: s.end ? s.end.slice(0, 10) : null,
            appointment_context: idx === 0 ? 'Imported from API-Football' : null,
            exit_context: null,
            source_type: 'api-football',
            source_name: 'API-Football',
            source_link: null,
            source_notes: 'Career entry imported from coach profile endpoint',
            confidence: 78,
            verified: false,
          }
        })

      if (stints.length > 0) {
        const insertedResult = await insertCoachStintsResilient(supabase, stints)
        if (!insertedResult.ok) errors.push(`stints ${name}: ${insertedResult.error}`)
        else stintsInserted += insertedResult.inserted
      }

      const completedStints = (coach.career ?? []).filter((s) => !!s.end).length
      const activeStints = (coach.career ?? []).filter((s) => !s.end).length
      const clubNameCounts = new Map<string, number>()
      for (const s of coach.career ?? []) {
        const teamName = nonEmptyString(s.team?.name ?? null)
        if (!teamName) continue
        clubNameCounts.set(teamName, (clubNameCounts.get(teamName) ?? 0) + 1)
      }
      const repeatClubCount = Array.from(clubNameCounts.values()).filter((count) => count > 1).length
      const roleCount = (coach.career ?? []).length
      const volatility = roleCount > 0 ? completedStints / roleCount : 0
      const mediaPressureScore = clampScore(30 + volatility * 60 + repeatClubCount * 5)
      const mediaAccountabilityScore = clampScore(45 + Math.min(roleCount, 8) * 4)
      const mediaConfrontationScore = clampScore(25 + volatility * 45)
      const confidenceScore = clampScore(40 + Math.min(roleCount, 10) * 4)

      const derivedProfile = {
        avg_squad_age: null,
        avg_starting_xi_age: null,
        minutes_u21: null,
        minutes_21_24: null,
        minutes_25_28: null,
        minutes_29_plus: null,
        recruitment_avg_age: null,
        recruitment_repeat_player_count: 0,
        recruitment_repeat_agent_count: repeatClubCount,
        media_pressure_score: mediaPressureScore,
        media_accountability_score: mediaAccountabilityScore,
        media_confrontation_score: mediaConfrontationScore,
        social_presence_level: 'Medium',
        narrative_risk_summary: `Auto-generated from API-Football profile and ${stints.length} career entries. Active roles: ${activeStints}. Repeat clubs: ${repeatClubCount}.`,
        confidence_score: confidenceScore,
      }
      const existingDataProfile = await supabase
        .from('coach_data_profiles')
        .select('id')
        .eq('coach_id', coachRowId)
        .maybeSingle()
      if (existingDataProfile.error && isMissingTableError(existingDataProfile.error.message)) {
        // Optional enrichment table may not exist in older environments; skip without failing sync.
      } else if (existingDataProfile.data?.id) {
        const { error: profileUpdateErr } = await supabase
          .from('coach_data_profiles')
          .update(derivedProfile)
          .eq('id', existingDataProfile.data.id)
        if (profileUpdateErr) {
          if (!isMissingTableError(profileUpdateErr.message)) {
            errors.push(`data profile ${name}: ${profileUpdateErr.message}`)
          }
        }
        else dataProfilesUpdated++
      } else {
        const { error: profileInsertErr } = await supabase
          .from('coach_data_profiles')
          .insert({
            coach_id: coachRowId,
            ...derivedProfile,
          })
        if (profileInsertErr) {
          if (!isMissingTableError(profileInsertErr.message)) {
            errors.push(`data profile ${name}: ${profileInsertErr.message}`)
          }
        }
        else dataProfilesUpdated++
      }

      // Populate media events from career transitions (real events from API career dates).
      const deleteMediaRes = await supabase
        .from('coach_media_events')
        .delete()
        .eq('coach_id', coachRowId)
        .eq('source_type', 'api-football')
      if (deleteMediaRes.error && !isMissingTableError(deleteMediaRes.error.message)) {
        errors.push(`media cleanup ${name}: ${deleteMediaRes.error.message}`)
      } else {
        const mediaRows = (coach.career ?? [])
          .filter((s) => s?.team?.name && (s.start || s.end))
          .flatMap((s) => {
            const teamName = nonEmptyString(s.team?.name ?? null) ?? 'Unknown club'
            const rows: Array<Database['public']['Tables']['coach_media_events']['Insert']> = []
            if (s.start) {
              rows.push({
                coach_id: coachRowId,
                category: 'Appointment',
                headline: `${name} appointed at ${teamName}`,
                summary: `Career timeline indicates appointment at ${teamName}.`,
                severity_score: 35,
                occurred_at: isoDate(s.start),
                source: 'API-Football',
                confidence: 78,
                source_type: 'api-football',
                source_name: 'API-Football',
                source_link: null,
                source_notes: 'Generated from coach career.start',
                verified: false,
              })
            }
            if (s.end) {
              rows.push({
                coach_id: coachRowId,
                category: 'Departure',
                headline: `${name} departed ${teamName}`,
                summary: `Career timeline indicates departure from ${teamName}.`,
                severity_score: 48,
                occurred_at: isoDate(s.end),
                source: 'API-Football',
                confidence: 74,
                source_type: 'api-football',
                source_name: 'API-Football',
                source_link: null,
                source_notes: 'Generated from coach career.end',
                verified: false,
              })
            }
            return rows
          })
        if (mediaRows.length > 0) {
          const mediaInsertRes = await supabase.from('coach_media_events').insert(mediaRows)
          if (mediaInsertRes.error) {
            if (!isMissingTableError(mediaInsertRes.error.message)) {
              errors.push(`media events ${name}: ${mediaInsertRes.error.message}`)
            }
          } else {
            mediaEventsInserted += mediaRows.length
          }
        }
      }

      // Populate recruitment history from already-synced club transfers where available.
      const deleteRecruitmentRes = await supabase
        .from('coach_recruitment_history')
        .delete()
        .eq('coach_id', coachRowId)
        .eq('source_type', 'api-football')
      if (deleteRecruitmentRes.error && !isMissingTableError(deleteRecruitmentRes.error.message)) {
        errors.push(`recruitment cleanup ${name}: ${deleteRecruitmentRes.error.message}`)
      } else {
        const coachedClubNames = Array.from(
          new Set(
            (coach.career ?? [])
              .map((s) => nonEmptyString(s.team?.name ?? null))
              .filter(Boolean)
          )
        ) as string[]
        if (coachedClubNames.length > 0) {
          const transfersRes = await supabase
            .from('club_transfers')
            .select('player_name, club_id, direction, transfer_date, transfer_type, age_at_transfer, fee_band, other_club')
            .eq('user_id', user.id)
            .in('other_club', coachedClubNames)
            .order('transfer_date', { ascending: false })
            .limit(40)
          if (transfersRes.error) {
            if (!isMissingTableError(transfersRes.error.message)) {
              errors.push(`recruitment source ${name}: ${transfersRes.error.message}`)
            }
          } else {
            const recruitmentRows = (transfersRes.data ?? []).map((t) => ({
              coach_id: coachRowId,
              player_name: t.player_name ?? null,
              player_id: null,
              club_name: t.other_club ?? null,
              club_id: t.club_id ?? null,
              transfer_window: t.transfer_date ? `${new Date(t.transfer_date).getUTCFullYear()}` : null,
              transfer_fee_band: t.fee_band ?? t.transfer_type ?? null,
              player_age_at_signing: t.age_at_transfer ?? null,
              repeated_signing: false,
              agent_name: null,
              impact_summary: `Inferred from ${t.direction ?? 'transfer'} market activity while coaching ${t.other_club ?? 'club'}.`,
              source_type: 'api-football',
              source_name: 'API-Football',
              source_link: null,
              source_notes: 'Generated from club_transfers linkage',
              confidence: 62,
              verified: false,
            }))
            if (recruitmentRows.length > 0) {
              const insertRecruitmentRes = await supabase.from('coach_recruitment_history').insert(recruitmentRows)
              if (insertRecruitmentRes.error) {
                if (!isMissingTableError(insertRecruitmentRes.error.message)) {
                  errors.push(`recruitment ${name}: ${insertRecruitmentRes.error.message}`)
                }
              } else {
                recruitmentRowsInserted += recruitmentRows.length
              }
            }
          }
        }
      }
    }
  }

  const nextCursor = Math.min(startCursor + processedTeams, sortedTeamIds.length)
  const completed = nextCursor >= sortedTeamIds.length && !stoppedEarlyOnRateLimit
  const status = stoppedEarlyOnRateLimit
    ? 'rate_limited'
    : completed
      ? 'completed'
      : 'paused'

  await supabase
    .from('integration_sync_state')
    .update({
      status,
      cursor: nextCursor,
      total: sortedTeamIds.length,
      result: {
        added,
        updated,
        stints_inserted: stintsInserted,
        external_profiles_updated: externalProfilesUpdated,
        data_profiles_updated: dataProfilesUpdated,
        media_events_inserted: mediaEventsInserted,
        recruitment_rows_inserted: recruitmentRowsInserted,
        matched_coaches: matchedCoaches,
        created_current_coaches: createdCurrentCoaches,
        skipped_historical_coaches: skippedHistoricalCoaches,
        total_candidates: coachMap.size,
        processed_in_run: processedTeams,
        rate_limited_hits: rateLimitedCount,
      },
      error: errors.length > 0 ? errors.slice(0, 5).join(' | ') : null,
      updated_at: new Date().toISOString(),
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('user_id', user.id)
    .eq('sync_key', SYNC_KEY)

  return NextResponse.json({
    ok: true,
    partial: errors.length > 0,
    status,
    progress: {
      cursor: nextCursor,
      total: sortedTeamIds.length,
      remaining: Math.max(sortedTeamIds.length - nextCursor, 0),
      run_size: MAX_TEAMS_PER_RUN,
    },
    added,
    updated,
    stints_inserted: stintsInserted,
    external_profiles_updated: externalProfilesUpdated,
    data_profiles_updated: dataProfilesUpdated,
    media_events_inserted: mediaEventsInserted,
    recruitment_rows_inserted: recruitmentRowsInserted,
    matched_coaches: matchedCoaches,
    created_current_coaches: createdCurrentCoaches,
    skipped_historical_coaches: skippedHistoricalCoaches,
    total_candidates: coachMap.size,
    seasons_considered: seasonCandidates,
    teams_considered: teamIds.size,
    teams_processed: processedTeams,
    rate_limited_hits: rateLimitedCount,
    log,
    errors,
  })
}
