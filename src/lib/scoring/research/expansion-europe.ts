import type { ResearchProfile } from './brief-fit.ts'

// Authored, period-bound interpretations of opened tactical/achievement sources.
// API snapshots preserve provider dates, including nulls and anomalies, without current-job inference.
// Identity review and full responses: root tmp/coach-ranking-research/expansion-europe.
export const EUROPE_RESEARCH_PROFILES: ResearchProfile[] = [
  {
    "name": "Xabi Alonso",
    "aliases": [
      "Xabier Alonso Olano"
    ],
    "style": "Possession",
    "pressing": "Medium",
    "build": "Mixed",
    "trackRecord": [
      "Domestic title",
      "Top-four finish",
      "Promotion",
      "Top-flight experience"
    ],
    "summary": "Leverkusen in 2022–24 used a back three, central combinations and wing-back width, increasing possession while retaining quick forward attacks. Alonso won the 2023/24 Bundesliga and previously promoted Real Sociedad B to the Segunda División.",
    "limitation": "Medium pressing reflects the less aggressive 2022/23 Leverkusen block, not Sociedad B’s high counter-press. Mixed build captures progression and transitions without asserting an exclusively short build; these are period-specific interpretations, not a description of later teams. API career dates are unverified provider snapshots preserved exactly; end:null does not establish current employment or availability. Salary, willingness and release terms remain unverified.",
    "sources": [
      {
        "title": "Coaches’ Voice: Xabi Alonso’s coaching career analysed",
        "url": "https://learning.coachesvoice.com/cv/xabi-alonso-bayer-leverkusen-liverpool/",
        "period": "Leverkusen 2022/23–2023/24; pressing specifically 2022/23; Sociedad B promotion 2020/21"
      },
      {
        "title": "API-Football: reviewed coach identity and raw career snapshot",
        "url": "https://v3.football.api-sports.io/coachs?search=Alonso",
        "period": "Retrieved 2026-09-14T15:36:26.368Z; provider career dates only; authenticated endpoint, not public tactical evidence"
      }
    ],
    "apiId": 6801,
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:26.368Z",
      "career": [
        {
          "club": "Chelsea",
          "start": "2026-07-01",
          "end": null
        },
        {
          "club": "Real Madrid",
          "start": "2025-06-01",
          "end": "2026-01-01"
        },
        {
          "club": "Bayer Leverkusen",
          "start": "2022-10-01",
          "end": "2025-05-01"
        },
        {
          "club": "Real Sociedad B",
          "start": "2019-06-01",
          "end": "2022-06-01"
        }
      ]
    }
  },
  {
    "name": "Xavi Hernández",
    "aliases": [
      "Xavi Hernandez",
      "Xavi",
      "Xavier Hernández Creus"
    ],
    "style": "Possession",
    "pressing": "High",
    "build": "Short",
    "trackRecord": [
      "Domestic title",
      "Top-four finish",
      "Top-flight experience"
    ],
    "summary": "At Al Sadd, Xavi used positional possession, short combinations and switches to stretch opponents, with a high line and coordinated pressing after losses. He subsequently led Barcelona to the 2022/23 La Liga title.",
    "limitation": "The tactical coding is drawn from Al Sadd in 2019–21, not inferred from his playing career or automatically extended to Barcelona. Direct passes to the striker were an escape option when shorter routes were blocked; league and squad differences require review. API career dates are unverified provider snapshots preserved exactly; end:null does not establish current employment or availability. Salary, willingness and release terms remain unverified.",
    "sources": [
      {
        "title": "Coaches’ Voice: Xavi: Coach Watch",
        "url": "https://learning.coachesvoice.com/cv/xavi-barcelona-ronald-koeman-pep-guardiola-al-sadd/",
        "period": "Al Sadd 2019–21; published 1 November 2021"
      },
      {
        "title": "FC Barcelona: Liga champions 2022/23",
        "url": "https://www.fcbarcelona.com/en/news/3344756/fc-barcelona-liga-champions-202223",
        "period": "Barcelona 2022/23; title confirmed 14 May 2023"
      },
      {
        "title": "API-Football: reviewed coach identity and raw career snapshot",
        "url": "https://v3.football.api-sports.io/coachs?search=Xavi",
        "period": "Retrieved 2026-09-14T15:36:28.644Z; provider career dates only; authenticated endpoint, not public tactical evidence"
      }
    ],
    "apiId": 1888,
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:28.644Z",
      "career": [
        {
          "club": "Barcelona",
          "start": "2021-11-01",
          "end": "2024-05-01"
        },
        {
          "club": "Al Sadd",
          "start": "2019-05-01",
          "end": "2021-11-01"
        }
      ]
    }
  },
  {
    "name": "Rúben Amorim",
    "aliases": [
      "Ruben Amorim"
    ],
    "style": "Possession",
    "pressing": "High",
    "build": "Short",
    "trackRecord": [
      "Domestic title",
      "Top-flight experience"
    ],
    "summary": "Sporting in 2020–22 built through a back three and double pivot, combining inside before switching to wide wing-backs. A narrow high press protected the centre, with a back-five block and wide traps as alternatives. Amorim won the 2020/21 Portuguese league title.",
    "limitation": "High describes the cited Sporting pressing model, not constant pressure in every phase. The wing-back and double-pivot roles require suitable players; this Portuguese title-period interpretation does not establish how a later team performed. API career dates are unverified provider snapshots preserved exactly; end:null does not establish current employment or availability. Salary, willingness and release terms remain unverified.",
    "sources": [
      {
        "title": "Coaches’ Voice: Rúben Amorim tactics",
        "url": "https://learning.coachesvoice.com/cv/ruben-amorim-sporting-lisbon-tactics/",
        "period": "Sporting 2020–October 2022; achievement 2020/21; later page header extends tenure to 2024"
      },
      {
        "title": "API-Football: reviewed coach identity and raw career snapshot",
        "url": "https://v3.football.api-sports.io/coachs?search=Amorim",
        "period": "Retrieved 2026-09-14T15:36:30.924Z; provider career dates only; authenticated endpoint, not public tactical evidence"
      }
    ],
    "apiId": 4720,
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:30.924Z",
      "career": [
        {
          "club": "AC Milan",
          "start": "2026-07-01",
          "end": null
        },
        {
          "club": "Manchester United",
          "start": "2024-11-01",
          "end": null
        },
        {
          "club": "Sporting Lisbon",
          "start": "2020-03-01",
          "end": "2024-11-01"
        },
        {
          "club": "Sporting Braga",
          "start": "2019-12-01",
          "end": "2020-03-01"
        },
        {
          "club": "Sporting Braga II",
          "start": "2019-09-01",
          "end": "2019-12-01"
        }
      ]
    }
  },
  {
    "name": "Sérgio Conceição",
    "aliases": [
      "Sergio Conceicao"
    ],
    "style": "Adaptable",
    "pressing": "Medium",
    "build": "Mixed",
    "trackRecord": [
      "Domestic title",
      "Top-flight experience"
    ],
    "summary": "Porto’s European examples mixed central build-up with long passes and varied defensive engagement: an opening high press against Arsenal gave way to a compact mid-low block. Conceição also won the Portuguese league and cup double in 2021/22.",
    "limitation": "Coding combines two explicitly bounded knockout matches, not a whole-season average: Chelsea in April 2021 for build-up and Arsenal in March 2024 for pressing. Medium summarises alternating engagement; it does not imply weak intensity. Scoreline and opponent shaped both plans. API career dates are unverified provider snapshots preserved exactly; end:null does not establish current employment or availability. Salary, willingness and release terms remain unverified.",
    "sources": [
      {
        "title": "Coaches’ Voice: Chelsea 0 Porto 1: Tactical Analysis",
        "url": "https://learning.coachesvoice.com/chelsea-0-porto-1-tactical-analysis/",
        "period": "Porto, Champions League quarter-final second leg, 13 April 2021"
      },
      {
        "title": "Coaches’ Voice: Arsenal 1 Porto 0: tactical analysis",
        "url": "https://learning.coachesvoice.com/cv/arsenal-porto-2024-tactics/",
        "period": "Porto, Champions League round of 16 second leg, 12 March 2024"
      },
      {
        "title": "UEFA: Factos do Porto–Atlético (league and cup double)",
        "url": "https://pt.uefa.com/uefachampionsleague/news/027a-166e8c4de03e-2273248923a0-1000--factos-do-porto-atletico/",
        "period": "Porto 2021/22 achievement; article 30 October 2022"
      },
      {
        "title": "API-Football: reviewed coach identity and raw career snapshot",
        "url": "https://v3.football.api-sports.io/coachs?search=Concei",
        "period": "Retrieved 2026-09-14T15:36:33.217Z; provider career dates only; authenticated endpoint, not public tactical evidence"
      }
    ],
    "apiId": 2204,
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:33.217Z",
      "career": [
        {
          "club": "Al-Ittihad FC",
          "start": "2025-08-01",
          "end": null
        },
        {
          "club": "AC Milan",
          "start": "2025-01-01",
          "end": "2025-05-01"
        },
        {
          "club": "AC Milan",
          "start": "2024-12-01",
          "end": null
        },
        {
          "club": "Porto",
          "start": "2017-06-01",
          "end": "2024-06-01"
        },
        {
          "club": "Nantes",
          "start": "2016-12-01",
          "end": "2017-06-01"
        },
        {
          "club": "Vitoria Guimaraes",
          "start": "2015-09-01",
          "end": "2016-05-01"
        },
        {
          "club": "Sporting Braga",
          "start": "2014-07-01",
          "end": "2015-06-01"
        },
        {
          "club": "Académica",
          "start": "2013-04-01",
          "end": "2014-05-01"
        },
        {
          "club": "Olhanense",
          "start": "2012-01-01",
          "end": "2013-01-01"
        }
      ]
    }
  },
  {
    "name": "Edin Terzić",
    "aliases": [
      "Edin Terzic",
      "E. Terzic",
      "E. Terzić"
    ],
    "style": "Possession",
    "pressing": "Medium",
    "build": "Mixed",
    "trackRecord": [
      "Top-four finish",
      "Top-flight experience"
    ],
    "summary": "Dortmund in 2022–24 used central overloads, flexible midfield shapes and combinations to escape pressure, retaining longer passes when needed. Defensive engagement became more selective in 2023/24. Terzić finished Bundesliga runner-up in 2022/23 and reached the 2024 Champions League final.",
    "limitation": "Medium reflects the more pragmatic 2023/24 defensive approach; the preceding season pressed more intensely. Wide-player individual quality was important. Reaching a European final is not winning a European trophy. A sparse second API identity is documented in the research report. API career dates are unverified provider snapshots preserved exactly; end:null does not establish current employment or availability. Salary, willingness and release terms remain unverified.",
    "sources": [
      {
        "title": "Coaches’ Voice: Edin Terzic tactics and style of play",
        "url": "https://learning.coachesvoice.com/cv/edin-terzic-tactics-style-of-play/",
        "period": "Dortmund 2022/23–2023/24; article 23 May 2024; pressing 2023/24"
      },
      {
        "title": "API-Football: reviewed coach identity and raw career snapshot",
        "url": "https://v3.football.api-sports.io/coachs?search=Terzic",
        "period": "Retrieved 2026-09-14T15:36:35.624Z; provider career dates only; authenticated endpoint, not public tactical evidence"
      }
    ],
    "apiId": 13491,
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:35.624Z",
      "career": [
        {
          "club": "Borussia Dortmund",
          "start": "2022-07-01",
          "end": "2024-07-01"
        },
        {
          "club": "Borussia Dortmund",
          "start": "2020-12-01",
          "end": "2021-06-01"
        }
      ]
    }
  },
  {
    "name": "Marco Rose",
    "aliases": [
      "M. Rose"
    ],
    "style": "Pressing",
    "pressing": "High",
    "build": "Mixed",
    "trackRecord": [
      "Top-four finish",
      "Top-flight experience"
    ],
    "summary": "Rose’s Salzburg, Gladbach and early Dortmund teams emphasised vertical progression, central runners and full-back width, combining midfield build-up with direct forward options and intensive pressing. Leipzig finished fourth in the 2023/24 Bundesliga under Rose.",
    "limitation": "Tactical coding covers 2017–December 2021, while the achievement is separately dated to 2023/24. Formations and defensive security varied by club. A second sparse API record and an unusual provider career entry are retained as review issues, not treated as verified employment. API career dates are unverified provider snapshots preserved exactly; end:null does not establish current employment or availability. Salary, willingness and release terms remain unverified.",
    "sources": [
      {
        "title": "Coaches’ Voice: Marco Rose: Coach Watch",
        "url": "https://learning.coachesvoice.com/cv/marco-rose-borussia-dortmund-jurgen-klopp/",
        "period": "Salzburg 2017–19; Gladbach 2019–21; Dortmund through 14 December 2021"
      },
      {
        "title": "Bundesliga: Leipzig preview recalls fourth-place finish",
        "url": "https://www.bundesliga.com/en/bundesliga/news/atletico-madrid-rb-leipzig-live-champions-league-blog-preview-report-alvarez-28886",
        "period": "Leipzig 2023/24 final league placing; preview published 19 September 2024, “Intent signalled”"
      },
      {
        "title": "API-Football: reviewed coach identity and raw career snapshot",
        "url": "https://v3.football.api-sports.io/coachs?search=Rose",
        "period": "Retrieved 2026-09-14T15:36:37.909Z; provider career dates only; authenticated endpoint, not public tactical evidence"
      }
    ],
    "apiId": 1540,
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:37.909Z",
      "career": [
        {
          "club": "RB Leipzig U21",
          "start": "2024-08-01",
          "end": "2024-10-01"
        },
        {
          "club": "RB Leipzig",
          "start": "2022-09-01",
          "end": "2025-03-01"
        },
        {
          "club": "Borussia Dortmund",
          "start": "2021-07-01",
          "end": "2022-06-01"
        },
        {
          "club": "Borussia M'gladbach",
          "start": "2019-07-01",
          "end": "2021-06-01"
        },
        {
          "club": "Salzburg",
          "start": "2017-06-01",
          "end": "2019-06-01"
        },
        {
          "club": "Salzburg U19",
          "start": "2016-07-01",
          "end": "2017-06-01"
        },
        {
          "club": "Lokomotive Leipzig",
          "start": "2012-07-01",
          "end": "2013-06-01"
        }
      ]
    }
  },
  {
    "name": "Roger Schmidt",
    "aliases": [
      "R. Schmidt"
    ],
    "style": "Pressing",
    "pressing": "High",
    "build": "Mixed",
    "trackRecord": [
      "Domestic title",
      "Top-flight experience"
    ],
    "summary": "Schmidt’s FIFA training demonstration uses compact 4-2-3-1 play, immediate counter-pressing and purposeful forward passes after drawing pressure. Mixed build is an interpretation of these progression principles. His Benfica won the 2022/23 Portuguese league.",
    "limitation": "The tactical evidence is a coaching demonstration published in September 2025, not a measured Benfica season or proof of a current job. It supports forward intent and counter-pressing but does not quantify short-versus-long passing frequency; training intensity needs squad-specific assessment. API career dates are unverified provider snapshots preserved exactly; end:null does not establish current employment or availability. Salary, willingness and release terms remain unverified.",
    "sources": [
      {
        "title": "FIFA Training Centre: On the training ground with Roger Schmidt, Part 5",
        "url": "https://www.fifatrainingcentre.com/en/practice/training-perspectives/on-the-training-ground-with/roger-schmidt/on-the-training-ground-with-roger-schmidt-part-5.php",
        "period": "Training methodology demonstration published 16 September 2025; filming date not established"
      },
      {
        "title": "UEFA: Factos do Inter–Benfica (2022/23 champions)",
        "url": "https://pt.uefa.com/uefachampionsleague/news/0285-1914f37019f7-34915222f79b-1000--factos-do-inter-benfica/",
        "period": "Benfica 2022/23 achievement; preview October 2023"
      },
      {
        "title": "API-Football: reviewed coach identity and raw career snapshot",
        "url": "https://v3.football.api-sports.io/coachs?search=Schmidt",
        "period": "Retrieved 2026-09-14T15:36:40.207Z; provider career dates only; authenticated endpoint, not public tactical evidence"
      }
    ],
    "apiId": 57,
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:40.207Z",
      "career": [
        {
          "club": "Benfica",
          "start": "2022-07-01",
          "end": "2024-08-01"
        },
        {
          "club": "PSV",
          "start": "2020-07-01",
          "end": "2022-05-01"
        },
        {
          "club": "Beijing Guoan",
          "start": "2017-07-01",
          "end": "2019-07-01"
        },
        {
          "club": "Bayer Leverkusen",
          "start": "2014-07-01",
          "end": "2017-03-01"
        },
        {
          "club": "Salzburg",
          "start": "2012-06-01",
          "end": "2014-06-01"
        },
        {
          "club": "Paderborn",
          "start": "2011-07-01",
          "end": "2012-06-01"
        }
      ]
    }
  },
  {
    "name": "Niko Kovač",
    "aliases": [
      "Niko Kovac",
      "N. Kovac",
      "N. Kovač"
    ],
    "style": "Counter-attacking",
    "pressing": "Medium",
    "build": "Mixed",
    "trackRecord": [
      "Top-four finish",
      "Top-flight experience"
    ],
    "summary": "Dortmund’s spring 2025 recovery used a back three, regrouping after possession losses and faster attacking transitions. Possession remained substantial, so Mixed build describes a more direct emphasis rather than an exclusively long-ball game. Kovač secured fourth place in 2024/25.",
    "limitation": "The sample is a 14-match league turnaround, not a causal estimate of coaching impact or a whole-career identity. Medium is a conservative interpretation of regrouping and defensive security; duel intensity alone does not establish a high press. API career dates are unverified provider snapshots preserved exactly; end:null does not establish current employment or availability. Salary, willingness and release terms remain unverified.",
    "sources": [
      {
        "title": "Bundesliga: How Niko Kovač masterminded Dortmund’s Champions League qualification",
        "url": "https://www.bundesliga.com/en/bundesliga/news/niko-kovac-masterminds-borussia-dortmund-champions-league-qualification-bid-32181",
        "period": "Dortmund February–May 2025; published 17 May 2025"
      },
      {
        "title": "API-Football: reviewed coach identity and raw career snapshot",
        "url": "https://v3.football.api-sports.io/coachs?search=Kovac",
        "period": "Retrieved 2026-09-14T15:36:42.608Z; provider career dates only; authenticated endpoint, not public tactical evidence"
      }
    ],
    "apiId": 1528,
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:42.608Z",
      "career": [
        {
          "club": "Borussia Dortmund",
          "start": "2025-02-01",
          "end": null
        },
        {
          "club": "Wolfsburg",
          "start": "2022-07-01",
          "end": "2024-03-01"
        },
        {
          "club": "Monaco",
          "start": "2020-07-01",
          "end": "2022-01-01"
        },
        {
          "club": "Bayern Munich",
          "start": "2018-07-01",
          "end": "2019-11-01"
        },
        {
          "club": "Eintracht Frankfurt",
          "start": "2016-03-01",
          "end": "2018-06-01"
        },
        {
          "club": "Croatia",
          "start": "2013-10-01",
          "end": "2015-09-01"
        },
        {
          "club": "Croatia U21",
          "start": "2013-01-01",
          "end": "2013-10-01"
        }
      ]
    }
  },
  {
    "name": "Lucien Favre",
    "aliases": [
      "L. Favre"
    ],
    "style": "Adaptable",
    "pressing": "Medium",
    "build": "Mixed",
    "trackRecord": [
      "Top-four finish",
      "Top-flight experience"
    ],
    "summary": "Dortmund’s cited 2019 and 2020 matches combined midfield-supported build-up with quick transitions, changing from a back four to a back three while commonly defending in a mid-block. Favre previously took Nice to third in Ligue 1 in 2016/17.",
    "limitation": "This is a two-match tactical sample, including a 3–0 defeat at Tottenham and a 4–0 win over Schalke, not a season-wide frequency estimate. Medium reflects the observed mid-blocks; selective higher pressure also occurred. The Nice achievement is separate from the Dortmund tactical coding. API career dates are unverified provider snapshots preserved exactly; end:null does not establish current employment or availability. Salary, willingness and release terms remain unverified.",
    "sources": [
      {
        "title": "Coaches’ Voice: Tottenham 3 Borussia Dortmund 0",
        "url": "https://learning.coachesvoice.com/tactical-analysis-tottenham-3-borussia-dortmund-0/",
        "period": "Dortmund, Champions League round of 16, 13 February 2019"
      },
      {
        "title": "Coaches’ Voice: Borussia Dortmund 4 Schalke 0",
        "url": "https://learning.coachesvoice.com/tactical-analysis-dortmund-4-schalke-0/",
        "period": "Dortmund, Bundesliga, 16 May 2020"
      },
      {
        "title": "UEFA: Dortmund v Paris facts (Favre’s Nice record)",
        "url": "https://www.uefa.com/uefachampionsleague/news/025a-0e9f842aa679-455e52772a11-1000--dortmund-v-paris-facts/",
        "period": "Nice 2016/17 third place; UEFA preview February 2020"
      },
      {
        "title": "API-Football: reviewed coach identity and raw career snapshot",
        "url": "https://v3.football.api-sports.io/coachs?search=Favre",
        "period": "Retrieved 2026-09-14T15:36:45.005Z; provider career dates only; authenticated endpoint, not public tactical evidence"
      }
    ],
    "apiId": 1530,
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:45.005Z",
      "career": [
        {
          "club": "Nice",
          "start": "2022-06-01",
          "end": "2023-01-01"
        },
        {
          "club": "Borussia Dortmund",
          "start": "2018-07-01",
          "end": "2020-12-01"
        },
        {
          "club": "Nice",
          "start": "2016-05-01",
          "end": "2018-06-01"
        },
        {
          "club": "Borussia M'gladbach",
          "start": "2011-02-01",
          "end": "2015-09-01"
        },
        {
          "club": "Hertha Berlin",
          "start": "2007-07-01",
          "end": "2009-09-01"
        },
        {
          "club": "Zürich",
          "start": "2003-03-01",
          "end": "2007-06-01"
        },
        {
          "club": "Servette",
          "start": "2000-07-01",
          "end": "2002-06-01"
        },
        {
          "club": "Yverdon Sport",
          "start": "1996-12-01",
          "end": "2000-06-01"
        },
        {
          "club": "Xamax",
          "start": "1995-07-01",
          "end": "1996-11-01"
        },
        {
          "club": "Echallens",
          "start": "1993-07-01",
          "end": "1994-06-01"
        }
      ]
    }
  },
  {
    "name": "Maurizio Sarri",
    "aliases": [
      "M. Sarri"
    ],
    "style": "Possession",
    "pressing": "High",
    "build": "Short",
    "trackRecord": [
      "European trophy",
      "Domestic title",
      "Top-four finish",
      "Top-flight experience"
    ],
    "summary": "Napoli in 2015–18 progressed through a deep playmaker, quick combinations, rotations and third-player runs, supported by an aggressive press and counter-press. Sarri later won the 2018/19 Europa League with Chelsea and the 2019/20 Serie A title with Juventus.",
    "limitation": "The tactical bands describe Napoli, not all Sarri teams: the same source documents more mid-block defending and different formations at Juventus. Implementation depends on coordinated movement, technical midfielders and defenders able to cover space behind the press. API career dates are unverified provider snapshots preserved exactly; end:null does not establish current employment or availability. Salary, willingness and release terms remain unverified.",
    "sources": [
      {
        "title": "Coaches’ Voice: Maurizio Sarri: Coach Watch",
        "url": "https://learning.coachesvoice.com/cv/maurizio-sarri-chelsea-napoli-lazio-guardiola/",
        "period": "Napoli 2015–18 tactical coding; Chelsea 2018/19 and Juventus 2019/20 achievements; published 3 August 2021"
      },
      {
        "title": "API-Football: reviewed coach identity and raw career snapshot",
        "url": "https://v3.football.api-sports.io/coachs?search=Sarri",
        "period": "Retrieved 2026-09-14T15:36:47.339Z; provider career dates only; authenticated endpoint, not public tactical evidence"
      }
    ],
    "apiId": 2412,
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:47.339Z",
      "career": [
        {
          "club": "Atalanta",
          "start": "2026-07-01",
          "end": null
        },
        {
          "club": "Lazio",
          "start": "2021-06-01",
          "end": "2024-03-01"
        },
        {
          "club": "Juventus",
          "start": "2019-06-01",
          "end": "2020-08-01"
        },
        {
          "club": "Chelsea",
          "start": "2018-07-01",
          "end": "2019-06-01"
        },
        {
          "club": "Napoli",
          "start": "2015-06-01",
          "end": "2018-05-01"
        },
        {
          "club": "Empoli",
          "start": "2012-07-01",
          "end": "2015-06-01"
        },
        {
          "club": "Sorrento",
          "start": "2011-07-01",
          "end": "2011-12-01"
        },
        {
          "club": "Alessandria",
          "start": "2010-07-01",
          "end": "2011-06-01"
        }
      ]
    }
  },
  {
    "name": "Stefano Pioli",
    "aliases": [
      "S. Pioli"
    ],
    "style": "Direct",
    "pressing": "High",
    "build": "Direct",
    "trackRecord": [
      "Domestic title",
      "Top-four finish",
      "Top-flight experience"
    ],
    "summary": "Milan’s 2021/22 title team favoured early vertical passes from Maignan towards a strong striker, second-ball support and the Hernández–Leão left-side partnership. Aggressive counter-pressing and a high defensive line complemented this risk-conscious deep build-up.",
    "limitation": "Direct is the dominant build emphasis described in the study, not a claim that Milan never played short. Short goalkeeper exchanges could draw pressure before a longer pass. The high line required recovery pace; the later switch to a back three shows the model was not fixed. API career dates are unverified provider snapshots preserved exactly; end:null does not establish current employment or availability. Salary, willingness and release terms remain unverified.",
    "sources": [
      {
        "title": "Coaches’ Voice: Stefano Pioli: Coach watch",
        "url": "https://learning.coachesvoice.com/cv/stefano-pioli-ac-milan-coach-watch/",
        "period": "Milan 2021/22 title campaign, with tactical observations into 2022/23"
      },
      {
        "title": "API-Football: reviewed coach identity and raw career snapshot",
        "url": "https://v3.football.api-sports.io/coachs?search=Pioli",
        "period": "Retrieved 2026-09-14T15:36:49.704Z; provider career dates only; authenticated endpoint, not public tactical evidence"
      }
    ],
    "apiId": 3733,
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:49.704Z",
      "career": [
        {
          "club": "Al Nassr",
          "start": "2024-09-01",
          "end": null
        },
        {
          "club": "AC Milan",
          "start": "2019-10-01",
          "end": "2024-05-01"
        },
        {
          "club": "Fiorentina",
          "start": "2017-06-01",
          "end": "2019-04-01"
        },
        {
          "club": "Inter Milan",
          "start": "2016-11-01",
          "end": "2017-05-01"
        },
        {
          "club": "Lazio",
          "start": "2014-07-01",
          "end": "2016-04-01"
        },
        {
          "club": "Bologna",
          "start": "2011-10-01",
          "end": "2014-01-01"
        },
        {
          "club": "Palermo",
          "start": "2011-07-01",
          "end": "2011-08-01"
        },
        {
          "club": "Chievo",
          "start": "2010-07-01",
          "end": "2011-05-01"
        },
        {
          "club": "Sassuolo",
          "start": "2009-06-01",
          "end": "2010-06-01"
        },
        {
          "club": "Piacenza",
          "start": "2008-06-01",
          "end": "2009-06-01"
        },
        {
          "club": "Grosseto",
          "start": "2007-09-01",
          "end": "2008-05-01"
        },
        {
          "club": "Parma",
          "start": "2006-06-01",
          "end": "2007-02-01"
        },
        {
          "club": "Modena",
          "start": "2004-06-01",
          "end": "2006-06-01"
        },
        {
          "club": "Salernitana",
          "start": "2003-07-01",
          "end": "2004-06-01"
        }
      ]
    }
  },
  {
    "name": "Thiago Motta",
    "aliases": [
      "T. Motta"
    ],
    "style": "Possession",
    "pressing": "High",
    "build": "Short",
    "trackRecord": [
      "Top-flight experience"
    ],
    "summary": "Bologna in 2022–24 used goalkeeper-supported short build-up, midfield rotations and player-oriented marking in mid and high blocks. Motta kept Spezia in Serie A in 2021/22 and subsequently secured Bologna’s 2024 Champions League qualification.",
    "limitation": "High pressing describes Bologna, while his Spezia side defended much more passively. Player-oriented marking imposes physical demands and exposes space behind the back line. Champions League qualification is recorded in prose rather than assumed to mean a top-four finish or European trophy. API career dates are unverified provider snapshots preserved exactly; end:null does not establish current employment or availability. Salary, willingness and release terms remain unverified.",
    "sources": [
      {
        "title": "Coaches’ Voice: Thiago Motta’s tactics and style of play",
        "url": "https://learning.coachesvoice.com/cv/thiago-mottas-tactics-and-style-of-play/",
        "period": "Bologna September 2022–March 2024 tactical coding; Spezia 2021/22 survival"
      },
      {
        "title": "Juventus: Welcome, Coach Thiago Motta!",
        "url": "https://www.juventus.com/en/news/articles/welcome-coach-thiago-motta",
        "period": "Bologna 2023/24 Champions League qualification; published 12 June 2024"
      },
      {
        "title": "API-Football: reviewed coach identity and raw career snapshot",
        "url": "https://v3.football.api-sports.io/coachs?search=Motta",
        "period": "Retrieved 2026-09-14T15:36:51.966Z; provider career dates only; authenticated endpoint, not public tactical evidence"
      }
    ],
    "apiId": 4842,
    "apiRecord": {
      "retrievedAt": "2026-09-14T15:36:51.966Z",
      "career": [
        {
          "club": "Juventus",
          "start": "2024-06-01",
          "end": "2025-03-01"
        },
        {
          "club": "Bologna",
          "start": "2022-09-01",
          "end": "2024-06-01"
        },
        {
          "club": "Spezia",
          "start": "2021-07-01",
          "end": "2022-06-01"
        },
        {
          "club": "Genoa",
          "start": "2019-10-01",
          "end": "2019-12-01"
        },
        {
          "club": "PSG U19",
          "start": "2018-07-01",
          "end": "2019-06-01"
        }
      ]
    }
  }
]
