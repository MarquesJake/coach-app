import type { ResearchProfile } from './brief-fit.ts'

// Authored interpretations of the cited periods, not API-Football tactical metrics.
// Identity proof and source notes: tmp/coach-ranking-research/expansion-britain/.
// Provider career rows are preserved verbatim; null ends do not establish current jobs.
export const BRITAIN_RESEARCH_PROFILES = [
  {
    "name": "Gary O'Neil",
    "apiId": 18151,
    "aliases": [
      "G. O'Neil",
      "Gary O’Neil"
    ],
    "style": "Counter-attacking",
    "pressing": "Medium",
    "build": "Mixed",
    "trackRecord": [
      "Top-flight experience"
    ],
    "summary": "Bournemouth in 2022/23 combined a compact mid-block with fast central combinations after regains; Wolves in the first half of 2023/24 added narrow attacking rotations and selective wing-back pressing. O'Neil kept Bournemouth in the Premier League in 2022/23.",
    "limitation": "Medium reflects block-based defending and selective pressure, not a measured pressing intensity. Mixed captures circulation plus rapid progression, rather than an exclusively short or long build. The Bournemouth promotion mentioned in the source was achieved as an assistant, so no head-coach Promotion tag is awarded. API career dates are verbatim, unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Coaches' Voice: Gary O’Neil tactics and style of play",
        "url": "https://learning.coachesvoice.com/cv/gary-o-neil-wolves-bournemouth-tactics/",
        "period": "Bournemouth 2022/23; Wolves August 2023–11 January 2024"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:30.114Z",
      "career": [
        {
          "club": "Wolverhampton Wanderers",
          "start": "2023-08-01",
          "end": "2024-12-01"
        },
        {
          "club": "AFC Bournemouth",
          "start": "2022-08-01",
          "end": "2023-06-01"
        }
      ]
    }
  },
  {
    "name": "Steve Cooper",
    "apiId": 98,
    "aliases": [
      "S. Cooper"
    ],
    "style": "Counter-attacking",
    "pressing": "Medium",
    "build": "Mixed",
    "trackRecord": [
      "Promotion",
      "Top-flight experience"
    ],
    "summary": "Forest's 2021/22 promotion side threatened through quick transitions. In the December 2023 Wolves match, Cooper used a compact back three, midfield pressure and forwards who could break into space; this is the period used for the defensive label.",
    "limitation": "Cooper changed systems and block heights. Medium refers to the December 2023 middle-third pressure, not all Forest games; Mixed reflects varied progression rather than a fixed build mechanism. Forest's promotion is a senior achievement; youth trophies are not mapped to senior trophy tags. API career dates are verbatim, unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Premier League: Promoted clubs — Forest counters can cause problems",
        "url": "https://www.premierleague.com/en/news/2650670",
        "period": "Nottingham Forest 2021/22; published 23 June 2022"
      },
      {
        "title": "Premier League: How Cooper has gone back in time by changing Forest's shape",
        "url": "https://www.premierleague.com/en/news/3823053",
        "period": "Nottingham Forest, Wolves match 9 December 2023; analysis 15 December 2023"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:32.419Z",
      "career": [
        {
          "club": "Brondby",
          "start": "2025-01-01",
          "end": null
        },
        {
          "club": "Leicester City",
          "start": "2024-06-01",
          "end": "2024-11-01"
        },
        {
          "club": "Nottingham Forest",
          "start": "2021-09-01",
          "end": "2023-12-01"
        },
        {
          "club": "Swansea City",
          "start": "2019-06-01",
          "end": "2021-07-01"
        },
        {
          "club": "England U17",
          "start": "2016-01-01",
          "end": "2019-06-01"
        },
        {
          "club": "England U17",
          "start": "2015-07-01",
          "end": "2015-10-01"
        }
      ]
    }
  },
  {
    "name": "Scott Parker",
    "apiId": 87,
    "aliases": [
      "S. Parker"
    ],
    "style": "Adaptable",
    "pressing": "High",
    "build": "Mixed",
    "trackRecord": [
      "Promotion",
      "Top-flight experience"
    ],
    "summary": "Parker's 2021/22 Bournemouth combined coordinated pressing, possession and transitions, changing between 4-3-3, 4-2-3-1 and in-game back threes. Promotion evidence also covers his Fulham and Burnley teams, with Burnley's 2024/25 approach described as compact and flexible.",
    "limitation": "The High label belongs to Bournemouth's 2021/22 Championship campaign, not a claim about all Parker teams. Mixed is conservative coding of possession and transition routes; the sources do not establish exclusively short build-up. Burnley's later formation changes should be assessed separately. API career dates are verbatim, unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Premier League: Promoted clubs — Parker has the tools to succeed",
        "url": "https://www.premierleague.com/ar/news/2646964",
        "period": "Bournemouth 2021/22; promotion preview June 2022"
      },
      {
        "title": "Premier League: Promoted clubs — All you need to know about Burnley",
        "url": "https://www.premierleague.com/en/news/4323143",
        "period": "Burnley 2024/25; retrospective promotion preview June 2025"
      },
      {
        "title": "Coaches' Voice: Tactical Analysis — Brentford 1 Fulham 2 (AET)",
        "url": "https://learning.coachesvoice.com/brentford-1-fulham-2-tactical-analysis-playoff-final/",
        "period": "Fulham, Championship playoff final 4 August 2020"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:34.721Z",
      "career": [
        {
          "club": "Burnley",
          "start": "2024-07-01",
          "end": null
        },
        {
          "club": "Club Brugge",
          "start": "2022-12-01",
          "end": "2023-03-01"
        },
        {
          "club": "AFC Bournemouth",
          "start": "2021-06-01",
          "end": "2022-08-01"
        },
        {
          "club": "Fulham",
          "start": "2019-02-01",
          "end": "2021-06-01"
        },
        {
          "club": "Tottenham Hotspur U18",
          "start": "2017-07-01",
          "end": "2018-07-01"
        }
      ]
    }
  },
  {
    "name": "Will Still",
    "apiId": 10665,
    "aliases": [
      "W. Still",
      "William Still"
    ],
    "style": "Pressing",
    "pressing": "High",
    "build": "Direct",
    "trackRecord": [
      "Top-flight experience"
    ],
    "summary": "Reims from October 2022 to November 2023 combined high pressure and counter-pressing with a compact central block. Regains led to fast vertical attacks, with longer passes to runners when useful. Still's own PSG masterclass explains the aggressive plan used in October 2022.",
    "limitation": "Direct describes the cited Reims progression and transition emphasis, not a ban on short passing. High pressing coexisted with a mid-block and later formation changes. The PSG example is one match and does not alone establish a whole-season identity. API DOB and full-name fields are missing; identity uses the Reims career and name. API career dates are verbatim, unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Opta Analyst: Still is Sparkling — The Revolution at Reims Under Will Still",
        "url": "https://theanalyst.com/articles/the-revolution-at-reims-under-will-still",
        "period": "Reims October 2022–11 November 2023"
      },
      {
        "title": "Coaches' Voice: Will Still — Reims 0 PSG 0 masterclass",
        "url": "https://learning.coachesvoice.com/cv/will-still-tactics-reims-psg-mbappe-neymar-ramos/",
        "period": "Reims v PSG, 8 October 2022; published 12 April 2023"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:37.035Z",
      "career": [
        {
          "club": "Southampton",
          "start": "2025-07-01",
          "end": null
        },
        {
          "club": "Lens",
          "start": "2024-07-01",
          "end": "2025-05-01"
        },
        {
          "club": "Reims",
          "start": "2022-10-01",
          "end": "2024-04-01"
        },
        {
          "club": "Beerschot Wilrijk",
          "start": "2021-01-01",
          "end": "2021-04-01"
        },
        {
          "club": "Lierse",
          "start": "2017-10-01",
          "end": "2017-12-01"
        }
      ]
    }
  },
  {
    "name": "Liam Rosenior",
    "apiId": 13350,
    "aliases": [
      "L. Rosenior"
    ],
    "style": "Possession",
    "pressing": "High",
    "build": "Short",
    "trackRecord": [
      "Top-flight experience"
    ],
    "summary": "Strasbourg's 2024/25 team used goalkeeper-supported short exchanges to draw opponents forward, then accelerated through the space behind the first press. Ligue 1's March 2025 analysis documents frequent advanced pressure as well as problems protecting leads.",
    "limitation": "This coding covers Strasbourg through 3 March 2025, not later employers or a completed-season finish. Short build-up and fast attacks coexisted. API DOB and full name are missing; the Hull/Strasbourg/Derby career supports identity. Uncorroborated provider career entries are retained only as raw snapshots. API career dates are verbatim, unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Ligue 1 / Stats Perform: Strasbourg — Liam Rosenior's tactics explained",
        "url": "https://ligue1.com/en/articles/l1_article_2056-pressing-and-suffocating-the-opposition-liam-rosenior-s-strasbourg-explained",
        "period": "Strasbourg 2024/25 through 3 March 2025"
      },
      {
        "title": "Coaches' Voice: Getting the picture — Liam Rosenior",
        "url": "https://learning.coachesvoice.com/cv/liam-rosenior-coaching-strasbourg/",
        "period": "Career interview published 25 July 2024; Hull 2022–24 and Strasbourg appointment"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:39.318Z",
      "career": [
        {
          "club": "Paris FC",
          "start": "2026-07-01",
          "end": null
        },
        {
          "club": "Strasbourg",
          "start": "2024-08-01",
          "end": "2025-08-01"
        },
        {
          "club": "Hull City",
          "start": "2022-11-01",
          "end": "2024-05-01"
        },
        {
          "club": "Derby",
          "start": "2020-11-01",
          "end": "2022-09-01"
        }
      ]
    }
  },
  {
    "name": "Ryan Lowe",
    "apiId": 618,
    "aliases": [
      "R. Lowe"
    ],
    "style": "Adaptable",
    "pressing": "High",
    "build": "Mixed",
    "trackRecord": [
      "Promotion"
    ],
    "summary": "Bury's 2018/19 side built through midfield when unpressed and used longer passes into a narrow attack when pressed, supporting those balls with aggressive counter-pressure. Plymouth's early 2021/22 side also mixed back-three circulation with direct channel balls. Lowe led Plymouth to promotion in 2019/20.",
    "limitation": "High pressing is supported by the March 2019 Bury study; it is not a verified Plymouth or Preston pressing band. The Bury analysis also identifies gaps behind pressure and weak compactness. Plymouth's promotion followed the curtailed 2019/20 season; lower-league success is not evidence of Premier League suitability. API career dates are verbatim, unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Total Football Analysis: Ryan Lowe’s attacking philosophy paying dividends at Bury",
        "url": "https://totalfootballanalysis.com/head-coach-analysis/ryan-lowe-bury-tactical-analysis-statistics",
        "period": "Bury 2018/19 through 29 March 2019"
      },
      {
        "title": "Total Football Analysis: Ryan Lowe tactics at Plymouth Argyle 2021/2022",
        "url": "https://totalfootballanalysis.com/team-analysis/plymouth-argyle-202122-their-direct-and-possession-based-football-scout-report-tactical-analysis-tactics",
        "period": "Plymouth early 2021/22, first 12 league games; page displays republication date 21 May 2025"
      },
      {
        "title": "Plymouth Argyle: Club Statement — promotion confirmed",
        "url": "https://www.pafc.co.uk/news/2020/june/club-statement",
        "period": "Plymouth 2019/20; statement 9 June 2020"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:41.683Z",
      "career": [
        {
          "club": "Wigan Athletic",
          "start": "2025-03-01",
          "end": null
        },
        {
          "club": "Preston North End",
          "start": "2021-12-01",
          "end": "2024-08-01"
        },
        {
          "club": "Plymouth Argyle",
          "start": "2019-06-01",
          "end": "2021-12-01"
        },
        {
          "club": "Bury",
          "start": "2018-01-01",
          "end": "2019-06-01"
        },
        {
          "club": "Bury",
          "start": "2017-10-01",
          "end": "2017-11-01"
        }
      ]
    }
  },
  {
    "name": "Michael Carrick",
    "apiId": 16246,
    "aliases": [
      "M. Carrick"
    ],
    "style": "Possession",
    "pressing": "Medium",
    "build": "Short",
    "trackRecord": [
      "Top-flight experience"
    ],
    "summary": "Middlesbrough in 2022–25 used short passing through a double pivot, narrow attackers and supporting full-backs. Carrick's team often defended in a mid-block with selective wide pressing. Boro reached the 2022/23 Championship playoffs; his Manchester United caretaker spell in 2021 supplies top-flight experience.",
    "limitation": "Boro's fourth-place finish was in the Championship, so it is not a major-league Top-four finish tag. The cited study explicitly rejects a consistently high-pressing description. Premier League experience here is a short caretaker spell, not sustained top-flight success; player honours are excluded. API career dates are verbatim, unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Coaches' Voice: Michael Carrick’s tactics and style of play",
        "url": "https://learning.coachesvoice.com/cv/michael-carricks-tactics-middlesbrough-man-utd/",
        "period": "Middlesbrough October 2022–2024/25; retrospective published 2026"
      },
      {
        "title": "Manchester United: Carrick to step down as first-team coach",
        "url": "https://www.manutd.com/en/news/detail/official-statement-as-michael-carrick-leaves-manchester-united-2-december-",
        "period": "Manchester United caretaker spell ending 2 December 2021"
      },
      {
        "title": "Manchester United: Every goal from Carrick’s caretaker spell",
        "url": "https://www.manutd.com/en/mutv/videos/detail/every-goal-from-michael-carrick-spell-as-man-utd-caretaker",
        "period": "Manchester United, November–December 2021"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:44.287Z",
      "career": [
        {
          "club": "Middlesbrough",
          "start": "2022-10-01",
          "end": null
        },
        {
          "club": "Manchester United",
          "start": "2021-11-01",
          "end": "2021-12-01"
        }
      ]
    }
  },
  {
    "name": "Carlos Corberan",
    "apiId": 12474,
    "aliases": [
      "Carlos Corberán"
    ],
    "style": "Possession",
    "pressing": "Medium",
    "build": "Short",
    "trackRecord": [
      "Top-flight experience"
    ],
    "summary": "West Brom in 2023/24 used a compact mid-block with selective pressing triggers; early 2024/25 attacking analysis describes patient build-up to invite pressure before accelerating. Corberán took Huddersfield to the 2022 playoff final and later coached Valencia in LaLiga.",
    "limitation": "The defensive and attacking labels come from adjacent West Brom seasons, not one synchronized sample. The attacking article displays February 2025 but describes early 2024/25 before his departure. A playoff final is not promotion. API DOB/full name are absent; Huddersfield, West Brom and Valencia anchors support identity. API career dates are verbatim, unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Total Football Analysis: Defensive Harmony — West Brom’s cohesive tactics",
        "url": "https://totalfootballanalysis.com/team-analysis/west-brom-202324-defence-scout-report-tactical-analysis-tactics",
        "period": "West Brom 2023/24 through 27 February 2024"
      },
      {
        "title": "Total Football Analysis: Carlos Corberán tactics in possession",
        "url": "https://totalfootballanalysis.com/team-analysis/west-brom-scout-report-202425-attack-tactical-analysis-tactics",
        "period": "West Brom early 2024/25; displayed publication 9 February 2025 postdates his departure"
      },
      {
        "title": "West Bromwich Albion: Get to know Carlos Corberán",
        "url": "https://www.wba.co.uk/news/get-know-carlos-corberan",
        "period": "Career through 26 October 2022"
      },
      {
        "title": "Valencia CF: Corberán — We want to give the fans much more",
        "url": "https://www.valenciacf.com/corberan-we-want-to-give-the-fans-much-more-than-we-are-currently-giving",
        "period": "Valencia, LaLiga matchday 11 at Real Madrid, 1 November 2025"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:46.634Z",
      "career": [
        {
          "club": "Valencia",
          "start": "2025-01-01",
          "end": null
        },
        {
          "club": "West Brom",
          "start": "2022-10-01",
          "end": "2023-05-01"
        },
        {
          "club": "Olympiakos Piraeus",
          "start": "2022-08-01",
          "end": "2022-09-01"
        },
        {
          "club": "Huddersfield",
          "start": "2020-09-01",
          "end": "2022-05-01"
        }
      ]
    }
  },
  {
    "name": "Marti Cifuentes",
    "apiId": 1878,
    "aliases": [
      "Martí Cifuentes",
      "Martí Cifuentes Corvillo"
    ],
    "style": "Possession",
    "pressing": "Medium",
    "build": "Short",
    "trackRecord": [
      "Top-flight experience"
    ],
    "summary": "In his first six QPR league games in 2023/24, Cifuentes encouraged patient build-up and passing options in a 4-3-3, with a mid-block and selective forward pressure. His earlier Hammarby side finished third in Sweden in 2022, and he subsequently guided QPR to Championship safety in 2024.",
    "limitation": "The tactical coding is a six-game QPR sample, not his full tenure; the article's May 2025 display date is later than the matches described. Hammarby's third place is not a major-league Top-four finish tag. Provider surname has an unexplained additional word; no alias reproduces it. API career dates are verbatim, unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Total Football Analysis: Martí Cifuentes tactics at QPR — assessing his instant impact",
        "url": "https://totalfootballanalysis.com/head-coach-analysis/efl-championship-202324-marti-cifuentes-qpr-tactical-analysis-tactics",
        "period": "QPR first six league games, November–December 2023; page displays 7 May 2025"
      },
      {
        "title": "Coaches' Voice: Enjoy the way you play — Martí Cifuentes",
        "url": "https://learning.coachesvoice.com/cv/marti-cifuentes-qpr/",
        "period": "Hammarby 2022; QPR 2023/24; interview 26 January 2025"
      },
      {
        "title": "Coaches' Voice: Martí Cifuentes — Attacking a mid-block",
        "url": "https://learning.coachesvoice.com/cv/marti-cifuentes-tactics-masterclass/",
        "period": "Masterclass filmed September 2024, published 15 January 2025"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:48.952Z",
      "career": [
        {
          "club": "Portland Timbers",
          "start": "2026-07-01",
          "end": null
        },
        {
          "club": "Leicester",
          "start": "2025-08-01",
          "end": "2026-01-01"
        },
        {
          "club": "Queens Park Rangers",
          "start": "2023-10-01",
          "end": null
        },
        {
          "club": "Hammarby Talang",
          "start": "2023-04-01",
          "end": "2023-06-01"
        },
        {
          "club": "Hammarby",
          "start": "2022-01-01",
          "end": "2023-10-01"
        },
        {
          "club": "AaB",
          "start": "2021-01-01",
          "end": "2022-01-01"
        },
        {
          "club": "Sandefjord",
          "start": "2018-06-01",
          "end": "2020-12-01"
        },
        {
          "club": "L'Hospitalet",
          "start": "2015-06-01",
          "end": "2016-03-01"
        },
        {
          "club": "Sant Andreu",
          "start": "2014-02-01",
          "end": "2014-07-01"
        }
      ]
    }
  },
  {
    "name": "Danny Rohl",
    "apiId": 22937,
    "aliases": [
      "Danny Röhl",
      "D. Röhl",
      "Danny Roehl"
    ],
    "style": "Adaptable",
    "pressing": "Medium",
    "build": "Mixed",
    "trackRecord": [],
    "summary": "Sheffield Wednesday in 2023–25 alternated back-four and back-five shapes, building through a double pivot while also using direct balls and advancing wide defenders. Mid- and high-block defending varied with the shape. Röhl led the club to Championship survival in 2023/24.",
    "limitation": "Medium reflects variable block heights and selective pressure; the source says Wednesday did not always commit to a high press. Survival has no matching TrackRecord enum, so the array is intentionally empty. Assistant-coach honours and unreviewed later jobs are not used to manufacture head-coach achievements. API career dates are verbatim, unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Coaches' Voice: Danny Röhl — tactics and style of play",
        "url": "https://learning.coachesvoice.com/cv/danny-rohl-tactics-and-style-of-play/",
        "period": "Sheffield Wednesday October 2023–2024/25; retrospective 16 October 2025"
      },
      {
        "title": "EFL: Danny Röhl — It’s not a normal Club, I felt that potential",
        "url": "https://efl.com/news/2024/october/06/danny-r-hl---it-s-not-a-normal-club---i-felt-that-potential-/",
        "period": "Sheffield Wednesday 2023/24; published 6 October 2024"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:37:03.470Z",
      "career": [
        {
          "club": "Sheffield Wednesday",
          "start": "2023-10-01",
          "end": null
        }
      ]
    }
  },
  {
    "name": "Rob Edwards",
    "apiId": 636,
    "aliases": [
      "R. Edwards"
    ],
    "style": "Direct",
    "pressing": "High",
    "build": "Direct",
    "trackRecord": [
      "Promotion",
      "Top-flight experience"
    ],
    "summary": "Luton's 2022/23 promotion approach used long passes to two forwards, supporting runners and second balls, with wing-backs providing width and pressure applied from the front. Premier League analysis in February 2024 documents an increase in advanced pressure after a more cautious start.",
    "limitation": "Direct is specific to Luton's inherited squad strengths, not Edwards' universal preference. High describes the promotion-period approach and later 2023/24 adjustment, not continuous pressing across that whole Premier League season. API DOB/full name are absent; career anchors distinguish him from the older Rob Edwards. API career dates are verbatim, unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Premier League: Why Luton's unique approach can ruffle feathers",
        "url": "https://www.premierleague.com/en/news/3586920",
        "period": "Luton 2022/23; analysis 10 August 2023"
      },
      {
        "title": "Premier League: How the pace of Ogbene has transformed Luton's attack",
        "url": "https://www.premierleague.com/en/news/3886881",
        "period": "Luton August 2023–10 February 2024"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:37:05.764Z",
      "career": [
        {
          "club": "Middlesbrough",
          "start": "2025-08-01",
          "end": null
        },
        {
          "club": "Luton",
          "start": "2022-12-01",
          "end": "2025-01-01"
        },
        {
          "club": "Watford",
          "start": "2022-08-01",
          "end": "2022-09-01"
        },
        {
          "club": "Wales U19",
          "start": "2021-10-01",
          "end": "2023-10-01"
        },
        {
          "club": "Forest Green",
          "start": "2021-08-01",
          "end": "2022-05-01"
        },
        {
          "club": "Wolves U21",
          "start": "2019-09-01",
          "end": "2020-12-01"
        },
        {
          "club": "AFC Telford United",
          "start": "2017-11-01",
          "end": "2017-12-01"
        },
        {
          "club": "Wolves",
          "start": "2016-10-01",
          "end": "2016-11-01"
        }
      ]
    }
  },
  {
    "name": "Enzo Maresca",
    "apiId": 12629,
    "aliases": [
      "E. Maresca"
    ],
    "style": "Possession",
    "pressing": "High",
    "build": "Short",
    "trackRecord": [
      "Promotion",
      "European trophy",
      "Top-flight experience"
    ],
    "summary": "Leicester in 2023/24 used goalkeeper-assisted short build-up, an inverted full-back and high number eights, with a press that sought to lock play to one side. Maresca won promotion with Leicester and the 2024/25 UEFA Conference League with Chelsea.",
    "limitation": "Tactical labels refer to Leicester's Championship campaign, not every later Chelsea game. High pressing coexisted with a 4-4-2 block. The Championship title is represented by Promotion, not an implied top-flight Domestic title. Player trophies and assistant-coach successes are excluded; API DOB is missing. API career dates are verbatim, unverified provider snapshots; end:null does not establish current employment or availability.",
    "sources": [
      {
        "title": "Coaches' Voice: Enzo Maresca’s tactics and style of play",
        "url": "https://learning.coachesvoice.com/cv/enzo-maresca-tactics-chelsea-leicester-city-parma/",
        "period": "Leicester 2023/24; analysis published 5 June 2024"
      },
      {
        "title": "UEFA: Real Betis 1-4 Chelsea — Conference League success",
        "url": "https://www.uefa.com/uefaconferenceleague/news/0299-1dde1ba33803-6370dd142717-1000--real-betis-1-4-chelsea-the-blues-complete-the-set-with-confe/",
        "period": "Chelsea, UEFA Conference League final 28 May 2025"
      },
      {
        "title": "Premier League: How Maresca's tactics have transformed Chelsea's style of play",
        "url": "https://www.premierleague.com/en/news/4220753/coaching-insights-enzo-maresca",
        "period": "Chelsea 2024/25; historical coaching-insights article"
      }
    ],
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:37:07.951Z",
      "career": [
        {
          "club": "Manchester City",
          "start": "2026-08-01",
          "end": null
        },
        {
          "club": "Chelsea",
          "start": "2024-08-01",
          "end": "2025-12-01"
        },
        {
          "club": "Leicester",
          "start": "2023-07-01",
          "end": "2024-07-01"
        },
        {
          "club": "Parma",
          "start": "2021-08-01",
          "end": "2021-11-01"
        },
        {
          "club": "Manchester City U23",
          "start": "2020-10-01",
          "end": "2021-05-01"
        }
      ]
    }
  }
] satisfies ResearchProfile[]
