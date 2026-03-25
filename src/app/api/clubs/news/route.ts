import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 1800 // 30 minutes

function parseRSS(xml: string) {
  const items: { title: string; link: string; pubDate: string; source: string }[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match: RegExpExecArray | null
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() ?? ''
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? block.match(/<guid>([\s\S]*?)<\/guid>/)?.[1]?.trim() ?? ''
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? ''
    const source = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.trim() ?? ''
    if (title && link) items.push({ title, link, pubDate, source })
    if (items.length >= 5) break
  }
  return items
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const club = searchParams.get('club')

  if (!club) {
    return NextResponse.json({ error: 'club param required' }, { status: 400 })
  }

  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(club)}&hl=en-GB&gl=GB&ceid=GB:en`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CoachApp/1.0)' },
      next: { revalidate: 1800 },
    })

    if (!res.ok) {
      return NextResponse.json([], { status: 200 })
    }

    const xml = await res.text()
    const items = parseRSS(xml)

    return NextResponse.json(items, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
