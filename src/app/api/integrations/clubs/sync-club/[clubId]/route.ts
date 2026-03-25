import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY!

export async function POST(
  _req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  if (!API_FOOTBALL_KEY) return NextResponse.json({ error: 'API_FOOTBALL_KEY not configured' }, { status: 500 })

  const { clubId } = params
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: club } = await supabase
    .from('clubs')
    .select('id, name, external_id, external_source, squad_synced_at, coaches_synced_at')
    .eq('id', clubId)
    .eq('user_id', user.id)
    .single()

  if (!club?.external_id || club.external_source !== 'api-football') {
    return NextResponse.json({ error: 'Club has no API-Football ID' }, { status: 400 })
  }

  const apiId = club.external_id
  const now = new Date().toISOString()
  const result: Record<string, unknown> = {}

  // ── Squad ──────────────────────────────────────────────────────────────────
  const squadRes = await fetch(
    `https://v3.football.api-sports.io/players/squads?team=${apiId}`,
    { headers: { 'x-apisports-key': API_FOOTBALL_KEY } }
  )
  const squadData = await squadRes.json()
  const players = squadData.response?.[0]?.players ?? []

  if (players.length > 0) {
    // Delete existing squad for this club and re-insert
    await supabase.from('club_squad').delete().eq('club_id', clubId).eq('user_id', user.id)
    const rows = players.map((p: { id: number; name: string; age: number; number: number; position: string; photo: string }) => ({
      user_id: user.id,
      club_id: clubId,
      player_id: p.id,
      name: p.name,
      age: p.age ?? null,
      number: p.number ?? null,
      position: p.position ?? null,
      photo_url: p.photo ?? null,
      season: '2024',
      synced_at: now,
    }))
    await supabase.from('club_squad').insert(rows)
    await supabase.from('clubs').update({ squad_synced_at: now }).eq('id', clubId)
    result.squad = players.length
  }

  // ── Coaching staff / history ───────────────────────────────────────────────
  const coachRes = await fetch(
    `https://v3.football.api-sports.io/coachs?team=${apiId}`,
    { headers: { 'x-apisports-key': API_FOOTBALL_KEY } }
  )
  const coachData = await coachRes.json()
  const coaches = coachData.response ?? []

  // Delete existing api-football coaching entries and re-insert fresh (avoids duplicates)
  await supabase
    .from('club_coaching_history')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', user.id)
    .eq('data_source', 'api-football')

  let coachesAdded = 0
  for (const coach of coaches) {
    // Find the career entry for this club
    const stint = (coach.career ?? []).find(
      (c: { team: { id: number }; start: string; end: string | null }) => String(c.team.id) === String(apiId)
    )
    if (!stint) continue

    const startDate = stint.start ? stint.start.split('T')[0] : null
    const endDate = stint.end ? stint.end.split('T')[0] : null

    await supabase.from('club_coaching_history').insert({
      user_id: user.id,
      club_id: clubId,
      coach_name: coach.name,
      start_date: startDate,
      end_date: endDate,
      style_tags: [],
      data_source: 'api-football',
    })
    coachesAdded++
  }

  await supabase.from('clubs').update({ coaches_synced_at: now }).eq('id', clubId)
  result.coaches = coachesAdded

  // ── Transfers (recent season) ─────────────────────────────────────────────
  const transferRes = await fetch(
    `https://v3.football.api-sports.io/transfers?team=${apiId}`,
    { headers: { 'x-apisports-key': API_FOOTBALL_KEY } }
  )
  const transferData = await transferRes.json()
  const transferPlayers = transferData.response ?? []

  // Only keep 2023 and 2024 season transfers
  let transfersAdded = 0
  const recentTransfers: Array<{
    player_name: string; player_id: number; direction: string;
    other_club: string; transfer_type: string; fee_amount: number | null;
    fee_currency: string | null; transfer_date: string; season: string;
  }> = []

  for (const p of transferPlayers) {
    for (const t of (p.transfers ?? [])) {
      const season = t.date ? t.date.slice(0, 4) : null
      if (!season || parseInt(season) < 2022) continue

      const isIn = String(t.teams?.in?.id) === String(apiId)
      const isOut = String(t.teams?.out?.id) === String(apiId)
      if (!isIn && !isOut) continue

      recentTransfers.push({
        player_name: p.player?.name ?? 'Unknown',
        player_id: p.player?.id ?? null,
        direction: isIn ? 'in' : 'out',
        other_club: isIn ? (t.teams?.out?.name ?? null) : (t.teams?.in?.name ?? null),
        transfer_type: t.type ?? null,
        fee_amount: t.fees?.amount ? parseFloat(t.fees.amount) : null,
        fee_currency: t.fees?.currency ?? null,
        transfer_date: t.date ?? null,
        season: season,
      })
    }
  }

  // Delete and re-insert recent transfers for this club
  if (recentTransfers.length > 0) {
    await supabase.from('club_transfers').delete().eq('club_id', clubId).eq('user_id', user.id)
    const rows = recentTransfers.map(t => ({
      user_id: user.id,
      club_id: clubId,
      ...t,
    }))
    // Insert in chunks
    for (let i = 0; i < rows.length; i += 50) {
      await supabase.from('club_transfers').insert(rows.slice(i, i + 50))
    }
    await supabase.from('clubs').update({ transfers_synced_at: now }).eq('id', clubId)
    transfersAdded = recentTransfers.length
  }

  result.transfers = transfersAdded

  return NextResponse.json({ ok: true, ...result })
}
