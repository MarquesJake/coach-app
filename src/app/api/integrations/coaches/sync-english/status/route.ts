import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
const SYNC_KEY = 'coaches-english-api-football'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const stateRes = await supabase
    .from('integration_sync_state')
    .select('status, cursor, total, result, error, updated_at, completed_at')
    .eq('user_id', user.id)
    .eq('sync_key', SYNC_KEY)
    .maybeSingle()

  const state = stateRes.data
  if (!state) {
    return NextResponse.json({
      ok: true,
      status: 'idle',
      progress: { cursor: 0, total: 0, remaining: 0 },
      result: null,
      error: null,
    })
  }

  const cursor = Number(state.cursor ?? 0)
  const total = Number(state.total ?? 0)
  return NextResponse.json({
    ok: true,
    status: state.status ?? 'idle',
    progress: {
      cursor,
      total,
      remaining: Math.max(total - cursor, 0),
      pct: total > 0 ? Math.round((cursor / total) * 100) : 0,
    },
    result: state.result ?? null,
    error: state.error ?? null,
    updated_at: state.updated_at ?? null,
    completed_at: state.completed_at ?? null,
  })
}

