import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// ── Wikidata helpers ──────────────────────────────────────────────────────────

async function findWikidataId(clubName: string): Promise<string | null> {
  try {
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(clubName)}&language=en&type=item&format=json&limit=8`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CoachIntelligenceApp/1.0 (coaching-recruitment-platform)' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const results: Array<{ id: string; label: string; description?: string }> = data.search ?? []

    const nameLower = clubName.toLowerCase()
    for (const r of results) {
      const desc = (r.description ?? '').toLowerCase()
      const label = (r.label ?? '').toLowerCase()
      if (
        (desc.includes('football') || desc.includes('soccer') || desc.includes('association football')) &&
        (label === nameLower ||
          label.includes(nameLower) ||
          nameLower.includes(label) ||
          // handle common suffixes: "Arsenal" matches "Arsenal FC"
          label.replace(/\s+(f\.?c\.?|a\.?f\.?c\.?|s\.?c\.?|u\.?t\.?d\.?|united|city|town|athletic|rovers|wanderers|albion)$/i, '').trim() === nameLower.replace(/\s+(f\.?c\.?|a\.?f\.?c\.?|s\.?c\.?|u\.?t\.?d\.?|united|city|town|athletic|rovers|wanderers|albion)$/i, '').trim()
        )
      ) {
        return r.id
      }
    }
    return null
  } catch {
    return null
  }
}

function parseWikidataDate(raw: string | null): string | null {
  if (!raw) return null
  // Wikidata SPARQL dates: "+1990-05-01T00:00:00Z" or "1990-01-01T00:00:00Z"
  const cleaned = raw.replace(/^\+/, '')
  try {
    const d = new Date(cleaned)
    if (isNaN(d.getTime())) return null
    return cleaned.substring(0, 10) // YYYY-MM-DD
  } catch {
    return null
  }
}

type WikiCoach = {
  name: string
  wikidataId: string
  startDate: string | null
  endDate: string | null
  startDateApprox: boolean
  endDateApprox: boolean
}

async function fetchWikidataCoaches(wikidataId: string): Promise<WikiCoach[]> {
  // Query P286 (head coach) with P580 (start time) and P582 (end time) qualifiers
  // Also try P6 (head of government) which some clubs use historically
  const sparql = `
SELECT DISTINCT ?coach ?coachLabel ?startTime ?endTime WHERE {
  {
    wd:${wikidataId} p:P286 ?stmt .
    ?stmt ps:P286 ?coach .
    OPTIONAL { ?stmt pq:P580 ?startTime . }
    OPTIONAL { ?stmt pq:P582 ?endTime . }
  } UNION {
    wd:${wikidataId} p:P6 ?stmt .
    ?stmt ps:P6 ?coach .
    OPTIONAL { ?stmt pq:P580 ?startTime . }
    OPTIONAL { ?stmt pq:P582 ?endTime . }
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
ORDER BY ASC(?startTime)
  `.trim()

  try {
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`
    const res = await fetch(url, {
      headers: {
        Accept: 'application/sparql-results+json',
        'User-Agent': 'CoachIntelligenceApp/1.0 (coaching-recruitment-platform)',
      },
    })
    if (!res.ok) return []
    const data = await res.json()
    const bindings: Array<Record<string, { value: string }>> = data.results?.bindings ?? []

    const seen = new Set<string>()
    const results: WikiCoach[] = []

    for (const b of bindings) {
      const coachUri = b.coach?.value ?? ''
      const coachWdId = coachUri.split('/entity/')[1] ?? ''
      if (!coachWdId || seen.has(coachWdId)) continue
      seen.add(coachWdId)

      const startRaw = b.startTime?.value ?? null
      const endRaw = b.endTime?.value ?? null

      results.push({
        name: b.coachLabel?.value ?? 'Unknown',
        wikidataId: coachWdId,
        startDate: parseWikidataDate(startRaw),
        endDate: parseWikidataDate(endRaw),
        // If time is midnight, date is approximate (year or year-month only)
        startDateApprox: startRaw ? startRaw.endsWith('T00:00:00Z') : false,
        endDateApprox: endRaw ? endRaw.endsWith('T00:00:00Z') : false,
      })
    }

    return results
  } catch {
    return []
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(
  _req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const { clubId } = params
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .select('id, name, wikidata_id, user_id')
    .eq('id', clubId)
    .eq('user_id', user.id)
    .single()

  if (clubError || !club) return NextResponse.json({ error: 'Club not found' }, { status: 404 })

  let wikidataId = club.wikidata_id as string | null

  // Auto-find Wikidata entity if not already linked
  if (!wikidataId) {
    wikidataId = await findWikidataId(club.name)
    if (wikidataId) {
      await supabase.from('clubs').update({ wikidata_id: wikidataId }).eq('id', clubId)
    }
  }

  if (!wikidataId) {
    return NextResponse.json(
      { error: 'Could not find a Wikidata entity for this club. Set wikidata_id manually to enable historical coaching sync.' },
      { status: 404 }
    )
  }

  // Fetch coaching history from Wikidata
  const coaches = await fetchWikidataCoaches(wikidataId)

  // Load existing coaching rows for this club (wikidata-sourced only, for dedup)
  const { data: existingRows } = await supabase
    .from('club_coaching_history')
    .select('id, wikidata_id, data_source')
    .eq('club_id', clubId)
    .eq('user_id', user.id)
    .not('wikidata_id', 'is', null)

  const existingByWdId = new Map(
    (existingRows ?? []).map((r) => [r.wikidata_id as string, r])
  )

  let coaches_added = 0
  let coaches_updated = 0
  let coaches_skipped = 0

  for (const coach of coaches) {
    const existing = existingByWdId.get(coach.wikidataId)
    if (!existing) {
      await supabase.from('club_coaching_history').insert({
        user_id: user.id,
        club_id: clubId,
        coach_name: coach.name,
        start_date: coach.startDate,
        end_date: coach.endDate,
        start_date_approx: coach.startDateApprox,
        end_date_approx: coach.endDateApprox,
        style_tags: [],
        data_source: 'wikidata',
        wikidata_id: coach.wikidataId,
      })
      coaches_added++
    } else if (existing.data_source === 'wikidata') {
      await supabase
        .from('club_coaching_history')
        .update({
          start_date: coach.startDate,
          end_date: coach.endDate,
          start_date_approx: coach.startDateApprox,
          end_date_approx: coach.endDateApprox,
        })
        .eq('id', existing.id)
      coaches_updated++
    } else {
      coaches_skipped++ // manual entry — never overwrite
    }
  }

  // Update sync timestamp on club
  await supabase
    .from('clubs')
    .update({ wikidata_synced_at: new Date().toISOString() })
    .eq('id', clubId)

  // Log to audit trail
  await supabase.from('club_data_sync_log').insert({
    user_id: user.id,
    club_id: clubId,
    sync_type: 'wikidata',
    result: { wikidata_id: wikidataId, coaches_added, coaches_updated, coaches_skipped },
  })

  return NextResponse.json({
    ok: true,
    wikidata_id: wikidataId,
    synced: { coaches_added, coaches_updated, coaches_skipped },
  })
}
