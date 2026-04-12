import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const TIER_TO_LABEL: Record<string, string> = {
  '1': 'Premier League',
  '2': 'Championship',
  '3': 'League One',
  '4': 'League Two',
}

export async function POST() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch all season results with null league_label
  const { data: rows } = await supabase
    .from('club_season_results')
    .select('id, club_id')
    .eq('user_id', user.id)
    .is('league_label', null)

  if (!rows || rows.length === 0) {
    return NextResponse.json({ ok: true, updated: 0 })
  }

  // Fetch all clubs to build a tier map
  const clubIds = Array.from(new Set(rows.map(r => r.club_id)))
  const { data: clubs } = await supabase
    .from('clubs')
    .select('id, tier')
    .in('id', clubIds)

  const tierMap = new Map<string, string>()
  for (const c of clubs ?? []) {
    if (c.tier) tierMap.set(c.id, c.tier)
  }

  let updated = 0
  for (const row of rows) {
    const tier = tierMap.get(row.club_id)
    const label = tier ? TIER_TO_LABEL[tier] : null
    if (!label) continue

    await supabase
      .from('club_season_results')
      .update({ league_label: label })
      .eq('id', row.id)
    updated++
  }

  return NextResponse.json({ ok: true, updated })
}
