import type { FinalEvaluation } from './deep-dive'

// Final-evaluation worked examples for the coaches at the top of the Tottenham and Coventry
// lists, so the Coach ID report shows the whole shape of Rasmus's final page. Every one is
// labelled "Demo assessment — illustrative": the SWOT, fit and risk lines are analyst drafting
// from public material, not checked evidence. Budgets are the mandate's planning envelopes.

const TOTTENHAM = '09420a64-b4d2-4245-8088-af0dc88266eb'
const COVENTRY = 'c07e4a2e-0915-4bd1-9f3a-2026091500c1'
const GASPERINI = '845b9087-2dac-49fd-8ec5-6b20079e620e'
const SARRI = '0c39a76f-ca3d-43d1-9b7e-3a1b72386b17'
const FRANK = 'cbb4141b-abb1-41cb-ab33-93f5f43e580b'
const MCKENNA = 'c04c8747-bda1-4c95-a1ad-ed82af70c31d'
const PARKER = '5822462f-f83f-481f-824c-e015e45578eb'

const budget = (salary: string, staff: string, compensation: string, total: string) => [
  { item: 'Head coach salary (a year)', value: salary },
  { item: 'Backroom staff (a year)', value: staff },
  { item: 'Compensation to his club', value: compensation },
  { item: 'Total first-year cost', value: total },
]
const DEMO = 'Demo assessment — illustrative.'

export const MEETING_FINAL_EVALUATIONS: Record<string, FinalEvaluation> = {
  [`${TOTTENHAM}:${GASPERINI}`]: {
    executiveSummary: `${DEMO} Gasperini is 1st on the brief: the same football on all four requirements as the others at the top, ahead on what the match data shows (56% possession, 58% of the xG at Roma in 2025/26) with a European trophy on his record. He is in a job at Roma on a three-year deal from June 2025; the release route is unknown. The open questions are age and timescale, the runners his football needs, and how he works with a sporting director who controls recruitment.`,
    swot: { strengths: ['Same identity as the brief, backed by match data', 'European trophy with Atalanta', 'Improves players through the system'], weaknesses: ['Hard on staff after defeats (fictional reference, draft)', 'Needs runners the squad may not have', 'No English club on his record'], opportunities: ['Spurs’ wide players suit his shape', 'A clear identity the fans would recognise'], threats: ['Roma will not release him cheaply mid-season', 'Age and a short horizon for a rebuild'] },
    organisationalFit: `${DEMO} Best with a sporting director who backs him publicly; worst where recruitment is done over his head (fictional reference). Whether Tottenham’s structure gives him that is a question for the interview.`,
    budget: budget('£5m–£7m (planning figure)', '£2m–£3m (planning figure)', 'Unknown — requires network diligence', 'Unknown until compensation is known'),
    budgetNote: 'Planning envelopes from the demonstration brief. No salary, clause or willingness has been verified.',
    risks: [
      { risk: 'Roma refuse a mid-season release', likelihood: 'High', impact: 'High', mitigation: 'Establish the route club-to-club before anything else; a summer window may be the only realistic one.' },
      { risk: 'Squad lacks the runners his football needs', likelihood: 'Medium', impact: 'High', mitigation: 'Match-footage review of the current squad against his Roma and Atalanta shapes.' },
      { risk: 'Friction with staff after poor results', likelihood: 'Medium', impact: 'Medium', mitigation: 'Test with two more independent references; one voice is not a pattern.' },
    ],
    probabilityOfSuccess: 0,
    probabilityRationale: 'Not used. Gaffa does not calculate a probability of success.',
  },
  [`${TOTTENHAM}:${SARRI}`]: {
    executiveSummary: `${DEMO} Sarri is 2nd on the brief: possession, short build-up and a high press, with a European trophy (Chelsea, 2019) and a Serie A title. The match data behind him is Lazio 2025/26 — 50% possession and 1.12 xG for per match — weaker than Gasperini’s and Knutsen’s. He joined Atalanta on 15 June 2026 on a three-year deal, so the release route is unknown. Premier League experience is a strength; adaptability and man-management are the questions.`,
    swot: { strengths: ['Knows the Premier League (Chelsea 2018/19, Europa League winner)', 'Clear, repeatable game model', 'Serie A title at Juventus'], weaknesses: ['Lazio 2025/26 numbers below the brief’s front-foot bar', 'Slow to change the model', 'Left Chelsea after one season'], opportunities: ['Short build-up suits the current squad profile'], threats: ['Three months into an Atalanta contract', 'English media scrutiny of a rigid system'] },
    organisationalFit: `${DEMO} Works best with a squad built for his system and a board that accepts a fixed model. Fit with a sporting-director structure is untested here.`,
    budget: budget('£5m–£7m (planning figure)', '£2m–£3m (planning figure)', 'Unknown — requires network diligence', 'Unknown until compensation is known'),
    budgetNote: 'Planning envelopes from the demonstration brief. No salary, clause or willingness has been verified.',
    risks: [
      { risk: 'Atalanta contract signed June 2026', likelihood: 'High', impact: 'High', mitigation: 'No approach without a verified route; treat as a summer option.' },
      { risk: 'Rigid model if the squad does not fit', likelihood: 'Medium', impact: 'Medium', mitigation: 'Interview question on adapting the model; references from Chelsea-era staff.' },
    ],
    probabilityOfSuccess: 0,
    probabilityRationale: 'Not used. Gaffa does not calculate a probability of success.',
  },
  [`${COVENTRY}:${FRANK}`]: {
    executiveSummary: `${DEMO} Frank is 4th on the survival calculation but the analyst’s first name to test: he took Brentford up in 2021 and kept them in the Premier League for four seasons on one of the division’s smallest budgets, and he is out of work since leaving Tottenham in February 2026. The calculation places him below Parker, Marcelino and McKenna because Brentford’s 2024/25 defensive number (1.48 xG against per match) is weaker than theirs — but those are Championship or La Liga numbers, and his are Premier League numbers. Appetite to return mid-season, and whether a relegation fight appeals after Tottenham, are unknown.`,
    swot: { strengths: ['Four Premier League seasons after promotion on a small budget', 'Adaptable: back four or back three, with or without the ball', 'English football throughout; no relocation question'], weaknesses: ['Tottenham spell ended after eight games without a win', 'Brentford’s defensive numbers were mid-table, not elite'], opportunities: ['Coventry’s direct, set-piece profile resembles his Brentford sides', 'Unattached — no compensation'], threats: ['May prefer to wait for a bigger job', 'Mid-season start with a squad that has not scored'] },
    organisationalFit: `${DEMO} Comfortable in a data-led recruitment structure (Brentford). Fit with an owner-led board and a new sporting director is untested; ask both sides.`,
    budget: budget('Unknown — requires network diligence', 'Unknown — requires network diligence', 'None — out of contract (Sky Sports, 5 June 2026)', 'Unknown'),
    budgetNote: 'Coventry’s envelope is an analyst assumption to be confirmed by the club. No figure has been discussed with anyone.',
    risks: [
      { risk: 'Does not want a relegation fight now', likelihood: 'Medium', impact: 'High', mitigation: 'Interest is the first question, through his representative, only once the club authorises an approach.' },
      { risk: 'Goals do not come quickly enough', likelihood: 'Medium', impact: 'High', mitigation: 'A first-month plan built on set pieces and transitions, which the squad already does.' },
      { risk: 'Staff continuity', likelihood: 'Low', impact: 'Medium', mitigation: 'Agree which of the current staff stay before any appointment.' },
    ],
    probabilityOfSuccess: 0,
    probabilityRationale: 'Not used. Gaffa does not calculate a probability of success.',
  },
  [`${COVENTRY}:${MCKENNA}`]: {
    executiveSummary: `${DEMO} McKenna is 3rd on the survival calculation: two promotions with Ipswich, one Premier League season (relegated in 2024/25), and strong chance-creation numbers in the 2025/26 Championship (1.71 xG for per match). He stepped down at Ipswich on 10 June 2026 to take a break from football and declined Fulham; whether he wants to return in September is the first unknown. His possession-and-press identity scores low on pragmatism here — the question is whether he can defend a lead with this squad.`,
    swot: { strengths: ['Two promotions; clear, teachable model', 'Develops players and trusts young ones', 'Unattached — no compensation'], weaknesses: ['Relegated with Ipswich in 2024/25', 'Front-foot model may be the wrong tool for a survival fight'], opportunities: ['Knows the Championship market Coventry recruited from'], threats: ['Publicly on a break — may say no', 'A second relegation would hurt his standing'] },
    organisationalFit: `${DEMO} Best with a sporting director who owns recruitment and gives him time; a results-now board is a risk for both sides.`,
    budget: budget('Unknown — requires network diligence', 'Unknown — requires network diligence', 'None — stepped down (Sky Sports, 10 June 2026)', 'Unknown'),
    budgetNote: 'Coventry’s envelope is an analyst assumption to be confirmed by the club. No figure has been discussed with anyone.',
    risks: [
      { risk: 'Not ready to return', likelihood: 'High', impact: 'High', mitigation: 'Ask before anything else; do not plan around him until answered.' },
      { risk: 'Model too open for a survival fight', likelihood: 'Medium', impact: 'High', mitigation: 'Interview on defending leads; footage of Ipswich’s Premier League season.' },
    ],
    probabilityOfSuccess: 0,
    probabilityRationale: 'Not used. Gaffa does not calculate a probability of success.',
  },
  [`${COVENTRY}:${PARKER}`]: {
    executiveSummary: `${DEMO} Parker is 1st on the survival calculation on the strength of Burnley’s 2024/25 Championship defence (0.81 xG against per match, 46 matches) and three promotions. The analyst holds him: the number that puts him first is a Championship number, and his three Premier League spells ended in relegation (Fulham 2020/21), dismissal (Bournemouth, August 2022) and relegation (Burnley 2025/26, four wins in 34). He left Burnley on 30 April 2026 and is unattached. Strong fit on paper; the nine areas have to answer whether the top-flight record is bad luck, bad squads or the coach.`,
    swot: { strengths: ['Record Championship defence at Burnley', 'Three promotions from three different clubs', 'Unattached — no compensation'], weaknesses: ['Three Premier League spells, none survived', 'Possession-heavy Championship model did not translate up'], opportunities: ['Knows the promoted-club problem better than anyone on the list'], threats: ['Supporter and media reaction to a fourth attempt', 'Confidence after Burnley'] },
    organisationalFit: `${DEMO} Fit with an owner-led board is untested. References from Burnley and Fulham on how he handled the top-flight seasons are the priority.`,
    budget: budget('Unknown — requires network diligence', 'Unknown — requires network diligence', 'None — left by mutual consent (ESPN, 30 April 2026)', 'Unknown'),
    budgetNote: 'Coventry’s envelope is an analyst assumption to be confirmed by the club. No figure has been discussed with anyone.',
    risks: [
      { risk: 'Premier League record repeats', likelihood: 'Medium', impact: 'High', mitigation: 'References from Burnley and Fulham; interview on what he would do differently.' },
      { risk: 'Supporters reject the appointment', likelihood: 'Medium', impact: 'Medium', mitigation: 'Board communication plan before any announcement.' },
    ],
    probabilityOfSuccess: 0,
    probabilityRationale: 'Not used. Gaffa does not calculate a probability of success.',
  },
}
