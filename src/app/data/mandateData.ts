export interface Mandate {
  id: string;
  clubName: string;
  league: string;
  status: 'Active' | 'In Progress' | 'Completed' | 'On Hold';
  engagementDate: string;
  targetCompletionDate: string;
  priority: 'High' | 'Medium' | 'Low';
  ownershipStructure: string;
  budgetBand: string;
  strategicObjective: string;
  boardRiskAppetite: 'Conservative' | 'Moderate' | 'Aggressive';
  successionTimeline: string;
  shortlist: {
    coachId: string;
    placementProbability: number;
    riskRating: 'Low' | 'Medium' | 'High';
    status: 'Under Review' | 'Shortlisted' | 'In Negotiations' | 'Declined';
  }[];
  deliverables: {
    item: string;
    dueDate: string;
    status: 'Not Started' | 'In Progress' | 'Completed';
  }[];
  keyStakeholders: string[];
  confidentialityLevel: 'Standard' | 'High' | 'Board Only';
}

export const mockMandates: Mandate[] = [
  {
    id: 'm1',
    clubName: 'Premier League Club A',
    league: 'Premier League',
    status: 'Active',
    engagementDate: '2026-02-01',
    targetCompletionDate: '2026-02-28',
    priority: 'High',
    ownershipStructure: 'US Private Equity Consortium (Multi-club ownership)',
    budgetBand: '£3M - £5M (Annual salary + £2M compensation pool)',
    strategicObjective:
      'Immediate survival - Currently 18th position (26 points from 25 games). Board mandates minimum 40-point finish. Secondary objective: Establish sustainable mid-table foundation for 2026/27.',
    boardRiskAppetite: 'Conservative',
    successionTimeline: 'Immediate appointment required (within 14 days). Interim arrangement unacceptable to ownership.',
    shortlist: [
      { coachId: '1', placementProbability: 78, riskRating: 'Low', status: 'In Negotiations' },
      { coachId: '2', placementProbability: 65, riskRating: 'Medium', status: 'Shortlisted' },
      { coachId: '4', placementProbability: 58, riskRating: 'Low', status: 'Under Review' },
    ],
    deliverables: [
      { item: 'Executive Briefing: Top 3 Candidates', dueDate: '2026-02-16', status: 'Completed' },
      { item: 'Confidential Due Diligence Reports', dueDate: '2026-02-18', status: 'In Progress' },
      { item: 'Board Presentation Materials', dueDate: '2026-02-20', status: 'Not Started' },
      { item: 'Contract Negotiation Support', dueDate: '2026-02-25', status: 'Not Started' },
    ],
    keyStakeholders: ['Chairman (US-based)', 'Sporting Director', 'CEO', 'Ownership Representative'],
    confidentialityLevel: 'Board Only',
  },
  {
    id: 'm2',
    clubName: 'Championship Club B',
    league: 'Championship',
    status: 'In Progress',
    engagementDate: '2026-01-15',
    targetCompletionDate: '2026-05-31',
    priority: 'Medium',
    ownershipStructure: 'Family ownership (Local businessman, 20-year tenure)',
    budgetBand: '£800K - £1.2M (Annual salary, minimal compensation budget)',
    strategicObjective:
      'Playoff contention for 2026/27 season. Owner seeks modern tactical approach while respecting club traditions. Long-term project appointment.',
    boardRiskAppetite: 'Moderate',
    successionTimeline: 'End of season appointment. Current manager will see out campaign. Flexibility on start date.',
    shortlist: [
      { coachId: '3', placementProbability: 42, riskRating: 'Medium', status: 'Shortlisted' },
      { coachId: '5', placementProbability: 35, riskRating: 'High', status: 'Under Review' },
    ],
    deliverables: [
      { item: 'Market Mapping Report: 50+ Candidates', dueDate: '2026-02-28', status: 'In Progress' },
      { item: 'Longlist: 12 Candidates', dueDate: '2026-03-15', status: 'Not Started' },
      { item: 'Shortlist Interviews', dueDate: '2026-04-30', status: 'Not Started' },
    ],
    keyStakeholders: ['Owner', 'CEO', 'Head of Recruitment'],
    confidentialityLevel: 'High',
  },
  {
    id: 'm3',
    clubName: 'European Club C',
    league: 'Serie A',
    status: 'Active',
    engagementDate: '2026-02-08',
    targetCompletionDate: '2026-03-15',
    priority: 'High',
    ownershipStructure: 'Institutional investor backed (American fund, acquired 2024)',
    budgetBand: '€4M - €6M (Plus performance bonuses, compensation available)',
    strategicObjective:
      'Europa League qualification (Currently 7th). New ownership seeks data-driven modern approach. Cultural fit with Italian football critical.',
    boardRiskAppetite: 'Aggressive',
    successionTimeline: 'Winter window closure - targeting March 1st appointment to prepare for final 12 games.',
    shortlist: [
      { coachId: '1', placementProbability: 82, riskRating: 'Low', status: 'Shortlisted' },
      { coachId: '3', placementProbability: 48, riskRating: 'High', status: 'Under Review' },
    ],
    deliverables: [
      { item: 'Tactical Analysis: Top 5 Targets', dueDate: '2026-02-17', status: 'Completed' },
      { item: 'Cultural Fit Assessment', dueDate: '2026-02-22', status: 'In Progress' },
      { item: 'Final Recommendation Report', dueDate: '2026-03-01', status: 'Not Started' },
    ],
    keyStakeholders: ['General Manager', 'Sporting Director', 'Ownership Representative (US)', 'Technical Director'],
    confidentialityLevel: 'Board Only',
  },
];
