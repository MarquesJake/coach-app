import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const CHELSEA_ID = '2a2359e1-7211-47ae-9e3a-7b47295fdb57'

export async function POST() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const log: string[] = []

  // ── 1. Enrich Chelsea internal intelligence ────────────────────────────────
  await supabase.from('clubs').update({
    ownership_model: 'Private',
    board_risk_tolerance: 'High — board has shown limited patience; four managers in three years since 2022 takeover',
    tactical_model: 'Possession-based, progressive build-up with high defensive line',
    pressing_model: 'High press, counter-press triggers',
    build_model: 'Build from the back, goalkeeper as first player',
    strategic_priority: 'Return to top-4 finish and re-establish a coherent tactical identity',
    development_vs_win_now: 'Win now with a youth investment parallel track',
    market_reputation: 'Elite — one of the highest wage budgets in the Premier League',
    media_pressure: 'Very high — constant scrutiny, owner interference documented publicly',
    environment_assessment: 'Extremely demanding environment. The Boehly-Clearlake ownership group has shown low patience for underperformance, with four managerial changes since the 2022 takeover. The squad is expensive and talented but has lacked a consistent system. A new appointment will face immediate expectation and limited grace period. Long-term structural stability is possible but must be negotiated at appointment stage.',
    instability_risk: 'High instability risk — structural board impatience since 2022 ownership change. Any appointment must negotiate clear KPIs and succession protection upfront.',
  }).eq('id', CHELSEA_ID).eq('user_id', user.id)
  log.push('Chelsea intelligence updated')

  // ── 2. Add historical season results ──────────────────────────────────────
  const seasons = [
    { season: '2018/19', league_position: 3, points: 72, goals_for: 63, goals_against: 39 },
    { season: '2019/20', league_position: 4, points: 66, goals_for: 69, goals_against: 54 },
    { season: '2020/21', league_position: 4, points: 67, goals_for: 58, goals_against: 36 },
    { season: '2021/22', league_position: 3, points: 74, goals_for: 76, goals_against: 33 },
  ]
  for (const s of seasons) {
    const { error } = await supabase.from('club_season_results').upsert(
      { user_id: user.id, club_id: CHELSEA_ID, data_source: 'manual', ...s },
      { onConflict: 'club_id,season', ignoreDuplicates: true }
    )
    if (!error) log.push(`Season ${s.season} added`)
  }

  // ── 3. Create demo coaches ─────────────────────────────────────────────────
  const coachDefs = [
    {
      name: 'Oliver Glasner',
      nationality: 'Austrian',
      club_current: 'Crystal Palace (departed)',
      role_current: 'Available',
      available_status: 'Available',
      reputation_tier: 'Tier 2 – strong Premier League track record',
      wage_expectation: '£5M–£7M pa',
      staff_cost_estimate: '£1.5M–£2M pa',
      preferred_style: 'Possession, vertical passing, compact shape',
      pressing_intensity: 'High',
      build_preference: 'Build from back',
      leadership_style: 'Detailed and process-driven',
      languages: ['German', 'English'],
      preferred_systems: ['4-2-3-1', '4-3-3'],
      tactical_identity: 'Structured possession with quick transitions. Demands high work rate and defensive organisation. Excellent at building team identity from scratch.',
    },
    {
      name: 'Roberto De Zerbi',
      nationality: 'Italian',
      club_current: 'Olympique de Marseille',
      role_current: 'Head Coach',
      available_status: 'Under contract',
      reputation_tier: 'Tier 1 – elite tactical profile',
      wage_expectation: '£7M–£10M pa',
      staff_cost_estimate: '£2M–£3M pa',
      preferred_style: 'Positional play, Pep-school possession, intricate combinations',
      pressing_intensity: 'High',
      build_preference: 'Build from the goalkeeper',
      leadership_style: 'Visionary and demanding — very high standards for technical detail',
      languages: ['Italian', 'French', 'Some English'],
      preferred_systems: ['4-3-3', '3-4-2-1'],
      tactical_identity: 'One of the most tactically advanced coaches in world football. Transformed Brighton beyond expectations. Identity is very strong but requires buy-in from the whole club structure.',
    },
    {
      name: 'Thomas Frank',
      nationality: 'Danish',
      club_current: 'Available',
      role_current: 'Available',
      available_status: 'Available',
      reputation_tier: 'Tier 2 – highly respected, overachiever profile',
      wage_expectation: '£3M–£5M pa',
      staff_cost_estimate: '£1M–£1.5M pa',
      preferred_style: 'Direct and organised, strong transitions, data-informed',
      pressing_intensity: 'Moderate-high',
      build_preference: 'Pragmatic — adapts to squad',
      leadership_style: 'High energy, culture-first, exceptional man-manager',
      languages: ['Danish', 'English'],
      preferred_systems: ['4-3-3', '3-5-2'],
      tactical_identity: 'Elite at building club culture and maximising group cohesion. Excellent record relative to resources. The unknown is ceiling — has never managed at a club with Chelsea\'s expectations and resources.',
    },
    {
      name: 'Kieran McKenna',
      nationality: 'Irish',
      club_current: 'Manchester United (assistant background)',
      role_current: 'Available',
      available_status: 'Available',
      reputation_tier: 'Tier 2 – elite trajectory, limited top-level experience',
      wage_expectation: '£3M–£5M pa',
      staff_cost_estimate: '£1M–£2M pa',
      preferred_style: 'Structured, progressive, data-literate',
      pressing_intensity: 'High',
      build_preference: 'Build from back, positional principles',
      leadership_style: 'Calm, composed, intellectually led. Exceptional at player relationships.',
      languages: ['English'],
      preferred_systems: ['4-2-3-1', '3-4-3'],
      tactical_identity: 'One of the most highly regarded young coaches in the game. Transformed Ipswich Town from League One to Premier League. Still developing at the very highest level — this appointment would be a step up. Long-term upside is significant.',
    },
  ]

  const coachIds: Record<string, string> = {}
  for (const c of coachDefs) {
    const { data: existing } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', c.name)
      .maybeSingle()

    if (existing) {
      coachIds[c.name] = existing.id
      log.push(`Coach ${c.name} already exists`)
    } else {
      const { data: inserted, error } = await supabase
        .from('coaches')
        .insert({ ...c, user_id: user.id })
        .select('id')
        .single()
      if (inserted) {
        coachIds[c.name] = inserted.id
        log.push(`Coach ${c.name} created`)
      } else {
        log.push(`Error creating ${c.name}: ${error?.message}`)
      }
    }
  }

  // ── 4. Create mandate ──────────────────────────────────────────────────────
  const { data: existingMandate } = await supabase
    .from('mandates')
    .select('id')
    .eq('user_id', user.id)
    .eq('club_id', CHELSEA_ID)
    .eq('strategic_objective', 'Head Coach appointment — rebuild identity and return to top 4 following a period of significant managerial instability.')
    .maybeSingle()

  let mandateId: string
  if (existingMandate) {
    mandateId = existingMandate.id
    log.push('Mandate already exists')
  } else {
    const { data: mandate, error } = await supabase
      .from('mandates')
      .insert({
        user_id: user.id,
        club_id: CHELSEA_ID,
        status: 'Active',
        priority: 'High',
        pipeline_stage: 'shortlisting',
        board_risk_appetite: 'Moderate',
        budget_band: '£5M–£8M pa',
        ownership_structure: 'Private',
        confidentiality_level: 'Board Only',
        strategic_objective: 'Head Coach appointment — rebuild identity and return to top 4 following a period of significant managerial instability.',
        succession_timeline: 'Appointment required within 6–8 weeks. Preseason preparation is critical — the new coach must have adequate time with the squad before competitive fixtures.',
        engagement_date: '2026-03-01',
        target_completion_date: '2026-05-15',
        key_stakeholders: ['Owner', 'Sporting Director', 'CEO'],
        tactical_model_required: 'Possession-based, progressive build-up with clear positional principles',
        pressing_intensity_required: 'High',
        build_preference_required: 'Build from back',
        leadership_profile_required: 'Experienced under scrutiny, strong man-manager, able to handle high-profile squad dynamics',
        relocation_required: false,
        language_requirements: ['English'],
      })
      .select('id')
      .single()

    if (mandate) {
      mandateId = mandate.id
      log.push('Mandate created')
    } else {
      return NextResponse.json({ error: `Mandate creation failed: ${error?.message}`, log }, { status: 500 })
    }
  }

  // ── 5. Add candidates to shortlist ────────────────────────────────────────
  const candidates = [
    {
      name: 'Oliver Glasner',
      candidate_stage: 'Shortlist',
      placement_probability: 72,
      risk_rating: 'Medium',
      status: 'Under Review',
      network_source: 'Direct recommendation',
      network_recommender: 'James Pearce, agent intermediary',
      network_relationship: 'Indirect',
      fit_tactical: 'Strong',
      fit_cultural: 'Moderate',
      fit_level: 'Strong',
      fit_communication: 'Strong',
      fit_network: 'Moderate',
      fit_notes: 'Glasner\'s 4-2-3-1 / 4-3-3 system maps well onto Chelsea\'s squad profile. His Premier League track record (FA Cup winner, consistent overperformance at Palace) is directly relevant. Main question is cultural fit — managing board expectations at a club of this size is a step up from Palace. His reserved style contrasts with the high-media environment. Considered the lowest-risk high-quality option on the shortlist.',
    },
    {
      name: 'Roberto De Zerbi',
      candidate_stage: 'Shortlist',
      placement_probability: 58,
      risk_rating: 'High',
      status: 'Under Review',
      network_source: 'Network suggestion',
      network_recommender: 'Paul Stretford, via European agent network',
      network_relationship: 'Indirect',
      fit_tactical: 'Strong',
      fit_cultural: 'Weak',
      fit_level: 'Moderate',
      fit_communication: 'Moderate',
      fit_network: 'Strong',
      fit_notes: 'De Zerbi represents the highest tactical ceiling on the list. His positional play system would transform Chelsea\'s identity. Concern: cultural fit is a significant risk given documented tensions at Brighton over transfer policy and board interference. Chelsea\'s environment is even more demanding. Would require cast-iron guarantees around squad control and transfer strategy before appointment. Language is a secondary barrier. High upside, elevated structural risk.',
    },
    {
      name: 'Thomas Frank',
      candidate_stage: 'Longlist',
      placement_probability: 44,
      risk_rating: 'Low',
      status: 'Under Review',
      network_source: 'Direct recommendation',
      network_recommender: 'Steve Hitchen, via Premier League contacts',
      network_relationship: 'Direct',
      fit_tactical: 'Moderate',
      fit_cultural: 'Strong',
      fit_level: 'Moderate',
      fit_communication: 'Strong',
      fit_network: 'Moderate',
      fit_notes: 'Frank builds exceptional team cultures and has consistently overachieved relative to resource. His players trust him and he avoids unnecessary friction. The ceiling question is real — he has never managed a squad or environment of this complexity. His direct-transition style may not suit the technical demands of a top-4 squad. Probability rating reflects talent ceiling uncertainty rather than character risk. Worth keeping as a fallback if tier-1 targets cannot be secured.',
    },
    {
      name: 'Kieran McKenna',
      candidate_stage: 'Longlist',
      placement_probability: 30,
      risk_rating: 'Medium',
      status: 'Under Review',
      network_source: 'Data search',
      network_recommender: 'Internal analysis',
      network_relationship: 'Cold',
      fit_tactical: 'Moderate',
      fit_cultural: 'Strong',
      fit_level: 'Weak',
      fit_communication: 'Strong',
      fit_network: 'Moderate',
      fit_notes: 'McKenna is one of the most exciting coaching talents in the country and the long-term upside is significant. However, this appointment would be a step up in complexity that his experience may not yet support. His single Premier League season at Ipswich was positive but brief. Chelsea\'s board impatience pattern dramatically increases risk for a developing manager. Recommend revisiting in 12–18 months once he has navigated a full top-flight season with a resource-constrained club.',
    },
  ]

  for (const c of candidates) {
    const coachId = coachIds[c.name]
    if (!coachId) { log.push(`Skipping ${c.name} — no coach ID`); continue }

    const { data: existing } = await supabase
      .from('mandate_shortlist')
      .select('id')
      .eq('mandate_id', mandateId)
      .eq('coach_id', coachId)
      .maybeSingle()

    if (existing) {
      log.push(`${c.name} already on shortlist`)
      continue
    }

    const { error } = await supabase.from('mandate_shortlist').insert({
      mandate_id: mandateId,
      coach_id: coachId,
      candidate_stage: c.candidate_stage,
      placement_probability: c.placement_probability,
      risk_rating: c.risk_rating,
      status: c.status,
      network_source: c.network_source,
      network_recommender: c.network_recommender,
      network_relationship: c.network_relationship,
      fit_tactical: c.fit_tactical,
      fit_cultural: c.fit_cultural,
      fit_level: c.fit_level,
      fit_communication: c.fit_communication,
      fit_network: c.fit_network,
      fit_notes: c.fit_notes,
    })
    log.push(error ? `Error adding ${c.name}: ${error.message}` : `${c.name} added to shortlist`)
  }

  return NextResponse.json({ ok: true, mandateId, log })
}
