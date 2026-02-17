export interface MockCoach {
  id: string;
  name: string;
  age: number;
  nationality: string;
  currentClub: string | null;
  currentLeague: string | null;
  previousClubs: string[];
  overallFit: number;
  tacticalFit: number;
  financialFeasibility: number;
  boardCompatibility: number;
  ownershipFit: number;
  culturalRisk: 'Low' | 'Medium' | 'High';
  agentRelationship: 'Strong' | 'Established' | 'Limited' | 'Unknown';
  mediaRisk: 'Low' | 'Medium' | 'High';
  placementScore: number;
  availability: 'Available' | 'Employed' | 'Negotiable';
  preferredFormation: string;
  playingStyle: string[];
  leadershipStyle: string;
  wageExpectation: string;
  contractStatus: string;
  compensationRequired: string | null;
  staffPackage: boolean;
  careerStats: {
    totalMatches: number;
    winRate: number;
    trophies: number;
    promotions: number;
  };
  tacticalIdentity: {
    philosophy: string;
    buildUpStyle: string;
    defensiveApproach: string;
    pressureStyle: string;
  };
  staffStructure: {
    assistantCoaches: number;
    analysts: number;
    fitnessStaff: number;
  };
  intelligenceNotes: string[];
  recentNews: string[];
  agentDetails?: {
    name: string;
    relationship: string;
    notes: string;
  };
}

export interface MockIntelligenceUpdate {
  id: string;
  date: string;
  type: 'availability' | 'performance' | 'contract' | 'reputation';
  coachId: string;
  coachName: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export const mockCoaches: MockCoach[] = [
  {
    id: '1',
    name: 'Marco Benedetti',
    age: 52,
    nationality: 'Italy',
    currentClub: null,
    currentLeague: null,
    previousClubs: ['AS Roma', 'Sevilla FC', 'Olympique Lyon'],
    overallFit: 94,
    tacticalFit: 96,
    financialFeasibility: 89,
    boardCompatibility: 90,
    ownershipFit: 85,
    culturalRisk: 'Medium',
    agentRelationship: 'Strong',
    mediaRisk: 'Low',
    placementScore: 92,
    availability: 'Available',
    preferredFormation: '4-3-3',
    playingStyle: ['Possession-based', 'High press', 'Vertical passing'],
    leadershipStyle: 'Collaborative, Demanding',
    wageExpectation: '£4.5M - £5.5M per year',
    contractStatus: 'Free agent since December 2025',
    compensationRequired: null,
    staffPackage: true,
    careerStats: { totalMatches: 412, winRate: 58.7, trophies: 5, promotions: 0 },
    tacticalIdentity: {
      philosophy: 'Positional play with aggressive pressing in attacking third',
      buildUpStyle: 'Patient build-up through thirds with inverted fullbacks',
      defensiveApproach: 'High defensive line with coordinated pressing traps',
      pressureStyle: 'Immediate counter-press after possession loss',
    },
    staffStructure: { assistantCoaches: 3, analysts: 2, fitnessStaff: 2 },
    intelligenceNotes: [
      'Strong track record developing young talent while competing for titles',
      'Previously interviewed by Premier League clubs - understands English football culture',
      'Known for excellent relationship with sporting directors',
    ],
    recentNews: [
      'Left Roma by mutual consent after Europa League exit',
      'In advanced talks with Premier League clubs',
    ],
    agentDetails: { name: 'Giuseppe Rossi', relationship: 'Strong', notes: 'Agent has extensive experience in English football.' },
  },
  {
    id: '2',
    name: 'Thomas Kleinhans',
    age: 47,
    nationality: 'Germany',
    currentClub: 'FC Augsburg',
    currentLeague: 'Bundesliga',
    previousClubs: ['Mainz 05', 'FC Köln'],
    overallFit: 88,
    tacticalFit: 92,
    financialFeasibility: 78,
    boardCompatibility: 85,
    ownershipFit: 80,
    culturalRisk: 'Low',
    agentRelationship: 'Established',
    mediaRisk: 'Medium',
    placementScore: 88,
    availability: 'Negotiable',
    preferredFormation: '3-4-2-1',
    playingStyle: ['Counter-attacking', 'Defensive solidity', 'Set-piece focus'],
    leadershipStyle: 'Pragmatic, Disciplined',
    wageExpectation: '£3.8M - £4.8M per year',
    contractStatus: 'Under contract until June 2026',
    compensationRequired: 'Est. £1.2M release clause',
    staffPackage: false,
    careerStats: { totalMatches: 358, winRate: 45.3, trophies: 1, promotions: 2 },
    tacticalIdentity: {
      philosophy: 'Organized defensive structure with quick transitions',
      buildUpStyle: 'Direct play with quick vertical passes to forwards',
      defensiveApproach: 'Compact mid-block with disciplined shape',
      pressureStyle: 'Selective pressing in key areas',
    },
    staffStructure: { assistantCoaches: 2, analysts: 3, fitnessStaff: 1 },
    intelligenceNotes: [
      'Expert at improving defensive records and team organization',
      'Overachieved at Augsburg with limited resources',
      'Release clause believed to be £1.2M',
    ],
    recentNews: ['Augsburg currently 8th in Bundesliga', 'Contract extension talks stalled'],
    agentDetails: { name: 'Jürgen Müller', relationship: 'Established', notes: 'Well-connected in German football.' },
  },
  {
    id: '3',
    name: 'Sarah Vandenberg',
    age: 44,
    nationality: 'Netherlands',
    currentClub: 'Ajax Women',
    currentLeague: 'Eredivisie',
    previousClubs: ['FC Twente', 'PSV Eindhoven'],
    overallFit: 91,
    tacticalFit: 94,
    financialFeasibility: 92,
    boardCompatibility: 88,
    ownershipFit: 85,
    culturalRisk: 'Medium',
    agentRelationship: 'Limited',
    mediaRisk: 'High',
    placementScore: 90,
    availability: 'Negotiable',
    preferredFormation: '4-2-3-1',
    playingStyle: ['Attacking football', 'Youth development', 'Technical focus'],
    leadershipStyle: 'Innovative, Player-focused',
    wageExpectation: '£3.2M - £4.2M per year',
    contractStatus: 'Under contract until June 2026',
    compensationRequired: 'Minimal - Ajax supportive',
    staffPackage: true,
    careerStats: { totalMatches: 298, winRate: 62.4, trophies: 6, promotions: 0 },
    tacticalIdentity: {
      philosophy: 'Total football principles with modern pressing elements',
      buildUpStyle: 'Technical possession through all lines',
      defensiveApproach: 'Aggressive high press with compact defensive shape',
      pressureStyle: 'Team-wide coordinated pressing system',
    },
    staffStructure: { assistantCoaches: 2, analysts: 3, fitnessStaff: 2 },
    intelligenceNotes: [
      'Pioneering tactical approach transferable to men\'s football',
      'Open to transition to men\'s football at right club',
    ],
    recentNews: ['Won Dutch league and cup double last season'],
    agentDetails: { name: 'Anita van der Velden', relationship: 'Limited', notes: 'Well-connected in Dutch football.' },
  },
  {
    id: '4',
    name: 'Carlos Dominguez',
    age: 56,
    nationality: 'Spain',
    currentClub: null,
    currentLeague: null,
    previousClubs: ['Real Betis', 'Valencia CF', 'Celta Vigo'],
    overallFit: 82,
    tacticalFit: 85,
    financialFeasibility: 95,
    boardCompatibility: 80,
    ownershipFit: 75,
    culturalRisk: 'High',
    agentRelationship: 'Unknown',
    mediaRisk: 'Low',
    placementScore: 85,
    availability: 'Available',
    preferredFormation: '4-4-2',
    playingStyle: ['Balanced approach', 'Experienced', 'Flexible tactics'],
    leadershipStyle: 'Authoritative, Traditional',
    wageExpectation: '£2.8M - £3.5M per year',
    contractStatus: 'Free agent since May 2025',
    compensationRequired: null,
    staffPackage: false,
    careerStats: { totalMatches: 521, winRate: 48.9, trophies: 2, promotions: 1 },
    tacticalIdentity: {
      philosophy: 'Pragmatic approach adapting to squad strengths',
      buildUpStyle: 'Varied - can play possession or direct based on opposition',
      defensiveApproach: 'Flexible between high and mid-block',
      pressureStyle: 'Selective pressing with emphasis on defensive stability',
    },
    staffStructure: { assistantCoaches: 2, analysts: 1, fitnessStaff: 1 },
    intelligenceNotes: ['Vast experience with 20+ years in management', 'Lower wage demands make him financially attractive'],
    recentNews: ['Available immediately after Valencia departure'],
    agentDetails: { name: 'Pedro Martínez', relationship: 'Unknown', notes: 'Well-connected in Spanish football.' },
  },
  {
    id: '5',
    name: 'Patrick McAllister',
    age: 41,
    nationality: 'Scotland',
    currentClub: 'Rangers',
    currentLeague: 'Scottish Premiership',
    previousClubs: ['Hibernian', 'Aberdeen'],
    overallFit: 86,
    tacticalFit: 89,
    financialFeasibility: 84,
    boardCompatibility: 85,
    ownershipFit: 80,
    culturalRisk: 'Low',
    agentRelationship: 'Strong',
    mediaRisk: 'Medium',
    placementScore: 87,
    availability: 'Employed',
    preferredFormation: '4-3-3',
    playingStyle: ['High intensity', 'Direct play', 'Physical approach'],
    leadershipStyle: 'Passionate, Motivational',
    wageExpectation: '£4.0M - £5.0M per year',
    contractStatus: 'Under contract until June 2027',
    compensationRequired: 'Est. £3-4M required',
    staffPackage: true,
    careerStats: { totalMatches: 267, winRate: 55.8, trophies: 3, promotions: 0 },
    tacticalIdentity: {
      philosophy: 'High-tempo attacking football with emphasis on winning mentality',
      buildUpStyle: 'Direct vertical play with quick ball progression',
      defensiveApproach: 'Aggressive pressing from front to back',
      pressureStyle: 'High-intensity team pressing throughout match',
    },
    staffStructure: { assistantCoaches: 3, analysts: 2, fitnessStaff: 2 },
    intelligenceNotes: ['Rising star in British coaching - highly regarded by peers', 'Rangers would demand significant compensation'],
    recentNews: ['Leading Rangers in Europa League knockout stages'],
    agentDetails: { name: 'David McAllister', relationship: 'Strong', notes: 'Well-connected in Scottish football.' },
  },
];

export const mockIntelligence: MockIntelligenceUpdate[] = [
  {
    id: 'i1',
    date: '2026-02-14T10:30:00',
    type: 'availability',
    coachId: '1',
    coachName: 'Marco Benedetti',
    title: 'Benedetti in London for club meetings',
    description: 'Sources confirm Marco Benedetti held meetings with two Premier League clubs this week. Agent indicates he is prioritizing English football for his next role.',
    priority: 'high',
  },
  {
    id: 'i2',
    date: '2026-02-13T15:45:00',
    type: 'contract',
    coachId: '2',
    coachName: 'Thomas Kleinhans',
    title: 'Augsburg contract talks stall',
    description: 'FC Augsburg\'s contract extension negotiations with Kleinhans have reached an impasse. Release clause of €1.5M confirmed in current deal.',
    priority: 'high',
  },
  {
    id: 'i3',
    date: '2026-02-13T09:20:00',
    type: 'reputation',
    coachId: '3',
    coachName: 'Sarah Vandenberg',
    title: 'UEFA recognition for Vandenberg\'s tactical work',
    description: 'UEFA coaching conference highlighted Vandenberg\'s innovative pressing system. Ajax sources indicate club would not block Premier League move.',
    priority: 'medium',
  },
  {
    id: 'i4',
    date: '2026-02-12T16:00:00',
    type: 'performance',
    coachId: '5',
    coachName: 'Patrick McAllister',
    title: 'Rangers progress in Europa League',
    description: 'McAllister\'s Rangers defeated Bayern Munich 2-1 in Europa League, showcasing tactical maturity. Performance has increased Premier League interest.',
    priority: 'medium',
  },
  {
    id: 'i5',
    date: '2026-02-11T14:10:00',
    type: 'availability',
    coachId: '4',
    coachName: 'Carlos Dominguez',
    title: 'Dominguez active in English scouting',
    description: 'Former Valencia boss has attended 8 Premier League matches in past month. Agent confirms strong interest in English football.',
    priority: 'low',
  },
];
