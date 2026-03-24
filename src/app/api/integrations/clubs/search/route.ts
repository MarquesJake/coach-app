import { NextRequest, NextResponse } from 'next/server'

type SportsDBTeam = {
  idTeam: string
  strTeam: string
  strSport: string
  strLeague: string
  strCountry: string
  strDescriptionEN: string | null
  strManager: string | null
  strStadium: string | null
  strBadge: string | null
  intFormedYear: string | null
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] })
  }

  const url = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(q.trim())}`

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return NextResponse.json({ results: [] })

    const data = await res.json()
    const teams: SportsDBTeam[] = data.teams ?? []

    const results = teams
      .filter((t) => t.strSport === 'Soccer')
      .slice(0, 8)
      .map((t) => ({
        external_id: t.idTeam,
        external_source: 'thesportsdb' as const,
        name: t.strTeam,
        league: t.strLeague ?? '',
        country: t.strCountry ?? '',
        badge_url: t.strBadge ?? null,
        description: t.strDescriptionEN ? t.strDescriptionEN.slice(0, 600) : null,
        manager: t.strManager ?? null,
        stadium: t.strStadium ?? null,
        formed_year: t.intFormedYear ?? null,
      }))

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
