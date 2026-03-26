import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const log: string[] = []

  // ── 1. Find Tottenham ──────────────────────────────────────────────
  const { data: club } = await supabase
    .from('clubs')
    .select('id, name')
    .ilike('name', '%Tottenham%')
    .maybeSingle()

  if (!club) return NextResponse.json({ error: 'Tottenham not found in clubs table — run sync-english first' }, { status: 400 })
  log.push(`[OK] Club: ${club.name} (${club.id})`)

  // ── 2. Find the 4 showcase coaches ────────────────────────────────
  const coachNames = ['Thomas Tuchel', 'Mauricio Pochettino', 'Enzo Maresca', 'Graham Potter']
  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, name')
    .in('name', coachNames)
    .eq('user_id', user.id)

  if (!coaches || coaches.length < 4) {
    return NextResponse.json({
      error: 'Not all showcase coaches found. Run /api/demo/seed-showcase-coaches first.',
      found: coaches?.map(c => c.name),
    }, { status: 400 })
  }

  const byName = Object.fromEntries(coaches.map(c => [c.name, c.id]))
  log.push(`[OK] Coaches found: ${coaches.map(c => c.name).join(', ')}`)

  // ── 3. Delete existing showcase mandate for this club ─────────────
  const { data: existing } = await supabase
    .from('mandates')
    .select('id')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .eq('confidentiality_level', 'Board Only')
    .maybeSingle()

  if (existing) {
    await supabase.from('mandate_shortlist').delete().eq('mandate_id', existing.id)
    await supabase.from('mandates').delete().eq('id', existing.id)
    log.push(`[OK] Cleared existing mandate`)
  }

  // ── 4. Create the mandate ─────────────────────────────────────────
  const { data: mandate, error: mandateErr } = await supabase
    .from('mandates')
    .insert({
      user_id: user.id,
      club_id: club.id,
      status: 'Active',
      priority: 'High',
      pipeline_stage: 'shortlisting',
      engagement_date: '2026-02-01',
      target_completion_date: '2026-05-15',
      ownership_structure: 'ENIC Group — Daniel Levy (Chairman). Long-tenure ownership with strong commercial focus and high expectations on performance.',
      budget_band: '£10m–£15m per annum (basic). Full package competitive at elite level.',
      strategic_objective: 'Appoint a Head Coach to restore Tottenham to consistent top-6 Premier League finishes and UCL contention. The appointment must re-establish clear playing identity and rebuild trust with a talented but underperforming squad.',
      board_risk_appetite: 'Moderate',
      succession_timeline: 'Appointment required before pre-season (target: June 2026). Interim cover in place.',
      key_stakeholders: ['Daniel Levy (Chairman)', 'Johan Lange (Sporting Director)', 'ENIC Board'],
      confidentiality_level: 'Board Only',
      tactical_model_required: 'Structured, possession-led with clear attacking intent. High press preferred. Must suit a technically strong squad.',
      pressing_intensity_required: 'High',
      build_preference_required: 'Build from back',
      leadership_profile_required: 'Strong communicator. Ability to manage elite egos and media pressure. Must command respect quickly in the dressing room.',
      risk_tolerance: 'Moderate risk appetite. Board will accept a profile with mixed recent form if pedigree and project fit are strong.',
      relocation_required: true,
    })
    .select('id')
    .single()

  if (mandateErr || !mandate) {
    return NextResponse.json({ error: mandateErr?.message }, { status: 500 })
  }
  log.push(`[OK] Mandate created (${mandate.id})`)

  // ── 5. Shortlist entries ──────────────────────────────────────────
  const candidates = [
    {
      coach_id: byName['Thomas Tuchel'],
      candidate_stage: 'Final',
      status: 'Shortlisted',
      placement_probability: 68,
      risk_rating: 'Medium',
      network_source: 'Direct recommendation',
      network_recommender: 'Senior intermediary close to ENIC board',
      network_relationship: 'Indirect',
      fit_tactical: 'Strong',
      fit_level: 'Strong',
      fit_cultural: 'Moderate',
      fit_communication: 'Strong',
      fit_network: 'Strong',
      fit_notes: `Tuchel is the highest-pedigree candidate in this process. His UCL win at Chelsea (2020/21) and consistent T1 performance across PSG, Bayern and Dortmund make him the standout name on paper. His tactical system — asymmetric pressing structures, fluid build-up, high defensive line — maps closely to the profile the club requires.\n\nThe primary risk is complexity. Tuchel has a well-documented pattern of friction with ownership and sporting directors, most notably at Dortmund, PSG, Chelsea, and Bayern. At Tottenham, where the Levy relationship demands a certain deference, this needs careful management.\n\nHe is currently with the England national team, which introduces a contractual complication. However, board-level interest has been signalled. If the project brief resonates, he is moveable.\n\nRecommendation: Lead candidate. Proceed to direct conversation if board appetite confirmed.`,
      notes: 'UCL winner. Confirmed interest via intermediary. Contractual position needs resolving.',
    },
    {
      coach_id: byName['Mauricio Pochettino'],
      candidate_stage: 'Shortlist',
      status: 'Shortlisted',
      placement_probability: 54,
      risk_rating: 'Medium',
      network_source: 'Network suggestion',
      network_recommender: 'Former Spurs backroom contact',
      network_relationship: 'Direct',
      fit_tactical: 'Strong',
      fit_level: 'Strong',
      fit_cultural: 'Strong',
      fit_communication: 'Strong',
      fit_network: 'Strong',
      fit_notes: `Pochettino carries the strongest cultural fit of any candidate in this process. His 2014–2019 Tottenham tenure remains the high watermark for the club in the modern era — top-4 consistency, a UCL final, and near-universal respect from players, staff, and fanbase. The Levy relationship, while historically strained at the point of his exit, has been repaired.\n\nHis more recent record (PSG 2021–23, Chelsea 2023–24) shows mixed results, particularly at Chelsea where squad instability undermined any fair assessment. The Chelsea spell should be contextualised carefully rather than taken at face value.\n\nThe cultural risk is low. The tactical fit is strong — his high-press, vertical style would suit the current squad. The emotional narrative of a return also has commercial and fan engagement value that cannot be ignored.\n\nRecommendation: Strong shortlist candidate. Explore availability and terms. Would benefit from a clear sporting project brief from Lange.`,
      notes: 'Former Tottenham manager. Cultural fit is exceptional. Availability confirmed — open to conversations.',
    },
    {
      coach_id: byName['Enzo Maresca'],
      candidate_stage: 'Shortlist',
      status: 'Shortlisted',
      placement_probability: 46,
      risk_rating: 'Low',
      network_source: 'Data search',
      network_recommender: null,
      network_relationship: 'Cold',
      fit_tactical: 'Strong',
      fit_level: 'Moderate',
      fit_communication: 'Moderate',
      fit_cultural: 'Moderate',
      fit_network: 'Weak',
      fit_notes: `Maresca represents the most tactically aligned profile in this process with the lowest personal risk. His Championship-winning season at Leicester (102 pts, dominant positional play) and Premier League tenure at Chelsea demonstrate clear coaching quality. The Guardiola-influenced system — positional structure, ball dominance, defined player roles — would suit a technically capable Tottenham squad well.\n\nFollowing his departure from Chelsea in early 2026, he is now available and unattached, removing any rival-club complications. This is a meaningful shift in his candidacy.\n\nThe primary limitation remains level exposure — Maresca has one and a half Premier League seasons to his name. Tottenham's board have historically favoured established elite names. Appointing Maresca would require framing as a long-term project appointment, which requires board alignment.\n\nRecommendation: Active shortlist. Should be presented to the board alongside the lead candidates. Strongest tactical fit in the process and now fully available.`,
      notes: 'Now available following Chelsea departure. Best tactical fit in the group. Board framing as long-term project needed.',
    },
    {
      coach_id: byName['Graham Potter'],
      candidate_stage: 'Tracked',
      status: 'Under Review',
      placement_probability: 22,
      risk_rating: 'High',
      network_source: 'Data search',
      network_recommender: null,
      network_relationship: 'Cold',
      fit_tactical: 'Strong',
      fit_level: 'Moderate',
      fit_cultural: 'Moderate',
      fit_communication: 'Weak',
      fit_network: 'Weak',
      fit_notes: `Potter's underlying coaching quality is not in question. His Brighton record (9th place, consistent overperformance vs squad value, clear identity) demonstrated what he is capable of in an aligned environment. The problem is reputational damage from his Chelsea tenure, which — while arguably unfair given the chaos of that period — has reset market perception significantly.\n\nAt Tottenham, where media scrutiny is intense and the fanbase demands results quickly, Potter's current standing is a material risk. His public profile confidence rating is low, and there is limited network support within the current process.\n\nHis process orientation and calm leadership style would theoretically suit a rebuild, but the board's risk appetite and the timeline of this mandate make him a difficult sell at this stage.\n\nRecommendation: Keep tracked. Monitor for rehabilitation of public profile. Not suitable as a primary candidate in this cycle.`,
      notes: 'Tracked only. Strong process coach but reputational volatility is a board-level concern at this moment.',
    },
  ]

  const shortlistRows = candidates.map(c => ({
    ...c,
    mandate_id: mandate.id,
  }))

  const { error: slErr } = await supabase.from('mandate_shortlist').insert(shortlistRows)
  if (slErr) {
    return NextResponse.json({ error: `Shortlist insert failed: ${slErr.message}` }, { status: 500 })
  }
  log.push(`[OK] 4 candidates added to shortlist`)

  // ── 6. Deliverables ───────────────────────────────────────────────
  const deliverables = [
    { item: 'Confirm board shortlist approval for Tuchel approach', due_date: '2026-03-28', status: 'Not Started' },
    { item: 'Prepare candidate dossiers for presentation to Daniel Levy', due_date: '2026-04-05', status: 'Not Started' },
    { item: 'Initiate discreet conversation — Pochettino camp', due_date: '2026-04-01', status: 'In Progress' },
    { item: 'Resolve England FA contractual position re: Tuchel', due_date: '2026-04-10', status: 'Not Started' },
    { item: 'Final recommendation memo to board', due_date: '2026-05-01', status: 'Not Started' },
  ]

  const { error: delErr } = await supabase.from('mandate_deliverables').insert(
    deliverables.map(d => ({ ...d, mandate_id: mandate.id }))
  )
  if (delErr) log.push(`[WARN] Deliverables failed: ${delErr.message}`)
  else log.push(`[OK] 5 deliverables added`)

  return NextResponse.json({
    ok: true,
    mandateId: mandate.id,
    club: club.name,
    coaches: candidates.map(c => ({
      name: coaches.find(x => x.id === c.coach_id)?.name,
      stage: c.candidate_stage,
      probability: c.placement_probability,
      recommendation: c.candidate_stage === 'Final' ? 'Lead candidate' :
        c.candidate_stage === 'Shortlist' ? 'Active consideration' : 'Tracked',
    })),
    log,
  })
}
