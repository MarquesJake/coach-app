import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  let dependencyStatus: 'ok' | 'unavailable' = 'unavailable'

  if (projectUrl && publicKey) {
    try {
      const response = await fetch(`${projectUrl}/auth/v1/health`, {
        headers: { apikey: publicKey },
        cache: 'no-store',
        signal: AbortSignal.timeout(4_000),
      })
      if (response.ok) dependencyStatus = 'ok'
    } catch {
      dependencyStatus = 'unavailable'
    }
  }

  const healthy = dependencyStatus === 'ok'
  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      dependencies: { identity: dependencyStatus },
      checked_at: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    }
  )
}
