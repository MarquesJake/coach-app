import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Wikipedia page titles for known coaches
const WIKIPEDIA_TITLES: Record<string, string> = {
  'Thomas Tuchel': 'Thomas_Tuchel',
  'Mauricio Pochettino': 'Mauricio_Pochettino',
  'Enzo Maresca': 'Enzo_Maresca',
  'Graham Potter': 'Graham_Potter',
  'Kieran McKenna': 'Kieran_McKenna_(footballer)',
  'Oliver Glasner': 'Oliver_Glasner',
  'Roberto De Zerbi': 'Roberto_De_Zerbi',
}

// Known football club/national team keywords to validate employer matches
const FOOTBALL_KEYWORDS = [
  'united', 'city', 'fc ', ' fc', 'sporting', 'athletic', 'atlético', 'real ',
  'paris', 'psg', 'juventus', 'inter', 'milan', 'barcelona', 'madrid', 'chelsea',
  'arsenal', 'liverpool', 'tottenham', 'spurs', 'brighton', 'leicester', 'everton',
  'newcastle', 'wolves', 'west ham', 'aston villa', 'nottingham', 'southampton',
  'dortmund', 'bvb', 'bayern', 'hoffenheim', 'mainz', 'freiburg', 'leverkusen',
  'marseille', 'lyon', 'lille', 'monaco', 'napoli', 'roma', 'lazio', 'fiorentina',
  'porto', 'benfica', 'sporting cp', 'ajax', 'psv', 'feyenoord',
  'england', 'france', 'germany', 'spain', 'italy', 'argentina', 'brazil',
  'netherlands', 'portugal', 'belgium', 'usa', 'usmnt', 'scotland', 'wales',
  'national team', 'national football',
]

interface WikiSummary {
  description: string | null
  extract: string | null
}

async function getWikipediaPage(title: string): Promise<WikiSummary> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CoachApp/1.0 (football intelligence demo)' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return { description: null, extract: null }
  const data = await res.json()
  return {
    description: data.description ?? null,
    extract: data.extract ?? null,
  }
}

function parseCurrentRole(extract: string | null, description: string | null): {
  currentClub: string | null
  isNationalTeam: boolean
  isAvailable: boolean
  roleLabel: string
} {
  const text = (extract ?? '') + ' ' + (description ?? '')
  const lower = text.toLowerCase()

  // National team patterns
  const nationalPatterns = [
    /head coach of (?:the )?([a-z\s]+national)/i,
    /manager of (?:the )?([a-z\s]+national)/i,
    /(?:is|as) (?:the )?([a-z\s]+) national team(?:'s)? (?:head )?(?:coach|manager)/i,
    /managing (?:the )?([a-z\s]+) national/i,
    /in charge of (?:the )?([a-z\s]+) national/i,
  ]

  for (const pattern of nationalPatterns) {
    const match = text.match(pattern)
    if (match) {
      return {
        currentClub: match[1]?.trim() ?? 'National Team',
        isNationalTeam: true,
        isAvailable: false,
        roleLabel: 'National Team Head Coach',
      }
    }
  }

  // Club manager patterns — look in first 2 sentences
  const firstSentences = extract?.split('.').slice(0, 3).join('.') ?? ''
  const clubPatterns = [
    /(?:is|as) (?:the )?(?:head )?(?:coach|manager) of ([A-Z][A-Za-z\s]+(?:FC|CF|United|City|Town|Athletic|Hotspur|Villa|Palace|Wednesday|Forest|Rovers|Wanderers|County))/,
    /(?:head )?(?:coach|manager) of ([A-Z][A-Za-z\s]{3,30}?)(?:\s+(?:FC|CF))?[,.]?\s+(?:a |an |in )/,
    /currently (?:manages?|coaching) ([A-Z][A-Za-z\s]+(?:FC|CF|United|City|Town|Athletic))/i,
    /(?:appointed|joined) (?:as (?:head )?(?:coach|manager) of )?([A-Z][A-Za-z\s]+(?:FC|CF|United|City|Town|Athletic|Hotspur))/i,
  ]

  for (const pattern of clubPatterns) {
    const match = firstSentences.match(pattern)
    if (match?.[1]) {
      const club = match[1].trim()
      const clubLower = club.toLowerCase()
      if (FOOTBALL_KEYWORDS.some(k => clubLower.includes(k))) {
        return {
          currentClub: club,
          isNationalTeam: false,
          isAvailable: false,
          roleLabel: 'Head Coach',
        }
      }
    }
  }

  // Unemployment patterns
  const freePatterns = [
    'unemployed', 'free agent', 'without a club', 'out of work',
    'left his role', 'departed', 'sacked', 'dismissed',
    'no longer', 'resigned',
  ]

  // Check if extract mentions being out of work recently
  const recentFree = freePatterns.some(p => lower.includes(p))

  // If no current role found, check description for "is a football manager" (present tense, no current role = available)
  const isActiveManager = /is an? (?:[a-z\-]+ )*(?:football|soccer) manager/i.test(text)

  return {
    currentClub: null,
    isNationalTeam: false,
    isAvailable: recentFree || isActiveManager || !extract,
    roleLabel: 'Head Coach',
  }
}

function buildAvailability(role: ReturnType<typeof parseCurrentRole>): {
  available_status: string
  market_status: string
  role_current: string
} {
  if (role.isNationalTeam) {
    return {
      available_status: 'Under Contract',
      market_status: 'Not Available',
      role_current: 'National Team Head Coach',
    }
  }
  if (role.currentClub && !role.isAvailable) {
    return {
      available_status: 'Under Contract',
      market_status: 'Not Available',
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

  const targetNames = Object.keys(WIKIPEDIA_TITLES)
  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, name, available_status')
    .in('name', targetNames)
    .eq('user_id', user.id)

  if (!coaches?.length) {
    return NextResponse.json({ error: 'No matching coaches found' }, { status: 404 })
  }

  const results: Record<string, {
    previous: string
    wikipedia_description: string | null
    detected_club: string | null
    is_national_team: boolean
    updated_to: string
  }> = {}

  for (const coach of coaches) {
    const title = WIKIPEDIA_TITLES[coach.name]
    if (!title) continue

    try {
      const wiki = await getWikipediaPage(title)
      const role = parseCurrentRole(wiki.extract, wiki.description)
      const availability = buildAvailability(role)

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
        wikipedia_description: wiki.description,
        detected_club: role.currentClub,
        is_national_team: role.isNationalTeam,
        updated_to: availability.available_status,
      }
    } catch (err) {
      results[coach.name] = {
        previous: coach.available_status,
        wikipedia_description: null,
        detected_club: null,
        is_national_team: false,
        updated_to: 'unchanged — error: ' + String(err),
      }
    }
  }

  return NextResponse.json({ ok: true, updated: Object.keys(results).length, results })
}
