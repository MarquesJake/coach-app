import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// 2024/25 English Football Pyramid – static club list
// TheSportsDB IDs included where known; enrichment fills in badges/stadiums lazily
const ENGLISH_CLUBS = [
  // ── PREMIER LEAGUE (Tier 1) ──────────────────────────────────────────────
  // These get seeded via search_all_teams — this list is a fallback / ensures presence
  { name: 'Arsenal',               tier: '1', league: 'Premier League', external_id: '133604' },
  { name: 'Aston Villa',           tier: '1', league: 'Premier League', external_id: '133619' },
  { name: 'Bournemouth',           tier: '1', league: 'Premier League', external_id: '133628' },
  { name: 'Brentford',             tier: '1', league: 'Premier League', external_id: '133609' },
  { name: 'Brighton & Hove Albion',tier: '1', league: 'Premier League', external_id: '133616' },
  { name: 'Chelsea',               tier: '1', league: 'Premier League', external_id: '133610' },
  { name: 'Crystal Palace',        tier: '1', league: 'Premier League', external_id: '133601' },
  { name: 'Everton',               tier: '1', league: 'Premier League', external_id: '133596' },
  { name: 'Fulham',                tier: '1', league: 'Premier League', external_id: '133633' },
  { name: 'Ipswich Town',          tier: '1', league: 'Premier League', external_id: '133637' },
  { name: 'Leicester City',        tier: '1', league: 'Premier League', external_id: '133607' },
  { name: 'Liverpool',             tier: '1', league: 'Premier League', external_id: '133602' },
  { name: 'Manchester City',       tier: '1', league: 'Premier League', external_id: '133613' },
  { name: 'Manchester United',     tier: '1', league: 'Premier League', external_id: '133612' },
  { name: 'Newcastle United',      tier: '1', league: 'Premier League', external_id: '133614' },
  { name: 'Nottingham Forest',     tier: '1', league: 'Premier League', external_id: '133606' },
  { name: 'Southampton',           tier: '1', league: 'Premier League', external_id: '133621' },
  { name: 'Tottenham Hotspur',     tier: '1', league: 'Premier League', external_id: '133615' },
  { name: 'West Ham United',       tier: '1', league: 'Premier League', external_id: '133620' },
  { name: 'Wolverhampton Wanderers',tier:'1', league: 'Premier League', external_id: '133632' },

  // ── CHAMPIONSHIP (Tier 2) ────────────────────────────────────────────────
  { name: 'Burnley',               tier: '2', league: 'Championship',   external_id: '133623' },
  { name: 'Sheffield United',      tier: '2', league: 'Championship',   external_id: '133617' },
  { name: 'Luton Town',            tier: '2', league: 'Championship',   external_id: '133639' },
  { name: 'Sunderland',            tier: '2', league: 'Championship',   external_id: '133603' },
  { name: 'Leeds United',          tier: '2', league: 'Championship',   external_id: '133635' },
  { name: 'West Bromwich Albion',  tier: '2', league: 'Championship',   external_id: '133600' },
  { name: 'Middlesbrough',         tier: '2', league: 'Championship',   external_id: '133599' },
  { name: 'Norwich City',          tier: '2', league: 'Championship',   external_id: '133608' },
  { name: 'Blackburn Rovers',      tier: '2', league: 'Championship',   external_id: '133593' },
  { name: 'Bristol City',          tier: '2', league: 'Championship',   external_id: '133643' },
  { name: 'Coventry City',         tier: '2', league: 'Championship',   external_id: '133622' },
  { name: 'Cardiff City',          tier: '2', league: 'Championship',   external_id: '134376' },
  { name: 'Millwall',              tier: '2', league: 'Championship',   external_id: '133641' },
  { name: 'Watford',               tier: '2', league: 'Championship',   external_id: '133630' },
  { name: 'Hull City',             tier: '2', league: 'Championship',   external_id: '133618' },
  { name: 'Queens Park Rangers',   tier: '2', league: 'Championship',   external_id: '133640' },
  { name: 'Stoke City',            tier: '2', league: 'Championship',   external_id: '133626' },
  { name: 'Swansea City',          tier: '2', league: 'Championship',   external_id: '134392' },
  { name: 'Sheffield Wednesday',   tier: '2', league: 'Championship',   external_id: '133598' },
  { name: 'Preston North End',     tier: '2', league: 'Championship',   external_id: '133652' },
  { name: 'Plymouth Argyle',       tier: '2', league: 'Championship',   external_id: '133644' },
  { name: 'Portsmouth',            tier: '2', league: 'Championship',   external_id: '133645' },
  { name: 'Oxford United',         tier: '2', league: 'Championship',   external_id: '133660' },
  { name: 'Derby County',          tier: '2', league: 'Championship',   external_id: '133597' },

  // ── LEAGUE ONE (Tier 3) ──────────────────────────────────────────────────
  { name: 'Birmingham City',       tier: '3', league: 'League One',     external_id: '133595' },
  { name: 'Huddersfield Town',     tier: '3', league: 'League One',     external_id: '133625' },
  { name: 'Rotherham United',      tier: '3', league: 'League One',     external_id: '133648' },
  { name: 'Charlton Athletic',     tier: '3', league: 'League One',     external_id: '133629' },
  { name: 'Wrexham',               tier: '3', league: 'League One',     external_id: '133788' },
  { name: 'Stockport County',      tier: '3', league: 'League One',     external_id: '133668' },
  { name: 'Wigan Athletic',        tier: '3', league: 'League One',     external_id: '133631' },
  { name: 'Barnsley',              tier: '3', league: 'League One',     external_id: '133646' },
  { name: 'Bolton Wanderers',      tier: '3', league: 'League One',     external_id: '133594' },
  { name: 'Blackpool',             tier: '3', league: 'League One',     external_id: '133651' },
  { name: 'Peterborough United',   tier: '3', league: 'League One',     external_id: '133655' },
  { name: 'Reading',               tier: '3', league: 'League One',     external_id: '133624' },
  { name: 'Bristol Rovers',        tier: '3', league: 'League One',     external_id: '133789' },
  { name: 'Cambridge United',      tier: '3', league: 'League One',     external_id: '133663' },
  { name: 'Shrewsbury Town',       tier: '3', league: 'League One',     external_id: '133657' },
  { name: 'Exeter City',           tier: '3', league: 'League One',     external_id: '133659' },
  { name: 'Leyton Orient',         tier: '3', league: 'League One',     external_id: '133667' },
  { name: 'Lincoln City',          tier: '3', league: 'League One',     external_id: '133664' },
  { name: 'Stevenage',             tier: '3', league: 'League One',     external_id: '133680' },
  { name: 'Wycombe Wanderers',     tier: '3', league: 'League One',     external_id: '133673' },
  { name: 'Burton Albion',         tier: '3', league: 'League One',     external_id: '133661' },
  { name: 'Northampton Town',      tier: '3', league: 'League One',     external_id: '133658' },
  { name: 'Crawley Town',          tier: '3', league: 'League One',     external_id: '133678' },
  { name: 'Fleetwood Town',        tier: '3', league: 'League One',     external_id: '133672' },

  // ── LEAGUE TWO (Tier 4) ──────────────────────────────────────────────────
  { name: 'Notts County',          tier: '4', league: 'League Two',     external_id: '133649' },
  { name: 'Gillingham',            tier: '4', league: 'League Two',     external_id: '133650' },
  { name: 'Bradford City',         tier: '4', league: 'League Two',     external_id: '133647' },
  { name: 'Grimsby Town',          tier: '4', league: 'League Two',     external_id: '133669' },
  { name: 'Swindon Town',          tier: '4', league: 'League Two',     external_id: '133656' },
  { name: 'Doncaster Rovers',      tier: '4', league: 'League Two',     external_id: '133654' },
  { name: 'Salford City',          tier: '4', league: 'League Two',     external_id: '134498' },
  { name: 'Harrogate Town',        tier: '4', league: 'League Two',     external_id: '152946' },
  { name: 'Newport County',        tier: '4', league: 'League Two',     external_id: '133793' },
  { name: 'AFC Wimbledon',         tier: '4', league: 'League Two',     external_id: '133790' },
  { name: 'Crewe Alexandra',       tier: '4', league: 'League Two',     external_id: '133662' },
  { name: 'Carlisle United',       tier: '4', league: 'League Two',     external_id: '133666' },
  { name: 'Colchester United',     tier: '4', league: 'League Two',     external_id: '133671' },
  { name: 'Accrington Stanley',    tier: '4', league: 'League Two',     external_id: '133684' },
  { name: 'Barrow',                tier: '4', league: 'League Two',     external_id: '133796' },
  { name: 'MK Dons',               tier: '4', league: 'League Two',     external_id: '133674' },
  { name: 'Mansfield Town',        tier: '4', league: 'League Two',     external_id: '133653' },
  { name: 'Tranmere Rovers',       tier: '4', league: 'League Two',     external_id: '133670' },
  { name: 'Morecambe',             tier: '4', league: 'League Two',     external_id: '133685' },
  { name: 'Sutton United',         tier: '4', league: 'League Two',     external_id: '133795' },
  { name: 'Cheltenham Town',       tier: '4', league: 'League Two',     external_id: '133676' },
  { name: 'Forest Green Rovers',   tier: '4', league: 'League Two',     external_id: '133792' },
  { name: 'Rochdale',              tier: '4', league: 'League Two',     external_id: '133683' },
  { name: 'Port Vale',             tier: '4', league: 'League Two',     external_id: '133665' },
]

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let added = 0
  let skipped = 0
  const errors: string[] = []

  // Fetch all existing clubs for this user — check by both external_id AND name
  const { data: existing } = await supabase
    .from('clubs')
    .select('external_id, name')
    .eq('user_id', user.id)

  const existingIds = new Set((existing ?? []).map(r => r.external_id).filter(Boolean))
  const existingNames = new Set((existing ?? []).map(r => r.name.toLowerCase().trim()))

  // Batch insert all clubs not already present
  const toInsert = ENGLISH_CLUBS
    .filter(c => !existingIds.has(c.external_id) && !existingNames.has(c.name.toLowerCase().trim()))
    .map(c => ({
      user_id: user.id,
      name: c.name,
      country: 'England',
      league: c.league,
      tier: c.tier,
      external_id: c.external_id,
      external_source: 'thesportsdb',
    }))

  skipped = ENGLISH_CLUBS.length - toInsert.length

  if (toInsert.length > 0) {
    // Insert in chunks of 20
    for (let i = 0; i < toInsert.length; i += 20) {
      const chunk = toInsert.slice(i, i + 20)
      const { error } = await supabase.from('clubs').insert(chunk)
      if (error) {
        errors.push(`Chunk ${i}–${i + chunk.length}: ${error.message}`)
      } else {
        added += chunk.length
      }
    }
  }

  // ── Correct tier/league for all clubs in the static list (fixes TheSportsDB outdated data) ──
  const { data: allClubs } = await supabase
    .from('clubs')
    .select('id, name, tier, league, external_id')
    .eq('user_id', user.id)

  let corrected = 0
  for (const def of ENGLISH_CLUBS) {
    const match = (allClubs ?? []).find(c =>
      c.external_id === def.external_id ||
      c.name.toLowerCase() === def.name.toLowerCase()
    )
    if (match && (match.tier !== def.tier || match.league !== def.league)) {
      await supabase
        .from('clubs')
        .update({ tier: def.tier, league: def.league })
        .eq('id', match.id)
        .eq('user_id', user.id)
      corrected++
    }
  }

  return NextResponse.json({
    ok: true,
    added,
    skipped,
    corrected,
    total: ENGLISH_CLUBS.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
