import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const COACHES = [
  {
    profile: {
      name: 'Thomas Tuchel',
      nationality: 'German',
      date_of_birth: '1973-08-29',
      base_location: 'London, England',
      languages: ['German', 'English', 'French'],
      role_current: 'National Team Head Coach',
      available_status: 'Under Contract',
      availability_status: 'Under Contract',
      market_status: 'Not Available',
      reputation_tier: 'World-class',
      preferred_style: 'Possession-based',
      pressing_intensity: 'High',
      build_preference: 'Build from back',
      leadership_style: 'Demanding',
      wage_expectation: '£4m+',
      staff_cost_estimate: '£500k - £1m',
      compensation_expectation: '£4m+',
      tactical_identity: 'High-intensity possession football with aggressive pressing and fluid positional rotations. Renowned for asymmetric structures and adaptability mid-game.',
      preferred_systems: ['4-2-3-1', '3-4-2-1', '4-3-3'],
      league_experience: ['Bundesliga', 'Ligue 1', 'Premier League', 'International'],
      overall_manual_score: 91,
      intelligence_confidence: 88,
      tactical_fit_score: 92,
      leadership_score: 88,
      development_score: 78,
      cultural_alignment_score: 80,
      safeguarding_risk_flag: false,
      integrity_risk_flag: false,
      legal_risk_flag: false,
    },
    stints: [
      {
        club_name: 'FC Augsburg',
        role_title: 'Head Coach',
        league: 'Bundesliga',
        country: 'Germany',
        started_on: '2007-08-01',
        ended_on: '2008-12-01',
        points_per_game: 1.20,
        win_rate: 30.00,
        exit_context: 'Dismissed — poor early results in top flight',
        notable_outcomes: 'First senior head coach role; left mid-season',
      },
      {
        club_name: '1. FSV Mainz 05',
        role_title: 'Head Coach',
        league: 'Bundesliga',
        country: 'Germany',
        started_on: '2009-08-01',
        ended_on: '2014-05-31',
        points_per_game: 1.62,
        win_rate: 43.00,
        exit_context: 'Contract ended — mutual decision after cup exit row',
        notable_outcomes: 'Took Mainz to highest ever Bundesliga finish (5th). Established reputation as tactician.',
      },
      {
        club_name: 'Borussia Dortmund',
        role_title: 'Head Coach',
        league: 'Bundesliga',
        country: 'Germany',
        started_on: '2015-07-01',
        ended_on: '2017-05-31',
        points_per_game: 1.88,
        win_rate: 55.00,
        exit_context: 'Mutual departure — reported dressing room tensions',
        notable_outcomes: 'DFB-Pokal winner 2017. UCL semi-final 2016. Implemented high-press system post-Klopp.',
      },
      {
        club_name: 'Paris Saint-Germain',
        role_title: 'Head Coach',
        league: 'Ligue 1',
        country: 'France',
        started_on: '2018-07-01',
        ended_on: '2020-12-23',
        points_per_game: 2.22,
        win_rate: 72.00,
        exit_context: 'Dismissed despite UCL Final — reported disagreements with board',
        notable_outcomes: 'Champions League Final 2020. Ligue 1 winner 2019/20. Transformed PSG\'s European approach.',
      },
      {
        club_name: 'Chelsea',
        role_title: 'Head Coach',
        league: 'Premier League',
        country: 'England',
        started_on: '2021-01-26',
        ended_on: '2022-09-07',
        points_per_game: 2.12,
        win_rate: 62.00,
        exit_context: 'Dismissed — reported breakdown with new ownership',
        notable_outcomes: 'UEFA Champions League winner 2020/21. UEFA Super Cup. FIFA Club World Cup.',
      },
      {
        club_name: 'Bayern Munich',
        role_title: 'Head Coach',
        league: 'Bundesliga',
        country: 'Germany',
        started_on: '2023-03-24',
        ended_on: '2024-02-04',
        points_per_game: 2.15,
        win_rate: 64.00,
        exit_context: 'Dismissed — first trophyless season in over a decade',
        notable_outcomes: 'UCL semi-final. Bundesliga title race lost on final day.',
      },
      {
        club_name: 'England National Team',
        role_title: 'Head Coach',
        league: 'International',
        country: 'England',
        started_on: '2024-10-01',
        ended_on: null,
        points_per_game: null,
        win_rate: null,
        exit_context: null,
        notable_outcomes: 'Appointed following EURO 2024. First non-English manager in role since Eriksson.',
      },
    ],
  },
  {
    profile: {
      name: 'Mauricio Pochettino',
      nationality: 'Argentine',
      date_of_birth: '1972-03-02',
      base_location: 'London, England',
      languages: ['Spanish', 'English'],
      role_current: 'Head Coach',
      available_status: 'Available',
      availability_status: 'Available',
      market_status: 'Open to offers',
      reputation_tier: 'Elite',
      preferred_style: 'High press',
      pressing_intensity: 'Very high',
      build_preference: 'Build from back',
      leadership_style: 'Inspirational',
      wage_expectation: '£4m+',
      staff_cost_estimate: '£500k - £1m',
      compensation_expectation: '£4m+',
      tactical_identity: 'Relentless high press with vertical, direct transitions. Places huge emphasis on physical intensity and collective identity. Known for developing young talent into elite performers.',
      preferred_systems: ['4-2-3-1', '4-3-3', '3-4-1-2'],
      league_experience: ['La Liga', 'Premier League', 'Ligue 1'],
      overall_manual_score: 87,
      intelligence_confidence: 85,
      tactical_fit_score: 88,
      leadership_score: 92,
      development_score: 90,
      cultural_alignment_score: 85,
      safeguarding_risk_flag: false,
      integrity_risk_flag: false,
      legal_risk_flag: false,
    },
    stints: [
      {
        club_name: 'Espanyol',
        role_title: 'Head Coach',
        league: 'La Liga',
        country: 'Spain',
        started_on: '2009-01-01',
        ended_on: '2012-11-22',
        points_per_game: 1.38,
        win_rate: 36.00,
        exit_context: 'Dismissed — poor run of form',
        notable_outcomes: 'Kept Espanyol competitive in La Liga. Attracted attention from Premier League clubs.',
      },
      {
        club_name: 'Southampton',
        role_title: 'Head Coach',
        league: 'Premier League',
        country: 'England',
        started_on: '2013-01-18',
        ended_on: '2014-05-31',
        points_per_game: 1.48,
        win_rate: 40.00,
        exit_context: 'Left for Tottenham — contractual agreement',
        notable_outcomes: '8th place finish. Established attractive pressing identity. Notable player development.',
      },
      {
        club_name: 'Tottenham Hotspur',
        role_title: 'Head Coach',
        league: 'Premier League',
        country: 'England',
        started_on: '2014-05-27',
        ended_on: '2019-11-19',
        points_per_game: 1.84,
        win_rate: 54.00,
        exit_context: 'Dismissed — poor start to season after UCL Final',
        notable_outcomes: 'Champions League Final 2019. Consistent top-4 finishes. New stadium delivery. Kane, Alli, Lloris era.',
      },
      {
        club_name: 'Paris Saint-Germain',
        role_title: 'Head Coach',
        league: 'Ligue 1',
        country: 'France',
        started_on: '2021-07-01',
        ended_on: '2023-07-13',
        points_per_game: 2.28,
        win_rate: 74.00,
        exit_context: 'Contract not renewed — UCL exits in Round of 16',
        notable_outcomes: 'Ligue 1 winner 2021/22. UCL Round of 16 2022 (Real Madrid elimination). Managed Mbappe, Messi, Neymar era.',
      },
      {
        club_name: 'Chelsea',
        role_title: 'Head Coach',
        league: 'Premier League',
        country: 'England',
        started_on: '2023-07-01',
        ended_on: '2024-12-31',
        points_per_game: 1.48,
        win_rate: 41.00,
        exit_context: 'Mutually agreed departure — squad instability and ownership friction',
        notable_outcomes: 'Challenging environment with 30+ player signings across tenure. Developed young squad core.',
      },
    ],
  },
  {
    profile: {
      name: 'Enzo Maresca',
      nationality: 'Italian',
      date_of_birth: '1980-02-10',
      base_location: 'London, England',
      languages: ['Italian', 'English', 'Spanish'],
      role_current: 'Head Coach',
      available_status: 'Available',
      availability_status: 'Available',
      market_status: 'Open to offers',
      reputation_tier: 'Established',
      preferred_style: 'Possession-based',
      pressing_intensity: 'High',
      build_preference: 'Build from back',
      leadership_style: 'Methodical',
      wage_expectation: '£2m - £4m/yr',
      staff_cost_estimate: '£300k - £600k',
      compensation_expectation: '£2m - £4m/yr',
      tactical_identity: 'Guardiola-influenced positional play. Demands ball dominance and controlled build-up. Player roles are highly defined within structure. Development-focused with strong academy integration philosophy.',
      preferred_systems: ['4-3-3', '4-2-3-1', '3-2-4-1'],
      league_experience: ['Championship', 'Premier League'],
      overall_manual_score: 79,
      intelligence_confidence: 76,
      tactical_fit_score: 84,
      leadership_score: 76,
      development_score: 82,
      cultural_alignment_score: 80,
      safeguarding_risk_flag: false,
      integrity_risk_flag: false,
      legal_risk_flag: false,
    },
    stints: [
      {
        club_name: 'Manchester City U21',
        role_title: 'Academy Head Coach',
        league: 'Premier League 2',
        country: 'England',
        started_on: '2020-07-01',
        ended_on: '2022-06-30',
        points_per_game: null,
        win_rate: null,
        exit_context: 'Moved to senior management',
        notable_outcomes: 'Refined positional play philosophy under Guardiola. Oversaw multiple academy promotions.',
      },
      {
        club_name: 'Leicester City',
        role_title: 'Head Coach',
        league: 'Championship',
        country: 'England',
        started_on: '2023-06-19',
        ended_on: '2024-05-31',
        points_per_game: 2.18,
        win_rate: 64.00,
        exit_context: 'Left for Chelsea — contract clause triggered',
        notable_outcomes: 'Championship winner 2023/24. 102 points. Dominant season with clear positional identity.',
      },
      {
        club_name: 'Chelsea',
        role_title: 'Head Coach',
        league: 'Premier League',
        country: 'England',
        started_on: '2024-06-01',
        ended_on: '2026-02-01',
        points_per_game: 1.88,
        win_rate: 52.00,
        exit_context: 'Dismissed — results deteriorated in second season despite strong opening campaign',
        notable_outcomes: 'Established clear positional identity in first season. Second season results proved inconsistent under board pressure.',
      },
    ],
  },
  {
    profile: {
      name: 'Graham Potter',
      nationality: 'English',
      date_of_birth: '1975-05-20',
      base_location: 'England',
      languages: ['English', 'Swedish'],
      role_current: 'Head Coach',
      available_status: 'Available',
      availability_status: 'Available',
      market_status: 'Open to offers',
      reputation_tier: 'Established',
      preferred_style: 'Possession-based',
      pressing_intensity: 'Medium',
      build_preference: 'Build from back',
      leadership_style: 'Collaborative',
      wage_expectation: '£1m - £2m/yr',
      staff_cost_estimate: '£200k - £500k',
      compensation_expectation: '£1m - £2m/yr',
      tactical_identity: 'Fluid, adaptable formations with positional freedom. Emphasises attacking from structured build-up. Known for overachieving with modest resources and strong player development record.',
      preferred_systems: ['3-4-3', '4-3-3', '3-5-2'],
      league_experience: ['Swedish Allsvenskan', 'Championship', 'Premier League'],
      overall_manual_score: 75,
      intelligence_confidence: 80,
      tactical_fit_score: 80,
      leadership_score: 78,
      development_score: 84,
      cultural_alignment_score: 88,
      safeguarding_risk_flag: false,
      integrity_risk_flag: false,
      legal_risk_flag: false,
    },
    stints: [
      {
        club_name: 'Östersunds FK',
        role_title: 'Head Coach',
        league: 'Allsvenskan',
        country: 'Sweden',
        started_on: '2011-06-01',
        ended_on: '2018-06-11',
        points_per_game: 1.55,
        win_rate: 44.00,
        exit_context: 'Left for Swansea — English football opportunity',
        notable_outcomes: 'Took Östersund from 4th division to Allsvenskan. Europa League group stage 2017/18. Swedish Cup winner.',
      },
      {
        club_name: 'Swansea City',
        role_title: 'Head Coach',
        league: 'Championship',
        country: 'England',
        started_on: '2018-06-11',
        ended_on: '2019-05-20',
        points_per_game: 1.22,
        win_rate: 32.00,
        exit_context: 'Left for Brighton — attracted by Premier League project',
        notable_outcomes: '10th place Championship finish. Established clear identity despite squad constraints.',
      },
      {
        club_name: 'Brighton & Hove Albion',
        role_title: 'Head Coach',
        league: 'Premier League',
        country: 'England',
        started_on: '2019-05-20',
        ended_on: '2022-09-06',
        points_per_game: 1.46,
        win_rate: 38.00,
        exit_context: 'Left for Chelsea — approached with permission',
        notable_outcomes: '9th place 2021/22 — highest ever PL finish. Consistent overperformance vs squad value.',
      },
      {
        club_name: 'Chelsea',
        role_title: 'Head Coach',
        league: 'Premier League',
        country: 'England',
        started_on: '2022-09-08',
        ended_on: '2023-04-02',
        points_per_game: 1.08,
        win_rate: 32.00,
        exit_context: 'Dismissed — poor results amid squad instability under new ownership',
        notable_outcomes: 'Faced exceptional instability — 10 transfers in January window. Results never reflected squad turbulence.',
      },
    ],
  },
  {
    profile: {
      name: 'Roberto De Zerbi',
      nationality: 'Italian',
      date_of_birth: '1979-06-06',
      base_location: 'Italy',
      languages: ['Italian', 'French', 'English'],
      role_current: 'Head Coach',
      available_status: 'Available',
      availability_status: 'Available',
      market_status: 'Open to offers',
      reputation_tier: 'Elite',
      preferred_style: 'Positional play',
      pressing_intensity: 'High',
      build_preference: 'Build from back',
      leadership_style: 'Visionary',
      wage_expectation: '£4m+',
      staff_cost_estimate: '£500k - £1m',
      compensation_expectation: '£4m+',
      tactical_identity: 'One of the most tactically distinctive coaches in world football. Pep-school positional play taken to an extreme — fluid rotations, positional superiority through structure, build-up from the goalkeeper. Demands very high technical standards and complete buy-in from the club.',
      preferred_systems: ['4-3-3', '3-4-2-1', '4-2-3-1'],
      league_experience: ['Serie A', 'Premier League', 'Ligue 1', 'UCL Group Stage'],
      overall_manual_score: 85,
      intelligence_confidence: 82,
      tactical_fit_score: 91,
      leadership_score: 82,
      development_score: 88,
      cultural_alignment_score: 72,
      safeguarding_risk_flag: false,
      integrity_risk_flag: false,
      legal_risk_flag: false,
    },
    stints: [
      {
        club_name: 'Benevento',
        role_title: 'Head Coach',
        league: 'Serie B',
        country: 'Italy',
        started_on: '2017-06-01',
        ended_on: '2019-05-31',
        points_per_game: 1.82,
        win_rate: 52.00,
        exit_context: 'Promoted — moved to Sassuolo after successful stint',
        notable_outcomes: 'Serie B winner 2016/17. Promoted Benevento to Serie A. Established attacking identity.',
      },
      {
        club_name: 'Sassuolo',
        role_title: 'Head Coach',
        league: 'Serie A',
        country: 'Italy',
        started_on: '2019-06-01',
        ended_on: '2021-06-05',
        points_per_game: 1.48,
        win_rate: 38.00,
        exit_context: 'Left for Shakhtar Donetsk — new challenge',
        notable_outcomes: '8th place Serie A 2020/21. Most attractive football in Italy that season. Attracted widespread attention from top European clubs.',
      },
      {
        club_name: 'Shakhtar Donetsk',
        role_title: 'Head Coach',
        league: 'Ukrainian Premier League',
        country: 'Ukraine',
        started_on: '2021-07-01',
        ended_on: '2022-05-31',
        points_per_game: 2.05,
        win_rate: 62.00,
        exit_context: 'Mutual termination — Russian invasion of Ukraine made continuation impossible',
        notable_outcomes: 'UCL group stage. Managed the club through extraordinary circumstances following the Russian invasion.',
      },
      {
        club_name: 'Brighton & Hove Albion',
        role_title: 'Head Coach',
        league: 'Premier League',
        country: 'England',
        started_on: '2022-09-16',
        ended_on: '2024-05-19',
        points_per_game: 1.72,
        win_rate: 46.00,
        exit_context: 'Contract expired — departed by mutual agreement after Europa League campaign',
        notable_outcomes: '6th place PL 2022/23 — highest ever Brighton finish. Europa League qualification. Transformed Brighton into one of Europe\'s most admired playing styles.',
      },
      {
        club_name: 'Olympique de Marseille',
        role_title: 'Head Coach',
        league: 'Ligue 1',
        country: 'France',
        started_on: '2024-07-01',
        ended_on: '2025-12-01',
        points_per_game: 1.65,
        win_rate: 44.00,
        exit_context: 'Dismissed — board/coach misalignment on recruitment and playing style implementation',
        notable_outcomes: 'Strong early UCL group stage. Playing identity clear but club structure not aligned with methodology demands.',
      },
    ],
  },
]

export async function POST() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const log: string[] = []
  const results: Record<string, { stints: number; action: string }> = {}

  for (const coach of COACHES) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('coaches')
      .select('id, name')
      .eq('name', coach.profile.name)
      .eq('user_id', user.id)
      .maybeSingle()

    let coachId: string

    if (existing) {
      coachId = existing.id
      // Also update the profile fields (status, availability etc may have changed)
      await supabase.from('coaches').update({ ...coach.profile }).eq('id', coachId)
      log.push(`[UPDATE] ${coach.profile.name} profile refreshed`)
      results[coach.profile.name] = { action: 'updated', stints: 0 }
    } else {
      const { data: inserted, error } = await supabase
        .from('coaches')
        .insert({ ...coach.profile, user_id: user.id })
        .select('id')
        .single()

      if (error || !inserted) {
        log.push(`[ERROR] ${coach.profile.name}: ${error?.message}`)
        continue
      }

      coachId = inserted.id
      log.push(`[OK] Created ${coach.profile.name} (${coachId})`)
      results[coach.profile.name] = { action: 'created', stints: 0 }
    }

    // Delete existing stints then re-insert (idempotent)
    await supabase.from('coach_stints').delete().eq('coach_id', coachId)

    const stintsToInsert = coach.stints.map(s => ({
      ...s,
      coach_id: coachId,
    }))

    const { error: stintErr } = await supabase.from('coach_stints').insert(stintsToInsert)

    if (stintErr) {
      log.push(`[ERROR] Stints for ${coach.profile.name}: ${stintErr.message}`)
    } else {
      log.push(`[OK] ${coach.stints.length} stints added for ${coach.profile.name}`)
      results[coach.profile.name].stints = coach.stints.length
    }
  }

  return NextResponse.json({ ok: true, results, log })
}
