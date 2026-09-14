import type { DeepResearchProfile } from './deep-research-types'

// Editorial research interpretation from opened sources, reviewed 2026-09-14.
// Historical tactical periods are explicit; these are not API metrics or scoring inputs.
export const DEEP_GLOBAL_PROFILES: DeepResearchProfile[] = [
  {
    "apiId": 1545,
    "name": "Julian Nagelsmann",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Club progression and Germany departure",
        "points": [
          {
            "text": "Before Germany, Nagelsmann’s senior club progression took him from Hoffenheim to Leipzig and then Bayern Munich.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/julian-nagelsmann-bayern-munich-red-bull-rangnick/"
            ],
            "period": "Hoffenheim, Leipzig and Bayern, 2016–2023"
          },
          {
            "text": "The DFB records Nagelsmann taking Germany in September 2023. The DFB announced immediate termination at his request on 3 July 2026. The September 14 review therefore cannot carry Germany forward as his employer; a subsequent appointment was not verified.",
            "sourceUrls": [
              "https://www.dfb.de/news/julian-nagelsmann-verlaesst-den-dfb"
            ],
            "period": "Hoffenheim–Bayern, 2016–2023; Germany, September 2023–3 July 2026"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "Central movement with protected width",
        "points": [
          {
            "text": "Leipzig used Werner’s runs behind alongside a partner, with Olmo, Sabitzer and Forsberg exchanging central positions. Angeliño and Mukiele could supply width or move inside, while midfielders covered their advances. The interpretation is coordinated rotation: space opened by one player required another to balance the structure. The cover mattered especially when both wide players moved beyond midfield.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/julian-nagelsmann-bayern-munich-red-bull-rangnick/"
            ],
            "period": "RB Leipzig, 2019–2021"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Wide pressing traps",
        "points": [
          {
            "text": "The first goal-kick pass could trigger the press rather than an immediate rush at the goalkeeper. Forwards and attacking midfielders steered play wide, central midfielders stepped up, and the far wing-back narrowed. This depended on the back line advancing together and protecting central routes when pressure failed.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/julian-nagelsmann-bayern-munich-red-bull-rangnick/"
            ],
            "period": "RB Leipzig, 2019–2021"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Changing the attack after a striker leaves",
        "points": [
          {
            "text": "After Lewandowski left, the analysis describes more central combinations, fewer crosses and roles for Choupo-Moting ahead of Musiala. That is a personnel-specific adjustment, rather than evidence that the same attacking pattern persisted across all his teams.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/julian-nagelsmann-bayern-munich-red-bull-rangnick/"
            ],
            "period": "Bayern Munich, 2021–March 2023"
          }
        ]
      },
      {
        "key": "management",
        "title": "Immediate training feedback",
        "points": [
          {
            "text": "At Hoffenheim, a large pitchside screen enabled immediate positional corrections during training. This documents a teaching method; it does not measure how every player responded.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/julian-nagelsmann-bayern-munich-red-bull-rangnick/"
            ],
            "period": "Hoffenheim, 2016–2019"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://learning.coachesvoice.com/cv/julian-nagelsmann-bayern-munich-red-bull-rangnick/",
        "title": "Julian Nagelsmann tactics and style of play",
        "publisher": "The Coaches’ Voice"
      },
      {
        "url": "https://www.dfb.de/news/julian-nagelsmann-verlaesst-den-dfb",
        "title": "Julian Nagelsmann verlässt den DFB",
        "publisher": "DFB"
      }
    ],
    "limitations": [
      "Tactical evidence ends with Bayern in March 2023; Germany tactics and any later appointment need separate analysis.",
      "The DFB departure establishes an ended job, not willingness to accept another. No independent, longitudinal player-development assessment was verified."
    ]
  },
  {
    "apiId": 40,
    "name": "Thomas Tuchel",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Club success and England role",
        "points": [
          {
            "text": "England’s official account records Tuchel’s European success with Chelsea and his England start in January 2025. His contract was extended towards EURO 2028 in February 2026; a July 21 update still identified him leading England into September. The club tactics below describe an earlier setting.",
            "sourceUrls": [
              "https://www.englandfootball.com/articles/2026/Feb/12/thomas-tuchel-extends-england-mens-contract-to-euro-2028-20261202",
              "https://www.englandfootball.com/articles/2026/Jul/21/whats-next-for-england-after-fifa-world-cup-20262107"
            ],
            "period": "Chelsea, 2021; England, 2025–2026; role reviewed 14 September 2026"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "Chelsea’s back three as an attacking platform",
        "points": [
          {
            "text": "Chelsea’s outside centre-backs could progress beyond the first line: Azpilicueta combined on the right and Rüdiger carried into space. Wing-backs advanced while Mount, Havertz or Pulisic could drop towards the double pivot. Werner’s narrower runs threatened depth, preventing every forward from coming towards the ball.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/thomas-tuchel-jurgen-klopp-chelsea-dortmund-psg/"
            ],
            "period": "Chelsea, January–December 2021"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Different front lines ahead of five defenders",
        "points": [
          {
            "text": "Chelsea defended in variants including 5-4-1, 5-3-2 and 5-2-3. When pressing wide, a wing-back and outside centre-back could advance with midfield covering behind them. Keeping possession also reduced exposure: control of the ball was part of the defensive plan.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/thomas-tuchel-jurgen-klopp-chelsea-dortmund-psg/"
            ],
            "period": "Chelsea, January–December 2021"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Different structures around different attackers",
        "points": [
          {
            "text": "At PSG, Tuchel used back-four and back-three systems; the 2020 final side paired Neymar and Di María inside behind the forwards. Chelsea’s later structure instead gave wing-backs and two inside attackers distinct supporting functions.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/thomas-tuchel-jurgen-klopp-chelsea-dortmund-psg/"
            ],
            "period": "Paris Saint-Germain, 2018–2020; Chelsea, 2021"
          }
        ]
      },
      {
        "key": "development",
        "title": "Chalobah: opportunity with a defined role",
        "points": [
          {
            "text": "Tuchel retained Trevoh Chalobah after strong pre-season performances and loan experience. He initially limited him to the back three, explaining that trying midfield too soon could confuse his learning. That provides a concrete example of earned selection, role clarity and staged development alongside experienced defenders.",
            "sourceUrls": [
              "https://www.chelseafc.com/en/news/article/tuchel-reveals-where-chalobah-will-play-this-season"
            ],
            "period": "Chelsea, start of 2021/22"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://www.englandfootball.com/articles/2026/Feb/12/thomas-tuchel-extends-england-mens-contract-to-euro-2028-20261202",
        "title": "Thomas Tuchel extends England stay to EURO 2028",
        "publisher": "England Football"
      },
      {
        "url": "https://www.englandfootball.com/articles/2026/Jul/21/whats-next-for-england-after-fifa-world-cup-20262107",
        "title": "What’s coming up for our England teams?",
        "publisher": "England Football"
      },
      {
        "url": "https://learning.coachesvoice.com/cv/thomas-tuchel-jurgen-klopp-chelsea-dortmund-psg/",
        "title": "Thomas Tuchel tactics and style of play",
        "publisher": "The Coaches’ Voice"
      },
      {
        "url": "https://www.chelseafc.com/en/news/article/tuchel-reveals-where-chalobah-will-play-this-season",
        "title": "Tuchel reveals where Chalobah will play this season",
        "publisher": "Chelsea FC"
      }
    ],
    "limitations": [
      "The tactical source was published in December 2021; these are not England’s verified 2026 mechanisms.",
      "Chalobah is one documented case, not a general youth-development rating. Contract duration does not establish availability or cost."
    ]
  },
  {
    "apiId": 193,
    "name": "Luis Enrique",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Treble winner; PSG role separately dated",
        "points": [
          {
            "text": "Barcelona confirms Luis Enrique won the league, domestic cup and Champions League in his first season. PSG’s September 8, 2026 press conference identifies him as its coach. His Spain mechanisms below belong to his national-team period and should not be displayed as a description of today’s PSG.",
            "sourceUrls": [
              "https://www.fcbarcelona.com/en/football/first-team/news/1097737/luis-enrique-takes-treble-in-debut-season",
              "https://www.psg.fr/content/luis-enrique-chercher-a-se-reinventer-paris-saint-germain-sk-slovan-bratislava-uefa-champions-league-20262027"
            ],
            "period": "Barcelona, 2014/15; PSG role reviewed 14 September 2026"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "Spain’s goalkeeper-supported progression",
        "points": [
          {
            "text": "Spain used Unai Simón as an extra passing option, with centre-backs spread and midfield available nearby. Busquets organised progression while wide forwards stretched the opposition. Starting short did not exclude a later long pass towards a striker able to hold the ball; circulation sought a route through pressure.",
            "sourceUrls": [
              "https://es.coachesvoice.com/cv/luis-enrique-variables-tacticas-psg-espana-barcelona/"
            ],
            "period": "Spain, 2018–2022"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Front pressure and a holding midfielder’s cover",
        "points": [
          {
            "text": "The front three adapted their pressure to the opposing build-up, supported by advancing midfielders. If that pressure was beaten, Spain could recover into 4-1-4-1. Busquets and the centre-backs then provided central protection and competed for second balls rather than leaving the middle completely open.",
            "sourceUrls": [
              "https://es.coachesvoice.com/cv/luis-enrique-variables-tacticas-psg-espana-barcelona/"
            ],
            "period": "Spain, 2018–2022"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Selection changed the route through the middle",
        "points": [
          {
            "text": "Olmo’s false-nine role against Italy differed from using Morata as a conventional striker. At the 2022 World Cup, Rodri moved into central defence alongside Laporte. These choices illustrate role adaptation within a broadly consistent positional framework.",
            "sourceUrls": [
              "https://es.coachesvoice.com/cv/luis-enrique-variables-tacticas-psg-espana-barcelona/"
            ],
            "period": "Spain, EURO 2020 played in 2021; World Cup 2022"
          }
        ]
      },
      {
        "key": "management",
        "title": "Individual explanations for new arrivals",
        "points": [
          {
            "text": "Luis Enrique said the team must keep reinventing itself because previous success does not solve the next season’s problems. He also described recruits adapting at different speeds and needing precise individual information. This is his stated approach to integration, not independent evidence that every signing develops successfully.",
            "sourceUrls": [
              "https://www.psg.fr/content/luis-enrique-chercher-a-se-reinventer-paris-saint-germain-sk-slovan-bratislava-uefa-champions-league-20262027"
            ],
            "period": "Paris Saint-Germain, 8 September 2026"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://www.fcbarcelona.com/en/football/first-team/news/1097737/luis-enrique-takes-treble-in-debut-season",
        "title": "Luis Enrique takes treble in debut season",
        "publisher": "FC Barcelona"
      },
      {
        "url": "https://www.psg.fr/content/luis-enrique-chercher-a-se-reinventer-paris-saint-germain-sk-slovan-bratislava-uefa-champions-league-20262027",
        "title": "Luis Enrique : « Chercher à se réinventer »",
        "publisher": "Paris Saint-Germain"
      },
      {
        "url": "https://es.coachesvoice.com/cv/luis-enrique-variables-tacticas-psg-espana-barcelona/",
        "title": "Luis Enrique: Variables tácticas",
        "publisher": "The Coaches’ Voice"
      }
    ],
    "limitations": [
      "The Coaches’ Voice page has a newer PSG introduction but its detailed tactical examples concern Spain; the periods above follow the examples.",
      "No quantified player-development effect or current recruitment feasibility is inferred from trophies or his own press-conference statements."
    ]
  },
  {
    "apiId": 2006,
    "name": "Arne Slot",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Liverpool title and confirmed departure",
        "points": [
          {
            "text": "Liverpool’s May 30, 2026 statement confirms Slot’s immediate departure after two seasons, including the 2024/25 league title and subsequent Champions League qualification. No later employer was verified in the dated role review. Liverpool should remain the historical context for this analysis, not an assumed current job.",
            "sourceUrls": [
              "https://www.liverpoolfc.com/news/liverpool-fc-statement-13/?amp=1"
            ],
            "period": "Liverpool, June 2024–30 May 2026; role reviewed 14 September 2026"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "Salah’s space and complementary central movement",
        "points": [
          {
            "text": "Slot’s early 4-2-3-1 kept Salah and the opposite winger wide enough to attack defenders individually. Szoboszlai’s supporting or decoy movement helped open Salah’s inside channel. Jota could connect play by dropping, while Núñez offered a different threat by occupying centre-backs and attacking behind them.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/arne-slot-liverpool-tactics/"
            ],
            "period": "Liverpool, opening months of 2024/25"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Selective jumps with central protection",
        "points": [
          {
            "text": "The defensive front could become 4-2-4, with Szoboszlai joining the striker and wingers narrowing. Mac Allister and Gravenberch protected the middle. The analysis describes more selective pressure and periods of midfield containment, preserving Salah as a counterattacking outlet rather than treating every moment as an all-out press.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/arne-slot-liverpool-tactics/"
            ],
            "period": "Liverpool, opening months of 2024/25"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Reorganising an inherited squad",
        "points": [
          {
            "text": "The early changes largely used the squad inherited from Klopp. The research interpretation is a redistribution of responsibilities within familiar personnel, particularly in midfield and the timing of pressure, rather than a complete replacement of the playing model.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/arne-slot-liverpool-tactics/"
            ],
            "period": "Liverpool, summer–November 2024"
          }
        ]
      },
      {
        "key": "development",
        "title": "Gravenberch’s conversion to the deeper role",
        "points": [
          {
            "text": "Slot explained that Mac Allister preferred a holding player behind him and Gravenberch impressed when tested there in pre-season. He subsequently trusted him throughout the title run. By May, Slot still identified quicker passing and finding teammates between lines as next steps, while crediting collective defensive work for the role’s success.",
            "sourceUrls": [
              "https://www.liverpoolfc.com/news/ryan-had-all-ingredients-position-and-can-still-add-his-game"
            ],
            "period": "Liverpool, summer 2024–May 2025"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://www.liverpoolfc.com/news/liverpool-fc-statement-13/?amp=1",
        "title": "Liverpool FC statement",
        "publisher": "Liverpool FC"
      },
      {
        "url": "https://learning.coachesvoice.com/cv/arne-slot-liverpool-tactics/",
        "title": "Arne Slot’s Liverpool tactics",
        "publisher": "The Coaches’ Voice"
      },
      {
        "url": "https://www.liverpoolfc.com/news/ryan-had-all-ingredients-position-and-can-still-add-his-game",
        "title": "Ryan had all the ingredients for the position - and can still add to his game",
        "publisher": "Liverpool FC"
      }
    ],
    "limitations": [
      "The tactical article covers an early sample, not the complete title season or the second campaign.",
      "The Gravenberch account combines a documented role change with Slot’s own assessment. Departure alone does not establish that Slot is unattached or obtainable."
    ]
  },
  {
    "apiId": 7248,
    "name": "Mikel Arteta",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "From assistant to sustained Arsenal project",
        "points": [
          {
            "text": "The Premier League’s August 2026 account traces Arteta from Guardiola’s assistant to his first managerial job at Arsenal, an initial FA Cup win and the 2025/26 league title. Its September 11 award announcement still identifies him with Arsenal. The tactical observations here cover earlier stages of that project.",
            "sourceUrls": [
              "https://www.premierleague.com/en/news/4679012",
              "https://www.premierleague.com/en/news/4713135/jakirovic-wins-barclays-manager-of-the-month-award"
            ],
            "period": "Manchester City, 2016–2019; Arsenal, December 2019–September 2026"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "Creating inside support without losing width",
        "points": [
          {
            "text": "Smith Rowe offered carries between lines while Ødegaard supplied progressive passes. By early 2022/23, White and Zinchenko could move infield, Jesus could drop or drift wide, and Saka and Martinelli maintained width. An advancing midfielder alongside Ødegaard helped turn the shape towards five attacking lanes.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/mikel-arteta-arsenal-pep-guardiola/"
            ],
            "period": "Arsenal, 2021–September 2022"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "From a low block to more ambitious pressure",
        "points": [
          {
            "text": "Early back-five shapes protected the team during the FA Cup period. Later, a 4-4-2 press sent the number ten alongside the striker, encouraging wide passes before a winger, full-back and midfielder converged. Greater aggression also increased the burden on central cover when the first pressure was bypassed.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/mikel-arteta-arsenal-pep-guardiola/"
            ],
            "period": "Arsenal, 2020–September 2022"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Resolving the early system’s creative limits",
        "points": [
          {
            "text": "The early back three could become rigid when both wing-backs stayed high and central creativity was limited. Subsequent use of a creative number ten and more varied full-back positions changed how Arsenal connected midfield and attack. This is a documented evolution, not proof of universal tactical flexibility.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/mikel-arteta-arsenal-pep-guardiola/"
            ],
            "period": "Arsenal, 2020–2022"
          }
        ]
      },
      {
        "key": "development",
        "title": "Different responsibilities for young attackers",
        "points": [
          {
            "text": "The analysis distinguishes Smith Rowe’s dribbling from Ødegaard’s passing and shows Saka and Martinelli occupying wider attacking roles. That supports a description of role differentiation; it cannot isolate Arteta’s contribution to their longer-term improvement.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/mikel-arteta-arsenal-pep-guardiola/"
            ],
            "period": "Arsenal, 2021–September 2022"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://www.premierleague.com/en/news/4679012",
        "title": "Manager line-up complete for 2026/27 season",
        "publisher": "Premier League"
      },
      {
        "url": "https://www.premierleague.com/en/news/4713135/jakirovic-wins-barclays-manager-of-the-month-award",
        "title": "Jakirovic wins Barclays Manager of the Month award",
        "publisher": "Premier League"
      },
      {
        "url": "https://learning.coachesvoice.com/cv/mikel-arteta-arsenal-pep-guardiola/",
        "title": "Mikel Arteta: Coach Watch",
        "publisher": "The Coaches’ Voice"
      }
    ],
    "limitations": [
      "The tactical evidence stops in September 2022 and must not be presented as analysis of the 2025/26 title-winning system.",
      "Youth deployment is documented here; individual growth, recruitment success and squad relations have not been independently measured."
    ]
  },
  {
    "apiId": 18,
    "name": "Unai Emery",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Villa’s first-year turnaround",
        "points": [
          {
            "text": "The Coaches’ Voice records Emery taking Villa from a low league position into European qualification during his first season. Villa’s September 5, 2026 post-match interview still identifies him as manager. The first-year tactical study and the later interview provide distinct snapshots, rather than an unchanged four-year system.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/unai-emery-aston-villa-tactics-style-of-play/",
              "https://www.avfc.co.uk/news/2026/september/05/postmatch-interview-emery-comfortable-with-hull-stalemate"
            ],
            "period": "Aston Villa, October 2022–November 2023; role reviewed 14 September 2026"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "Asymmetric width around Watkins",
        "points": [
          {
            "text": "Watkins combined forward runs with linking play, while Diaby offered speed and movement close to him. McGinn could move inside from a nominal wide position. One advancing full-back supplied width while the other stayed deeper, leaving a back three; when both advanced, the double pivot had to protect the centre-backs.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/unai-emery-aston-villa-tactics-style-of-play/"
            ],
            "period": "Aston Villa, 2022/23–autumn 2023"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "A mid-block can still have a high line",
        "points": [
          {
            "text": "Villa’s 4-4-2 defensive shape placed Watkins and Diaby ahead of a compact midfield. The back line remained high even in a mid-block, compressing central space. The distinction matters: waiting in midfield did not mean defending near the penalty area or removing the risk behind the defence.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/unai-emery-aston-villa-tactics-style-of-play/"
            ],
            "period": "Aston Villa, 2022/23–autumn 2023"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Possession as protection against a specific opponent",
        "points": [
          {
            "text": "After the Hull draw, Emery explained that possession was intended to reduce the opponent’s transition and set-piece opportunities, escape its press and reach the final third. He distinguished execution problems in finishing from the overall plan. This is a match-specific explanation, not a season-wide statistical conclusion.",
            "sourceUrls": [
              "https://www.avfc.co.uk/news/2026/september/05/postmatch-interview-emery-comfortable-with-hull-stalemate"
            ],
            "period": "Aston Villa at Hull, 5 September 2026"
          }
        ]
      },
      {
        "key": "management",
        "title": "Role comfort during integration",
        "points": [
          {
            "text": "Emery said new players were adapting at different speeds and linked the process to feeling confident in their positions. His emphasis was on collective structure and individual understanding; the interview does not demonstrate a measured improvement in any named recruit.",
            "sourceUrls": [
              "https://www.avfc.co.uk/news/2026/september/05/postmatch-interview-emery-comfortable-with-hull-stalemate"
            ],
            "period": "Aston Villa, 5 September 2026"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://learning.coachesvoice.com/cv/unai-emery-aston-villa-tactics-style-of-play/",
        "title": "Unai Emery tactics and style of play",
        "publisher": "The Coaches’ Voice"
      },
      {
        "url": "https://www.avfc.co.uk/news/2026/september/05/postmatch-interview-emery-comfortable-with-hull-stalemate",
        "title": "Emery comfortable with Hull stalemate",
        "publisher": "Aston Villa FC"
      }
    ],
    "limitations": [
      "The detailed Diaby-era pattern is historical; later personnel and structures require fresh match analysis.",
      "The 2026 interview is Emery’s account of his intentions. No inference is made about wage demands, availability or the feasibility of appointing him."
    ]
  },
  {
    "apiId": 1582,
    "name": "Ernesto Valverde",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Athletic foundations and Barcelona honours",
        "points": [
          {
            "text": "Barcelona’s retrospective traces Valverde from Athletic’s youth system through senior jobs including Espanyol and Olympiakos, and records two league titles, a Copa del Rey and a Spanish Super Cup at Barcelona. Athletic’s final press conference on May 23, 2026 confirms his later departure; a subsequent employer remains unverified here.",
            "sourceUrls": [
              "https://www.fcbarcelona.com/en/news/648454/ernesto-valverde-2017-2020/amp",
              "https://www.athletic-club.eus/en/news/2026/05/23/valverde-now-it-s-time-for-me-to-be-just-another-fan/"
            ],
            "period": "Athletic youth coaching from 1997/98; Barcelona, 2017–2020; departure review 14 September 2026"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "Freeing the inside channel beside a winger",
        "points": [
          {
            "text": "Athletic’s short build-up used Unai Simón and the centre-backs to find midfielders between lines, with Vesga offering balance. Nico Williams could begin wide and then attack the gap between full-back and centre-back. Nearby midfield movement drew defenders away rather than crowding the same channel.",
            "sourceUrls": [
              "https://es.coachesvoice.com/cv/ernesto-valverde-analisis-athletic-barcelona/"
            ],
            "period": "Athletic Club, 2023/24 through December 2023"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Central coverage before chasing wide",
        "points": [
          {
            "text": "The front line screened the opposition’s defenders while midfielders matched central options. The analysis identifies a mid-block as the usual reference in this period. More aggressive pressure required centre-backs to win duels, with space behind the defensive line a potential weakness when the opponent escaped.",
            "sourceUrls": [
              "https://es.coachesvoice.com/cv/ernesto-valverde-analisis-athletic-barcelona/"
            ],
            "period": "Athletic Club, 2023/24 through December 2023"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Barcelona’s post-Neymar adjustment",
        "points": [
          {
            "text": "After Neymar’s departure, Valverde used four midfielders behind Messi and Suárez rather than reproducing the previous front three. Alba’s overlapping runs supplied width. That illustrates adaptation to available attackers and their defensive workload, not a fixed formation applied equally at Athletic.",
            "sourceUrls": [
              "https://es.coachesvoice.com/cv/ernesto-valverde-analisis-athletic-barcelona/"
            ],
            "period": "Barcelona, 2017–2020"
          }
        ]
      },
      {
        "key": "development",
        "title": "Sancet’s move towards connecting midfield",
        "points": [
          {
            "text": "The tactical account describes Sancet moving from a more forward role into an interior position connecting the lines. It is evidence of an expanded positional responsibility, without establishing how much individual improvement was caused by coaching.",
            "sourceUrls": [
              "https://es.coachesvoice.com/cv/ernesto-valverde-analisis-athletic-barcelona/"
            ],
            "period": "Athletic Club, 2022–December 2023"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://www.fcbarcelona.com/en/news/648454/ernesto-valverde-2017-2020/amp",
        "title": "Ernesto Valverde (2017-2020)",
        "publisher": "FC Barcelona"
      },
      {
        "url": "https://www.athletic-club.eus/en/news/2026/05/23/valverde-now-it-s-time-for-me-to-be-just-another-fan/",
        "title": "Valverde: “Now it’s time for me to be just another fan”",
        "publisher": "Athletic Club"
      },
      {
        "url": "https://es.coachesvoice.com/cv/ernesto-valverde-analisis-athletic-barcelona/",
        "title": "Ernesto Valverde: Táctica y sistemas",
        "publisher": "The Coaches’ Voice"
      }
    ],
    "limitations": [
      "The Athletic analysis predates later seasons and cannot explain every subsequent result or tactical adjustment.",
      "Club retrospectives are useful for career facts but praise of management is not independent assessment. Athletic’s departure does not confirm retirement or current availability."
    ]
  },
  {
    "apiId": 1585,
    "name": "Marcelino Garcia Toral",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Two Villarreal spells and a confirmed ending",
        "points": [
          {
            "text": "Villarreal’s May 4, 2026 farewell announcement records Marcelino’s two spells, the 2013 promotion and European qualifications, including the 2016 Europa League semi-final. It announced separation at the season’s end. These achievements anchor the club context; the review did not verify a subsequent employer or present willingness to take another job. The club also records a Copa del Rey semi-final in 2015 and repeated qualification for European competition.",
            "sourceUrls": [
              "https://villarrealcf.es/es/gracias-marce/"
            ],
            "period": "Villarreal, 2013–2016 and 2023–2026; reviewed 14 September 2026"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "A staggered attack behind the front line",
        "points": [
          {
            "text": "The analysis describes an asymmetric 4-2-2-2 in build-up, with two players available between the lines. A pass into one could be laid back for a third teammate to progress. Further forward, the left-back supplied width while the right-back narrowed, creating a back three behind staggered midfield support.",
            "sourceUrls": [
              "https://the-footballanalyst.com/marcelino-villarreal-cf-tactical-analysis/"
            ],
            "period": "Villarreal, autumn 2024"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Compact centre and pressure near the loss",
        "points": [
          {
            "text": "Without the ball, Villarreal used a narrow 4-4-2 mid-block to encourage play outside. Players close together during attacks could immediately surround a lost ball. The high supporting defence helped compress space, but that commitment also made the organisation behind the first challenge important when pressure was escaped.",
            "sourceUrls": [
              "https://the-footballanalyst.com/marcelino-villarreal-cf-tactical-analysis/"
            ],
            "period": "Villarreal, autumn 2024"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Different answers to man-marking and deep blocks",
        "points": [
          {
            "text": "Against man-to-man pressure, the goalkeeper could play directly towards a small group of attackers rather than insisting on short passes. Against a deeper defence, a midfielder could advance behind the front line. Underlapping runs and combinations with a dropping striker offered alternatives to simply crossing from wide positions.",
            "sourceUrls": [
              "https://the-footballanalyst.com/marcelino-villarreal-cf-tactical-analysis/"
            ],
            "period": "Villarreal, autumn 2024"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://villarrealcf.es/es/gracias-marce/",
        "title": "Gracias, Marce",
        "publisher": "Villarreal CF"
      },
      {
        "url": "https://the-footballanalyst.com/marcelino-villarreal-cf-tactical-analysis/",
        "title": "Marcelino – Villarreal CF – Tactical Analysis",
        "publisher": "The Football Analyst"
      }
    ],
    "limitations": [
      "Tactical substance comes from one independent November 2024 study, cross-referenced with official career evidence; it is not a full-season audit.",
      "No sufficiently specific primary player-development or management case was verified for inclusion. The farewell’s general praise is not used as a personality rating.",
      "The 2026 departure means the Villarreal patterns are historical, not proof of his current role or appointment feasibility."
    ]
  },
  {
    "apiId": 859,
    "name": "Marcelo Gallardo",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "River’s title-winning historical setting",
        "points": [
          {
            "text": "The AFA confirms Gallardo’s River won the 2021 league with three rounds remaining after beating Racing 4–0. Its squad list includes Enzo Pérez, Nicolás De La Cruz, Enzo Fernández and Julián Álvarez. This establishes the personnel and competitive setting of the tactical study rather than identifying a current employer.",
            "sourceUrls": [
              "https://www.afa.com.ar/balconero/posts/river-se-consagro-campeon-del-torneo-socios"
            ],
            "period": "River Plate, 2021 league campaign"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "Inside connections before the decisive acceleration",
        "points": [
          {
            "text": "River combined rapid circulation with patience until a gap appeared. Inside midfielders and a dropping forward connected between lines, while full-backs supplied width. Third-player movements could exploit the space created by a teammate approaching the ball. Enzo Pérez provided an organising reference behind these exchanges.",
            "sourceUrls": [
              "https://es.coachesvoice.com/cv/variables-tacticas-marcelo-gallardo-river-plate-argentina-copa-libertadores/"
            ],
            "period": "River Plate, 2020–2021"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Counterpressure with an exposed space behind it",
        "points": [
          {
            "text": "Players converged on the ball after possession was lost. Against goal-kick build-up, River could mark closely and push its centre-backs high to support pressure. The study also identifies vulnerability behind advanced full-backs in early 2021, so the aggressive approach should not be read as uniformly secure.",
            "sourceUrls": [
              "https://es.coachesvoice.com/cv/variables-tacticas-marcelo-gallardo-river-plate-argentina-copa-libertadores/"
            ],
            "period": "River Plate, 2020–2021"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Changing numbers without abandoning connections",
        "points": [
          {
            "text": "Gallardo varied between 4-3-3 and 4-2-3-1 and could introduce a back three or drop Pérez deeper. The interpretation is flexibility in the starting structure while retaining inside combinations and coordinated movement, rather than a single permanent formation.",
            "sourceUrls": [
              "https://es.coachesvoice.com/cv/variables-tacticas-marcelo-gallardo-river-plate-argentina-copa-libertadores/"
            ],
            "period": "River Plate, 2020–2021"
          }
        ]
      },
      {
        "key": "development",
        "title": "Álvarez: promotion followed by demanding minutes",
        "points": [
          {
            "text": "Manchester City’s account records Gallardo promoting Álvarez to River’s senior squad, giving him his October 2018 debut and using him from the bench in that year’s Libertadores final. This documents early trust on a major stage; it does not attribute the player’s entire later career to one coach.",
            "sourceUrls": [
              "https://live.mancity.com/news/mens/julian-alvarez-10-things-you-didnt-know-factfile-63792863"
            ],
            "period": "River Plate, 2018–2021"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://www.afa.com.ar/balconero/posts/river-se-consagro-campeon-del-torneo-socios",
        "title": "River se consagró campeón del Torneo Socios",
        "publisher": "Asociación del Fútbol Argentino"
      },
      {
        "url": "https://es.coachesvoice.com/cv/variables-tacticas-marcelo-gallardo-river-plate-argentina-copa-libertadores/",
        "title": "Marcelo Gallardo: Variables tácticas",
        "publisher": "The Coaches’ Voice"
      },
      {
        "url": "https://live.mancity.com/news/mens/julian-alvarez-10-things-you-didnt-know-factfile-63792863",
        "title": "10 things you didn’t know about Julian Alvarez",
        "publisher": "Manchester City FC"
      }
    ],
    "limitations": [
      "The tactical evidence concerns River in 2020–2021, not later River spells, Al-Ittihad or international football.",
      "As of the 14 September 2026 review, direct primary confirmation of a current appointment was unresolved. No present employer or unattached status is asserted.",
      "The Álvarez account is a receiving club’s retrospective, not a controlled measure of development."
    ]
  },
  {
    "apiId": 127,
    "name": "Jorge Sampaoli",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Brazilian results and later departures",
        "points": [
          {
            "text": "Atlético Mineiro records Sampaoli’s 2020 state title, third place in that year’s national league and a later 2025 Sudamericana runner-up finish. Its February 2026 departure was followed by a separate Talleres termination on August 30. The September 14 review cannot retain either as his current employer; no later role was verified.",
            "sourceUrls": [
              "https://atletico.com.br/jorge-sampaoli-nao-e-mais-o-treinador-do-galo/",
              "https://www.clubtalleres.com.ar/comunicado-oficial-3/"
            ],
            "period": "Atlético Mineiro, 2020 and later spell ending February 2026; Talleres, August 2026"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "Building centrally, then changing the point of attack",
        "points": [
          {
            "text": "Chile used Aránguiz to connect play, Vidal to advance and Isla and Beausejour to provide width. At Santos, Éverson, the centre-backs and a holding midfielder could form a build-up diamond. Midfielders occupied different heights so possession could move through pressure before being transferred towards the flanks.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/jorge-sampaoli-marseille-chile-marcelo-bielsa/"
            ],
            "period": "Chile, 2014; Santos, 2019"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Different pressing heights in different teams",
        "points": [
          {
            "text": "At Sevilla, Ben Yedder initiated pressure while inside players screened central passes and wide players advanced. Santos could instead defend in 4-1-4-1 with Alison covering behind midfield. Atlético’s higher pressure used Allan and Jair to support the first wave, showing that intensity and block height were not identical across jobs.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/jorge-sampaoli-marseille-chile-marcelo-bielsa/"
            ],
            "period": "Sevilla, 2016/17; Santos, 2019; Atlético Mineiro, 2020/21"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Shape followed the midfield and attacking roles",
        "points": [
          {
            "text": "Chile’s 3-5-2 increased midfield numbers. Argentina used configurations including 4-2-3-1 and 3-4-2-1, with narrow attacking support behind the striker. The recurring theme is rearranging central connections and wide outlets rather than treating one formation as his identity.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/jorge-sampaoli-marseille-chile-marcelo-bielsa/"
            ],
            "period": "Chile, 2014; Argentina, 2017–2018"
          }
        ]
      },
      {
        "key": "management",
        "title": "A qualified club assessment at departure",
        "points": [
          {
            "text": "Talleres thanked Sampaoli for his relationship with players and support for academy football while acknowledging results had fallen short of expectations. This is an attributed club assessment, with no named development case or independent evidence of dressing-room outcomes.",
            "sourceUrls": [
              "https://www.clubtalleres.com.ar/comunicado-oficial-3/"
            ],
            "period": "Talleres, 30 August 2026"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://atletico.com.br/jorge-sampaoli-nao-e-mais-o-treinador-do-galo/",
        "title": "Jorge Sampaoli não é mais o treinador do Galo",
        "publisher": "Clube Atlético Mineiro"
      },
      {
        "url": "https://www.clubtalleres.com.ar/comunicado-oficial-3/",
        "title": "Comunicado Oficial",
        "publisher": "Club Atlético Talleres"
      },
      {
        "url": "https://learning.coachesvoice.com/jorge-sampaoli-marseille-chile-marcelo-bielsa/",
        "title": "Jorge Sampaoli: Coach Watch",
        "publisher": "The Coaches’ Voice"
      }
    ],
    "limitations": [
      "The tactical study’s examples precede his later Marseille, Flamengo, Rennes and 2026 work; its updated heading must not extend those examples forward.",
      "The farewell provides limited management evidence. It does not establish current employment status, willingness to move or measurable youth-development impact."
    ]
  },
  {
    "apiId": 3081,
    "name": "Domenico Tedesco",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Youth coaching, senior variety and Bologna appointment",
        "points": [
          {
            "text": "Bologna’s appointment announcement traces Tedesco from Stuttgart and Hoffenheim youth coaching through Aue, Schalke, Spartak, Leipzig, Belgium and Fenerbahçe. It records his Schalke runner-up finish and Leipzig’s 2021/22 German cup win. Bologna appointed him in June 2026 and its September 12 press-conference notice still names him as coach.",
            "sourceUrls": [
              "https://www.bolognafc.it/en/domenico-tedesco-is-the-new-head-coach-of-bologna/",
              "https://www.bolognafc.it/domani-vigilia-di-napoli-bologna-conferenza-di-tedesco-alle-12/"
            ],
            "period": "Senior career through June 2026; Bologna role reviewed 14 September 2026"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "A deep organiser and a mobile front line",
        "points": [
          {
            "text": "In the study’s opening eight-game sample, Kampl supported the back three to create a build-up diamond. Olmo could drop from the front while Nkunku attacked from an inside position and Silva occupied the striker role. Short distances enabled combinations, with Angeliño supplying a high, wide outlet.",
            "sourceUrls": [
              "https://themastermindsite.com/2022/02/12/domenico-tedesco-rb-leipzig-tactical-analysis/"
            ],
            "period": "RB Leipzig, December 2021–February 2022"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Selective pressure above a compact five",
        "points": [
          {
            "text": "Leipzig could recover into 5-3-2 or 5-2-1-2, with Olmo helping midfield and forwards ready to counter. Higher pressure was selective: a poor touch or receiver facing backwards could trigger a jump. Laimer advanced while Kampl often protected deeper space, and Orbán organised the defensive line. Wing-backs recovering from advanced positions left channels beside the outside centre-backs, a risk the study identifies when opponents escaped the counterpress.",
            "sourceUrls": [
              "https://themastermindsite.com/2022/02/12/domenico-tedesco-rb-leipzig-tactical-analysis/"
            ],
            "period": "RB Leipzig, December 2021–February 2022"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Replacing a function when the usual player was absent",
        "points": [
          {
            "text": "Against Köln without Kampl, the analysis describes Orbán stepping towards midfield and Olmo dropping, allowing other midfielders to advance. That provides a specific example of redistributing the deep build-up role. It does not prove that the same solution worked across later leagues or international football.",
            "sourceUrls": [
              "https://themastermindsite.com/2022/02/12/domenico-tedesco-rb-leipzig-tactical-analysis/"
            ],
            "period": "RB Leipzig, early 2022"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://www.bolognafc.it/en/domenico-tedesco-is-the-new-head-coach-of-bologna/",
        "title": "Domenico Tedesco is the new Head Coach of Bologna",
        "publisher": "Bologna FC 1909"
      },
      {
        "url": "https://www.bolognafc.it/domani-vigilia-di-napoli-bologna-conferenza-di-tedesco-alle-12/",
        "title": "Oggi vigilia di Napoli-Bologna, conferenza di Tedesco alle 12",
        "publisher": "Bologna FC 1909"
      },
      {
        "url": "https://themastermindsite.com/2022/02/12/domenico-tedesco-rb-leipzig-tactical-analysis/",
        "title": "Domenico Tedesco – RB Leipzig – Tactical Analysis",
        "publisher": "TheMastermindSite / Rhys Desmond"
      }
    ],
    "limitations": [
      "The independent tactical study uses only eight early Leipzig matches. Its favourable initial assessment is not a complete evaluation of his tenure.",
      "Youth-coaching employment is established, but no named development outcome or robust management case was verified for inclusion.",
      "Bologna’s September 2026 role is distinct from the historical Leipzig system; Belgian and Turkish tactics need separate research. No availability inference is made."
    ]
  },
  {
    "apiId": 2393,
    "name": "Gian Piero Gasperini",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Atalanta’s European trophy and Roma role",
        "points": [
          {
            "text": "UEFA records Atalanta’s 3–0 Europa League final win over Leverkusen as Gasperini’s first major trophy, with Lookman scoring all three. Roma’s September 9, 2026 press conference identifies him as its coach. The older Atalanta build-up below is historical evidence, separately dated from that current role.",
            "sourceUrls": [
              "https://www.uefa.com/uefaeuropaleague/news/028d-1af3bf5e7e68-7d9202792002-1000--report-lookman-treble-wins-europa-league-for-atalanta/",
              "https://www.asroma.com/it/notizie/75912/la-conferenza-stampa-di-gasperini-alla-vigilia-di-fenerbahce-roma"
            ],
            "period": "Atalanta, May 2024; Roma role reviewed 14 September 2026"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "A back three designed to support attacks",
        "points": [
          {
            "text": "Atalanta spread its centre-backs around the first pass, with Palomino available near the goalkeeper and midfielders offering different passing heights. Papu Gómez connected towards the final third, while Gosens and Hateboer advanced to deliver from wide areas. Several attackers could arrive in the box; three defenders did not imply a cautious attack.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/gian-piero-gasperini-atalanta-serie-a-inter-milan/"
            ],
            "period": "Atalanta, 2019/20"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Pressure first, a narrower recovery shape if needed",
        "points": [
          {
            "text": "The earlier study describes pressure aimed at forcing direct passes, followed by a compact 5-3-2 when retreating. UEFA’s final report provides a later match example: Atalanta pressed aggressively early but defended somewhat deeper after half-time. This supports variation by phase without claiming every match followed the same script.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/gian-piero-gasperini-atalanta-serie-a-inter-milan/",
              "https://www.uefa.com/uefaeuropaleague/news/028d-1af3bf5e7e68-7d9202792002-1000--report-lookman-treble-wins-europa-league-for-atalanta/"
            ],
            "period": "Atalanta, 2019/20; Europa League final, 22 May 2024"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Identity alongside rotation and opponent study",
        "points": [
          {
            "text": "Ahead of Fenerbahçe, Gasperini asked Roma to retain the characteristics that had brought them into the Champions League. He also emphasised rotation during a crowded schedule and watching several opposition matches. These are declared preparation priorities, rather than proof of a particular formation or successful rotation policy.",
            "sourceUrls": [
              "https://www.asroma.com/it/notizie/75912/la-conferenza-stampa-di-gasperini-alla-vigilia-di-fenerbahce-roma"
            ],
            "period": "Roma, 9 September 2026"
          }
        ]
      },
      {
        "key": "development",
        "title": "Lookman’s account of his progress",
        "points": [
          {
            "text": "After the final, Lookman told UEFA his game had reached a new level over the preceding two years. That is meaningful player testimony about his Atalanta period, but does not isolate Gasperini’s contribution from teammates, opportunity or the player’s own work.",
            "sourceUrls": [
              "https://www.uefa.com/uefaeuropaleague/news/028d-1af3bf5e7e68-7d9202792002-1000--report-lookman-treble-wins-europa-league-for-atalanta/"
            ],
            "period": "Atalanta, 2022–May 2024"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://www.uefa.com/uefaeuropaleague/news/028d-1af3bf5e7e68-7d9202792002-1000--report-lookman-treble-wins-europa-league-for-atalanta/",
        "title": "Atalanta 3-0 Leverkusen: Lookman treble brings UEFA Europa League glory to Bergamo",
        "publisher": "UEFA"
      },
      {
        "url": "https://www.asroma.com/it/notizie/75912/la-conferenza-stampa-di-gasperini-alla-vigilia-di-fenerbahce-roma",
        "title": "La conferenza stampa di Gasperini alla vigilia di Fenerbahce-Roma",
        "publisher": "AS Roma"
      },
      {
        "url": "https://learning.coachesvoice.com/gian-piero-gasperini-atalanta-serie-a-inter-milan/",
        "title": "Coach watch: Gian Piero Gasperini",
        "publisher": "The Coaches’ Voice"
      }
    ],
    "limitations": [
      "The detailed build-up study is from 2020 and should not be relabelled as Roma’s 2026 system.",
      "The final is one match and Lookman’s comments are individual testimony, not an academy-production or development score. No current appointment feasibility is inferred."
    ]
  }
]
