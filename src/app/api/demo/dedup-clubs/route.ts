import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: clubs } = await supabase
    .from('clubs')
    .select('id, name, external_id, badge_url, description, stadium, tier, last_synced_at')
    .eq('user_id', user.id)
    .order('name')

  if (!clubs) return NextResponse.json({ ok: true, deleted: 0 })

  // Group by name
  const byName = new Map<string, typeof clubs>()
  for (const c of clubs) {
    const key = c.name.toLowerCase().trim()
    if (!byName.has(key)) byName.set(key, [])
    byName.get(key)!.push(c)
  }

  const toDelete: string[] = []
  for (const [, group] of byName) {
    if (group.length <= 1) continue
    // Keep the one with the most data (badge > description > synced)
    group.sort((a, b) => {
      const scoreA = (a.badge_url ? 4 : 0) + (a.description ? 2 : 0) + (a.last_synced_at ? 1 : 0)
      const scoreB = (b.badge_url ? 4 : 0) + (b.description ? 2 : 0) + (b.last_synced_at ? 1 : 0)
      return scoreB - scoreA
    })
    // Delete all but the first (best)
    for (const dup of group.slice(1)) {
      toDelete.push(dup.id)
    }
  }

  if (toDelete.length > 0) {
    await supabase.from('clubs').delete().in('id', toDelete).eq('user_id', user.id)
  }

  return NextResponse.json({ ok: true, deleted: toDelete.length })
}
