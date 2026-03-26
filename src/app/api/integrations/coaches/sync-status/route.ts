import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Wikidata entity IDs for known coaches
const WIKIDATA_IDS: Record<string, string> = {
  'Thomas Tuchel': 'Q461793',
  'Mauricio Pochettino': 'Q331437',
  'Enzo Maresca': 'Q729985',
  'Graham Potter': 'Q7602490',
  'Kieran McKenna': 'Q7602491',
  'Oliver Glasner': 'Q547516',
  'Roberto De Zerbi': 'Q472279',
}

interface WikidataEmployer {
  employer: string
  employerLabel: string
  endTime?: string
}

async function getWikidataEmployment(qid: string): Promise<{ current: string | null; recent: WikidataEmployer[] }> {
  // Query current and recent employer from Wikidata
  const sparql = `
    SELECT ?employer ?employerLabel ?startTime ?endTime WHERE {
      wd:${qid} p:P108 ?stmt .
      ?stmt ps:P108 ?employer .
      OPTIONAL { ?stmt pq:P580 ?startTime . }
      OPTIONAL { ?stmt pq:P582 ?endTime . }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
    }
    ORDER BY DESC(?startTime)
    LIMIT 5
  `

  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'CoachApp/1.0' },
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) return { current: null, recent: [] }

  const data = await res.json()
  const results: WikidataEmployer[] = data.results?.bindings?.map((b: Record<string, { value: string }>) => ({
    employer: b.employer?.value ?? '',
    employerLabel: b.employerLabel?.value ?? '',
    endTime: b.endTime?.value ?? null,
  })) ?? []

  // Current = most recent with no end time
  const current = results.find(r => !r.endTime)?.employerLabel ?? null
  return { current, recent: results }
}

async function getWikipediaSummary(coachName: string): Promise<{ description: string | null; extract: string | null }> {
  const title = coachName.replace(/ /g, '_')
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'CoachApp/1.0' },
    signal: AbortSignal.timeout(6000),
  })

  if (!res.ok) return { description: null, extract: null }
  const data = await res.json()
  return {
    description: data.description ?? null,
    extract: data.extract ?? null,
  }
}

function inferAvailability(current: string | null, description: string | null): {
  available_status: string
  market_status: string
  role_current: string
} {
  const text = `${current ?? ''} ${description ?? ''}`.toLowerCase()

  // National team = under contract
  if (text.includes('national') || text.includes('england') || text.includes('usa') ||
      text.includes('france') || text.includes('germany') || text.includes('argentina')) {
    return {
      available_status: 'Under Contract',
      market_status: 'Not Available',
      role_current: 'National Team Head Coach',
    }
  }

  // Has a current club employer
  if (current && current.length > 2 && !text.includes('unemployed') && !text.includes('free agent')) {
    return {
      available_status: 'Under Contract',
      market_status: 'Not Available',
      role_current: 'Head Coach',
    }
  }

  // Explicitly unemployed/free
  if (text.includes('unemployed') || text.includes('free agent') || !current) {
    return {
      available_status: 'Available',
      market_status: 'Open to offers',
      role_current: 'Head Coach',
    }
  }

  return {
    available_status: 'Available',
    market_status: 'Open to offers',
    role_current: 'Head Coach',
  }
}

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch all coaches that have a known Wikidata ID
  const targetNames = Object.keys(WIKIDATA_IDS)
  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, name, available_status, market_status, role_current')
    .in('name', targetNames)
    .eq('user_id', user.id)

  if (!coaches?.length) {
    return NextResponse.json({ error: 'No matching coaches found' }, { status: 404 })
  }

  const results: Record<string, {
    previous: string
    current_employer: string | null
    description: string | null
    updated_to: string
    source: string
  }> = {}

  for (const coach of coaches) {
    const qid = WIKIDATA_IDS[coach.name]
    if (!qid) continue

    try {
      const [employment, wiki] = await Promise.all([
        getWikidataEmployment(qid),
        getWikipediaSummary(coach.name),
      ])

      const availability = inferAvailability(employment.current, wiki.description)

      await supabase
        .from('coaches')
        .update({
          available_status: availability.available_status,
          availability_status: availability.available_status,
          market_status: availability.market_status,
          role_current: availability.role_current,
        })
        .eq('id', coach.id)

      results[coach.name] = {
        previous: coach.available_status,
        current_employer: employment.current,
        description: wiki.description,
        updated_to: availability.available_status,
        source: 'Wikidata + Wikipedia',
      }
    } catch (err) {
      results[coach.name] = {
        previous: coach.available_status,
        current_employer: null,
        description: null,
        updated_to: 'unchanged (error)',
        source: String(err),
      }
    }
  }

  return NextResponse.json({ ok: true, updated: Object.keys(results).length, results })
}
