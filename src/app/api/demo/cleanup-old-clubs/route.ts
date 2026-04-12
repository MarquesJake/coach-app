import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Delete all clubs that are NOT from api-football.
  // The sync-english endpoint has already upserted the canonical 92 clubs from API-Football.
  // Any remaining non-api-football entries are old static/thesportsdb duplicates.
  const { data: deleted, error } = await supabase
    .from('clubs')
    .delete()
    .eq('user_id', user.id)
    .neq('external_source', 'api-football')
    .select('id, name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, deleted: deleted?.length ?? 0, names: deleted?.map(c => c.name) })
}
