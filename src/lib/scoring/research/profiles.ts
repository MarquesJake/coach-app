import type { ResearchProfile } from './brief-fit.ts'

// Research classifications are authored interpretations of the cited periods.
// They are not fields supplied by API-Football or validated outcome predictions.
// Career snapshots preserve provider values, not verified present employers.
export const RESEARCH_PROFILES: ResearchProfile[] = [
  {
    "name": "Kieran McKenna",
    "apiId": 16556,
    "aliases": [
      "K. McKenna"
    ],
    "style": "Possession",
    "pressing": "High",
    "build": "Short",
    "trackRecord": [
      "Promotion",
      "Top-flight experience"
    ],
    "summary": "Ipswich combined short build-up, attacking combinations and pressing with the ability to defend in a mid-block.",
    "limitation": "The cited tactical study focuses on the promotion campaigns. Premier League results and the present squad require separate assessment. API career dates are unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Tactical research — Kieran McKenna",
        "url": "https://learning.coachesvoice.com/cv/kieran-mckenna-tactics-ipswich-town/",
        "period": "Ipswich, 2022–24"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14",
      "career": [
        {
          "club": "Ipswich Town",
          "start": "2021-12-01",
          "end": null
        },
        {
          "club": "Manchester United U19",
          "start": "2017-10-01",
          "end": "2017-12-01"
        },
        {
          "club": "Manchester United U18",
          "start": "2016-09-01",
          "end": "2018-10-01"
        },
        {
          "club": "Tottenham Hotspur U18",
          "start": "2016-07-01",
          "end": "2016-07-01"
        }
      ]
    }
  },
  {
    "name": "Sebastian Hoeneß",
    "apiId": 1399,
    "aliases": [
      "S. Hoeneb",
      "Sebastian Hoeness"
    ],
    "style": "Possession",
    "pressing": "High",
    "build": "Mixed",
    "trackRecord": [
      "Top-four finish",
      "Top-flight experience"
    ],
    "summary": "Stuttgart combined flexible attacking shapes and progressive passing with central high pressing. The 2023/24 team finished second in the Bundesliga; later league analysis also documents possession dominance.",
    "limitation": "High pressing describes Stuttgart, especially 2024/25; Hoffenheim defended more variably. Mixed build is conservative coding: the cited sources do not establish an exclusively short build. API career dates are unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Tactical research — Sebastian Hoeneß",
        "url": "https://learning.coachesvoice.com/cv/sebastian-hoeness-tactics-stuttgart/",
        "period": "Hoffenheim, 2020–22; Stuttgart, April 2023–February 2025 (pressing coding: Stuttgart)"
      },
      {
        "title": "Bundesliga: Stuttgart attacking analysis",
        "url": "https://www.bundesliga.com/en/bundesliga/news/how-sebastian-hoeness-got-stuttgart-attack-on-all-fronts-europa-league-dfb-cup-36250",
        "period": "Stuttgart, 2025/26 through Bundesliga matchday 24; possession corroboration only"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14",
      "career": [
        {
          "club": "Stuttgart",
          "start": "2023-04-01",
          "end": null
        },
        {
          "club": "Hoffenheim",
          "start": "2020-07-01",
          "end": "2022-06-01"
        },
        {
          "club": "Bayern München II",
          "start": "2019-07-01",
          "end": "2020-07-01"
        },
        {
          "club": "Bayern München U19",
          "start": "2017-07-01",
          "end": "2019-06-01"
        }
      ]
    }
  },
  {
    "name": "Francesco Farioli",
    "apiId": 17873,
    "aliases": [
      "F. Farioli"
    ],
    "style": "Possession",
    "pressing": "High",
    "build": "Short",
    "trackRecord": [
      "Top-flight experience"
    ],
    "summary": "Nice used goalkeeper-supported short build-up to attract pressure, coordinated high pressing against opposition restarts and a low block when opponents advanced.",
    "limitation": "This coding reflects Nice; it is not a claim that every later team used identical methods. API career dates are unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Tactical research — Francesco Farioli",
        "url": "https://es.coachesvoice.com/cv/francesco-farioli-niza-analisis-tactica-claves/",
        "period": "Nice, 2023/24; article initially published 7 February 2024, subsequently updated"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14",
      "career": [
        {
          "club": "FC Porto",
          "start": "2025-06-01",
          "end": null
        },
        {
          "club": "Ajax",
          "start": "2024-05-01",
          "end": "2025-05-01"
        },
        {
          "club": "Nice",
          "start": "2023-06-01",
          "end": "2024-05-01"
        },
        {
          "club": "Alanyaspor",
          "start": "2021-12-01",
          "end": "2023-02-01"
        }
      ]
    }
  },
  {
    "name": "Kjetil Knutsen",
    "apiId": 1952,
    "aliases": [
      "K. Knutsen"
    ],
    "style": "Possession",
    "pressing": "High",
    "build": "Short",
    "trackRecord": [
      "Domestic title",
      "Top-flight experience"
    ],
    "summary": "Bodø/Glimt sustained possession-led 4-3-3 football and won four Norwegian league titles between 2020 and 2024.",
    "limitation": "Norwegian domestic results need adjustment for league and resource differences before projecting to England. API career dates are unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Tactical research — Kjetil Knutsen",
        "url": "https://es.coachesvoice.com/cv/las-claves-del-sorprendente-bodo-glimt-de-kjetil-knutsen/",
        "period": "Bodø/Glimt, 2020–24 league campaigns and tactical examples through 8 October 2025"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14",
      "career": [
        {
          "club": "Bodø  Glimt",
          "start": "2017-11-01",
          "end": null
        },
        {
          "club": "Åsane",
          "start": "2015-05-01",
          "end": "2016-11-01"
        },
        {
          "club": "Fyllingsdalen",
          "start": "2012-01-01",
          "end": "2015-01-01"
        }
      ]
    }
  },
  {
    "name": "Fabian Hürzeler",
    "apiId": 19253,
    "aliases": [
      "F. Hürzeler"
    ],
    "style": "Possession",
    "pressing": "Medium",
    "build": "Short",
    "trackRecord": [
      "Promotion",
      "Top-flight experience"
    ],
    "summary": "The St Pauli study describes possession build-up through a centre-back moving into midfield, with a mid-block and selective pressing.",
    "limitation": "The defensive coding is from St Pauli, not a measurement of current Brighton pressing. API career dates are unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Tactical research — Fabian Hürzeler",
        "url": "https://learning.coachesvoice.com/cv/fabian-hurzeler-tactics-style-of-play/",
        "period": "St Pauli, 2023/24; tactical article published 14 June 2024"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14",
      "career": [
        {
          "club": "Brighton",
          "start": "2024-09-01",
          "end": null
        },
        {
          "club": "FC St. Pauli",
          "start": "2023-01-01",
          "end": "2024-08-01"
        }
      ]
    }
  },
  {
    "name": "Andoni Iraola",
    "apiId": 2108,
    "aliases": [
      "Andoni Iraola Sagarna"
    ],
    "style": "Pressing",
    "pressing": "High",
    "build": "Mixed",
    "trackRecord": [
      "Promotion",
      "Top-flight experience"
    ],
    "summary": "Rayo combined aggressive high pressing with vertical attacks, short build-up when feasible and longer passes when pressured.",
    "limitation": "The tactical study analyses Rayo, not Bournemouth. Provider career rows contain overlapping open-ended jobs; neither current employment nor availability is established. API career dates are unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Tactical research — Andoni Iraola",
        "url": "https://learning.coachesvoice.com/cv/andoni-iraola-tactics-bournemouth-vallecano/",
        "period": "Rayo Vallecano, 2020–23; tactical article published 10 August 2023"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14",
      "career": [
        {
          "club": "Liverpool",
          "start": "2026-07-01",
          "end": null
        },
        {
          "club": "AFC Bournemouth",
          "start": "2023-07-01",
          "end": null
        },
        {
          "club": "Rayo Vallecano",
          "start": "2020-08-01",
          "end": "2023-06-01"
        },
        {
          "club": "Mirandes",
          "start": "2019-07-01",
          "end": "2020-07-01"
        },
        {
          "club": "AEK Larnaca",
          "start": "2018-07-01",
          "end": "2019-01-01"
        }
      ]
    }
  },
  {
    "name": "Oliver Glasner",
    "apiId": 1534,
    "aliases": [
      "O. Glasner"
    ],
    "style": "Counter-attacking",
    "pressing": "Medium",
    "build": "Direct",
    "trackRecord": [
      "European trophy",
      "Top-flight experience"
    ],
    "summary": "Glasner used direct forward passing and aggressive duelling. Early Palace defended more often in blocks than his German teams; Frankfurt won the 2022 Europa League.",
    "limitation": "Medium describes early Palace blocks, not the stronger high press in Germany. Counter-attacking is our broad coding of the vertical approach. Provider jobs overlap; availability is unknown. API career dates are unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Tactical research — Oliver Glasner",
        "url": "https://learning.coachesvoice.com/cv/oliver-glasner-tactics-and-style-of-play/",
        "period": "Defensive coding: Crystal Palace, February–November 2024; attacking context: Wolfsburg 2019–21 and Frankfurt 2021–23"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14",
      "career": [
        {
          "club": "Nottingham Forest",
          "start": "2026-08-01",
          "end": null
        },
        {
          "club": "Crystal Palace",
          "start": "2024-02-01",
          "end": null
        },
        {
          "club": "Eintracht Frankfurt",
          "start": "2021-07-01",
          "end": "2023-06-01"
        },
        {
          "club": "Wolfsburg",
          "start": "2019-07-01",
          "end": "2021-06-01"
        },
        {
          "club": "LASK",
          "start": "2015-07-01",
          "end": "2019-06-01"
        },
        {
          "club": "Ried",
          "start": "2014-06-01",
          "end": "2015-05-01"
        }
      ]
    }
  },
  {
    "name": "Marco Silva",
    "apiId": 10,
    "aliases": [],
    "style": "Adaptable",
    "pressing": "Medium",
    "build": "Mixed",
    "trackRecord": [
      "Promotion",
      "Domestic title",
      "Top-flight experience"
    ],
    "summary": "Fulham mixed short build-up with direct access to forwards and preferred a compact mid-block, pressing higher selectively. Silva won promotion with Fulham and a Greek league title with Olympiacos.",
    "limitation": "A broadly adaptable classification is research coding, not a guarantee of possession dominance or squad compatibility. API career dates are unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Tactical research — Marco Silva",
        "url": "https://learning.coachesvoice.com/cv/marco-silva-tactics-fulham/",
        "period": "Fulham, 2021–September 2025; career introduction covers earlier Estoril and Olympiacos achievements"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14",
      "career": [
        {
          "club": "Benfica",
          "start": "2026-07-01",
          "end": null
        },
        {
          "club": "Fulham",
          "start": "2021-08-01",
          "end": "2026-05-01"
        },
        {
          "club": "Everton",
          "start": "2018-08-01",
          "end": "2019-12-01"
        },
        {
          "club": "Watford",
          "start": "2017-08-01",
          "end": "2018-01-01"
        },
        {
          "club": "Hull City",
          "start": "2017-01-01",
          "end": "2017-05-01"
        },
        {
          "club": "Olympiakos Piraeus",
          "start": "2015-10-01",
          "end": "2016-05-01"
        }
      ]
    }
  },
  {
    "name": "Roberto De Zerbi",
    "apiId": 2424,
    "aliases": [
      "R. De Zerbi"
    ],
    "style": "Possession",
    "pressing": "High",
    "build": "Short",
    "trackRecord": [
      "Top-flight experience"
    ],
    "summary": "Sassuolo and Shakhtar built short from the goalkeeper to draw pressure, used deep midfield support and pressed aggressively. Playing over the press remained an option.",
    "limitation": "Tactical coding is from 2018–22, not later Brighton, Marseille or Tottenham teams. Provider snapshot has overlapping jobs. API career dates are unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Coaches’ Voice: Roberto De Zerbi tactics and style of play",
        "url": "https://learning.coachesvoice.com/cv/roberto-de-zerbi-brighton-shakhtar-sassuolo-tactics/",
        "period": "Sassuolo, 2018–21; Shakhtar Donetsk, 2021/22; tactical analysis prepared September 2022"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14T14:27:01.682226+00:00",
      "career": [
        {
          "club": "Tottenham",
          "start": "2025-09-01",
          "end": null
        },
        {
          "club": "Marseille",
          "start": "2024-07-01",
          "end": null
        },
        {
          "club": "Brighton & Hove Albion",
          "start": "2022-09-01",
          "end": "2024-06-01"
        },
        {
          "club": "Shakhtar Donetsk",
          "start": "2021-07-01",
          "end": "2022-07-01"
        },
        {
          "club": "Sassuolo",
          "start": "2018-07-01",
          "end": "2021-06-01"
        },
        {
          "club": "Benevento",
          "start": "2017-10-01",
          "end": "2018-06-01"
        },
        {
          "club": "Palermo",
          "start": "2016-09-01",
          "end": "2016-12-01"
        },
        {
          "club": "Foggia",
          "start": "2014-07-01",
          "end": "2016-08-01"
        }
      ]
    }
  },
  {
    "name": "Thomas Frank",
    "apiId": 90,
    "aliases": [
      "T. Frank"
    ],
    "style": "Adaptable",
    "pressing": "High",
    "build": "Mixed",
    "trackRecord": [
      "Promotion",
      "Top-flight experience"
    ],
    "summary": "Brentford moved from Championship possession football to a more varied Premier League approach, combining high regains, direct passing and situational deeper defending. Promotion came in 2021.",
    "limitation": "High reflects the 2024/25 pressing evidence, with deliberate low-block alternatives. The article’s proposed Tottenham tactics are not treated as observations. API career dates are unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Premier League: Analysis — How Spurs could look under Thomas Frank",
        "url": "https://www.premierleague.com/en/news/4323980/analysis-franks-tactics-style-and-favoured-formations",
        "period": "Brentford, 2018–May 2025; published 12 June 2025; coding excludes Spurs forecasts"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14T14:10:57.637Z",
      "career": [
        {
          "club": "Tottenham",
          "start": "2025-07-01",
          "end": null
        },
        {
          "club": "Brentford",
          "start": "2018-10-01",
          "end": null
        },
        {
          "club": "Brøndby",
          "start": "2013-06-01",
          "end": "2016-03-01"
        },
        {
          "club": "Denmark U19",
          "start": "2012-07-01",
          "end": "2013-06-01"
        },
        {
          "club": "Denmark U17",
          "start": "2011-06-01",
          "end": "2012-06-01"
        }
      ]
    }
  },
  {
    "name": "Graham Potter",
    "apiId": 12,
    "aliases": [
      "G. Potter",
      "Graham Stephen Potter"
    ],
    "style": "Adaptable",
    "pressing": "High",
    "build": "Short",
    "trackRecord": [
      "Promotion",
      "Top-flight experience"
    ],
    "summary": "Brighton used varied shapes, passing combinations and wide rotations. In 2021/22 their counter-pressing became more aggressive, while mid and low blocks remained options. Earlier Östersund teams earned promotions.",
    "limitation": "Tactical coding emphasises Brighton in 2021/22, not later Chelsea or West Ham. Promotion evidence is Swedish and should not be equated with English promotion experience. API career dates are unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Premier League / Coaches’ Voice: Potter’s tactics, style and favoured formations",
        "url": "https://www.premierleague.com/en/news/4220315",
        "period": "Tactical coding: Brighton, 2021/22; career context: Östersund, 2011–18; published 9 January 2025"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14T14:27:08.954738+00:00",
      "career": [
        {
          "club": "West Ham United",
          "start": "2025-01-01",
          "end": null
        },
        {
          "club": "Chelsea",
          "start": "2022-09-01",
          "end": "2023-04-01"
        },
        {
          "club": "Brighton & Hove Albion",
          "start": "2019-05-01",
          "end": "2022-09-01"
        },
        {
          "club": "Swansea City",
          "start": "2018-06-01",
          "end": "2019-05-01"
        },
        {
          "club": "Östersund",
          "start": "2011-01-01",
          "end": "2018-06-01"
        }
      ]
    }
  },
  {
    "name": "Sean Dyche",
    "apiId": 7,
    "aliases": [
      "S. Dyche"
    ],
    "style": "Direct",
    "pressing": "Medium",
    "build": "Direct",
    "trackRecord": [
      "Promotion",
      "Top-flight experience"
    ],
    "summary": "Burnley paired direct transitions with compact mid-block defending. Club history documents promotion in 2014 and 2016 and subsequent Premier League campaigns.",
    "limitation": "Medium reflects Burnley’s mid-block, not a claim that all Dyche teams defended at one height. API identity lacks full-name and birth fields; Burnley/Everton career matches corroborate the abbreviated name. API career dates are unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Premier League: Dyche’s direct tactics",
        "url": "https://www.premierleague.com/en/news/4444081/forest-set-for-another-big-change-of-style-with-dyches-direct-tactics",
        "period": "Burnley, 2012–22; retrospective published 23 October 2025; excludes Forest forecasts"
      },
      {
        "title": "Burnley FC: club history",
        "url": "https://www.burnleyfootballclub.com/burnley-fc-club-history",
        "period": "Burnley, 2012–22; promotion evidence: 2013/14 and 2015/16"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14T14:27:16.225823+00:00",
      "career": [
        {
          "club": "Nottingham Forest",
          "start": "2025-07-01",
          "end": null
        },
        {
          "club": "Everton",
          "start": "2023-02-01",
          "end": "2025-01-01"
        },
        {
          "club": "Burnley",
          "start": "2016-08-01",
          "end": "2022-04-01"
        }
      ]
    }
  },
  {
    "name": "Russell Martin",
    "apiId": 6025,
    "aliases": [
      "R. Martin"
    ],
    "style": "Possession",
    "pressing": "High",
    "build": "Short",
    "trackRecord": [
      "Promotion",
      "Top-flight experience"
    ],
    "summary": "Southampton’s 2023/24 promotion side used patient short passing and organised high and midfield pressing. Late-season back-three adjustments showed a more cautious alternative against Leeds.",
    "limitation": "Championship tactical evidence does not establish Premier League effectiveness. API 6025 has the corroborating career; sparse record 29001 is not imported. Snapshot excludes the uncorroborated Scotland coaching row. API career dates are unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Premier League: How Martin’s Southampton can flourish",
        "url": "https://www.premierleague.com/es/news/4036176",
        "period": "Southampton, 2023/24; published 1 July 2024"
      },
      {
        "title": "Southampton FC: Martin encouraged by Saints’ dominance",
        "url": "https://www.southamptonfc.com/en/news/article/martin-encouraged-by-saints-dominance",
        "period": "Southampton at Newcastle, 17 August 2024; top-flight coaching evidence only"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14T14:27:23.656501+00:00",
      "career": [
        {
          "club": "Rangers",
          "start": "2025-07-01",
          "end": null
        },
        {
          "club": "Southampton",
          "start": "2023-07-01",
          "end": "2024-12-01"
        },
        {
          "club": "Swansea City",
          "start": "2021-08-01",
          "end": "2023-06-01"
        },
        {
          "club": "Milton Keynes Dons",
          "start": "2019-11-01",
          "end": "2021-08-01"
        }
      ]
    }
  },
  {
    "name": "Mauricio Pochettino",
    "apiId": 13,
    "aliases": [
      "M. Pochettino",
      "Mauricio Roberto Pochettino Trossero"
    ],
    "style": "Pressing",
    "pressing": "High",
    "build": "Short",
    "trackRecord": [
      "Top-four finish",
      "Domestic title",
      "Top-flight experience"
    ],
    "summary": "Southampton and Tottenham built from the back with positional overloads and intense pressing. Tottenham also used mid-blocks; later PSG adapted their defensive approach and won Ligue 1.",
    "limitation": "High codes the earlier Southampton/Tottenham model, not every season or PSG’s later mid-block. API 13 has the corroborating career; sparse duplicate 28250 is not imported. API career dates are unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Coaches’ Voice: Mauricio Pochettino tactics and formations",
        "url": "https://learning.coachesvoice.com/cv/mauricio-pochettino-tactics-formation-style-of-play/",
        "period": "Tactical coding: Southampton 2013–14 and Tottenham 2014–19; PSG 2021–22 provides title/context evidence"
      },
      {
        "title": "Tottenham Hotspur: Spurs 2–2 Everton — Mauricio’s verdict",
        "url": "https://www.tottenhamhotspur.com/news/995895/spurs-2-2-everton-mauricios-verdict",
        "period": "12 May 2019; confirms fourth successive top-four finish"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14T14:11:11.316Z",
      "career": [
        {
          "club": "United States",
          "start": "2024-09-01",
          "end": null
        },
        {
          "club": "Chelsea",
          "start": "2023-07-01",
          "end": "2024-05-01"
        },
        {
          "club": "PSG",
          "start": "2021-01-01",
          "end": "2022-07-01"
        },
        {
          "club": "Tottenham Hotspur",
          "start": "2014-07-01",
          "end": "2019-11-01"
        },
        {
          "club": "Southampton",
          "start": "2013-01-01",
          "end": "2014-05-01"
        },
        {
          "club": "Espanyol",
          "start": "2009-01-01",
          "end": "2012-11-01"
        }
      ]
    }
  }
]
