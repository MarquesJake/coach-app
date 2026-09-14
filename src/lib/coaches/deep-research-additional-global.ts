import type { DeepResearchProfile } from './deep-research-types'

// Editorial interpretation of opened sources, reviewed 2026-09-14.
// Historical periods and assistant roles are explicit; these are not API metrics or scoring inputs.
export const DEEP_ADDITIONAL_GLOBAL_PROFILES: DeepResearchProfile[] = [
  {
    "apiId": 31,
    "name": "Julien Stephan",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Career context",
        "points": [
          {
            "text": "Stéphan’s first Rennes spell included the 2019 French Cup and third place in 2020. He subsequently led Strasbourg to sixth in 2022. Rennes’ account of his return therefore describes experience of both cup success and league overperformance before a second spell with different staff responsibilities.",
            "sourceUrls": [
              "https://www.srfc.bzh/article/2024/actualite/tactique-management-communication-la-methode-avec-laquelle-julien-stephan-a-redresse-rennes"
            ],
            "period": "Rennes 2018–2021; Strasbourg 2021–2022; Rennes return 2023–2024"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "In possession",
        "points": [
          {
            "text": "The tactical review describes increasing possession through a 4-1-4-1, with Steven Nzonzi connecting the centre-backs to advanced midfielders. Full-backs supplied width while wingers moved inside. Overloading one side could precede a switch; forwards alternated dropping towards the ball and threatening the space behind defenders.",
            "sourceUrls": [
              "https://totalfootballanalysis.com/article/julien-stephan-at-strasbourg-202122-tactical-analysis-tactics"
            ],
            "period": "Rennes 2019–2021"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Out of possession",
        "points": [
          {
            "text": "Rennes combined counterpressing with protection of central space. Pressure was not simply a permanent instruction to commit everyone forward: the analysis describes greater attacking commitment when chasing games. Compactness and the response to losing possession should therefore be assessed alongside the starting formation.",
            "sourceUrls": [
              "https://totalfootballanalysis.com/article/julien-stephan-at-strasbourg-202122-tactical-analysis-tactics"
            ],
            "period": "Rennes 2019–2021"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Adaptability",
        "points": [
          {
            "text": "The same study records a move away from earlier double-pivot counterattacking structures. Direct service towards Niang or Guirassy remained an alternative to shorter construction, giving the team a route around pressure when combinations through midfield were unavailable.",
            "sourceUrls": [
              "https://totalfootballanalysis.com/article/julien-stephan-at-strasbourg-202122-tactical-analysis-tactics"
            ],
            "period": "Rennes 2019–2021"
          }
        ]
      },
      {
        "key": "management",
        "title": "Management and communication",
        "points": [
          {
            "text": "The club-published feature includes player accounts of calm, participative communication and persuading Dimitri Liénard to play wing-back. At Rennes, video presentation duties were shared more widely with assistants. These are concrete examples of role explanation and delegation, rather than an independently measured leadership rating.",
            "sourceUrls": [
              "https://www.srfc.bzh/article/2024/actualite/tactique-management-communication-la-methode-avec-laquelle-julien-stephan-a-redresse-rennes"
            ],
            "period": "Strasbourg 2021–2022; Rennes 2023–2024"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://totalfootballanalysis.com/article/julien-stephan-at-strasbourg-202122-tactical-analysis-tactics",
        "title": "Julien Stéphan Coaching Style – Analyzing The New RC Strasbourg Boss",
        "publisher": "Total Football Analysis"
      },
      {
        "url": "https://www.srfc.bzh/article/2024/actualite/tactique-management-communication-la-methode-avec-laquelle-julien-stephan-a-redresse-rennes",
        "title": "Tactique, management, communication... la méthode avec laquelle Julien Stéphan a redressé Rennes",
        "publisher": "Stade Rennais FC"
      }
    ],
    "limitations": [
      "The tactical article’s displayed 2025 date accompanies a retrospective Rennes analysis and Strasbourg preview; its mechanisms are not observations of a 2025 team.",
      "The Rennes management feature republishes reporting and player testimony. These historical sources do not verify an employer or availability on 14 September 2026."
    ]
  },
  {
    "apiId": 55,
    "name": "Vitor Pereira",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Career context",
        "points": [
          {
            "text": "Pereira assisted André Villas-Boas during Porto’s 2010/11 treble, then became head coach. His own two seasons in charge brought successive league titles and only one league defeat in 60 matches. The assistant contribution and subsequent head-coach achievements are distinct stages of this record.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/vitor-pereira-porto-tactics/"
            ],
            "period": "Porto 2010–2013"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "In possession",
        "points": [
          {
            "text": "Pereira’s club interview summary stresses controlling rhythm rather than attacking at an emotionally driven pace. Inviting Manchester City’s pressure was one example of his willingness to wait for a useful opening. This supports a situational approach to tempo, rather than an assumption that every attack should be immediate.",
            "sourceUrls": [
              "https://www.wolves.co.uk/news/club/20250529-wolves-unpacked-pereira-breaks-down-the-secrets-to-his-success/?isNative=true&lang=en"
            ],
            "period": "Wolves 2024–2025"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Out of possession",
        "points": [
          {
            "text": "Premier League analysis highlights André and João Gomes protecting the three centre-backs and recovering possession in their own half. Emmanuel Agbadou strengthened the central defensive role. The defensive description concerns that personnel combination and period, rather than a universal pressing intensity attached to Pereira’s name.",
            "sourceUrls": [
              "https://www.premierleague.com/en/news/4304090"
            ],
            "period": "Wolves, analysis published 6 May 2025"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Adaptability",
        "points": [
          {
            "text": "The league review found a consistent 3-4-2-1 across his first 19 matches, in contrast with the preceding formation changes. Matt Doherty’s use at centre-back illustrates adaptation within a settled structure. Six unchanged starting line-ups also suggest that familiarity mattered during this particular recovery.",
            "sourceUrls": [
              "https://www.premierleague.com/en/news/4304090"
            ],
            "period": "Wolves first 19 league games under Pereira, 2024–2025"
          }
        ]
      },
      {
        "key": "management",
        "title": "Management and communication",
        "points": [
          {
            "text": "With only three training sessions before his first Leicester match, Pereira described selecting the most immediately usable parts of his model. His account connects player receptiveness and physical readiness with collective belief, including relationships with supporters. It documents his explanation of the turnaround, not a causal evaluation.",
            "sourceUrls": [
              "https://www.wolves.co.uk/news/club/20250529-wolves-unpacked-pereira-breaks-down-the-secrets-to-his-success/?isNative=true&lang=en"
            ],
            "period": "Wolves arrival and 2024–2025 recovery"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://learning.coachesvoice.com/cv/vitor-pereira-porto-tactics/",
        "title": "Vítor Pereira’s Porto tactics",
        "publisher": "The Coaches’ Voice"
      },
      {
        "url": "https://www.premierleague.com/en/news/4304090",
        "title": "Analysis: How Pereira made Wolves one of Europe’s most in-form teams",
        "publisher": "Premier League"
      },
      {
        "url": "https://www.wolves.co.uk/news/club/20250529-wolves-unpacked-pereira-breaks-down-the-secrets-to-his-success/?isNative=true&lang=en",
        "title": "Wolves Unpacked | Pereira breaks down the secrets to his success",
        "publisher": "Wolverhampton Wanderers"
      }
    ],
    "limitations": [
      "Porto evidence uses the written masterclass introduction; no additional details are inferred from an unwatched video.",
      "Wolves material is historical 2024/25 evidence and does not establish employment, contractual terms or availability on 14 September 2026."
    ]
  },
  {
    "apiId": 783,
    "name": "Paulo Pezzolano",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Career context",
        "points": [
          {
            "text": "Pezzolano’s Valladolid period crossed relegation and the subsequent promotion campaign. The club’s promotion report records his return of the team to the top division with one fixture remaining. His response foregrounded players, colleagues and family after a difficult season, rather than presenting promotion as an individual accomplishment.",
            "sourceUrls": [
              "https://www.realvalladolid.es/noticias/pezzolano-ascenso-valladolid-orgulloso"
            ],
            "period": "Real Valladolid 2023–2024"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "In possession",
        "points": [
          {
            "text": "In his first-person account, Pachuca used fast wide players and rehearsed construction from the goalkeeper to release vertical attacks. At Cruzeiro, he describes more positional organisation. The comparison supports different attacking routes within his career, rather than treating ball possession as an identical objective at every club.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/paulo-pezzolano/"
            ],
            "period": "Pachuca 2020–2021; Cruzeiro 2022–2023"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Out of possession",
        "points": [
          {
            "text": "He describes Cruzeiro defending high, with positioning behind attacks intended to control the next transition. Valladolid’s slower defensive personnel required a different risk calculation. These are his explanations of the relationship between player characteristics and defensive exposure, rather than independently tracked pressure or recovery measurements.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/paulo-pezzolano/"
            ],
            "period": "Cruzeiro 2022–2023; Valladolid 2023–2024"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Adaptability",
        "points": [
          {
            "text": "At Valladolid he describes accepting less possession and seeking quicker progress down the flanks. The adjustment is specifically linked to the squad available; it does not establish that a direct approach is his permanent preference or would suit an unrelated appointment.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/paulo-pezzolano/"
            ],
            "period": "Valladolid 2023–2024"
          }
        ]
      },
      {
        "key": "management",
        "title": "Management and communication",
        "points": [
          {
            "text": "The official post-promotion interview records Pezzolano acknowledging injuries and the strain of the campaign while crediting the working group. This provides a concrete example of public recognition after success. It cannot establish how every player experienced his daily communication or how disagreements were handled privately.",
            "sourceUrls": [
              "https://www.realvalladolid.es/noticias/pezzolano-ascenso-valladolid-orgulloso"
            ],
            "period": "Valladolid promotion, May 2024"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://learning.coachesvoice.com/cv/paulo-pezzolano/",
        "title": "Building a team",
        "publisher": "The Coaches’ Voice"
      },
      {
        "url": "https://www.realvalladolid.es/noticias/pezzolano-ascenso-valladolid-orgulloso",
        "title": "Pezzolano, orgulloso tras el ascenso del Real Valladolid",
        "publisher": "Real Valladolid CF"
      }
    ],
    "limitations": [
      "Tactical statements are the coach’s retrospective account. Player-development causality and detailed training outcomes have not been independently established here.",
      "The club report anchors promotion timing; no employer or availability on 14 September 2026 is inferred from the 2025 interview."
    ]
  },
  {
    "apiId": 1328,
    "name": "Tim Walter",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Career context",
        "points": [
          {
            "text": "HSV’s contemporary training report identifies Walter’s preceding senior head-coach spells at Holstein Kiel and Stuttgart before documenting his own work at the Hamburg camp. The report concerns the installation of a playing approach in July 2021, rather than proof that its intended effects persisted throughout his tenure.",
            "sourceUrls": [
              "https://www.hsv.de/news/das-prinzip-walter-so-laesst-der-coach-trainieren"
            ],
            "period": "Holstein Kiel 2018–2019; Stuttgart 2019; HSV July 2021"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "In possession",
        "points": [
          {
            "text": "The tactical study describes Daniel Heuer Fernandes joining the defensive line as an additional build-up player. Centre-backs and full-backs exchanged positions, drawing opponents away from their starting assignments. An advancing centre-back could free a full-back to travel inside and connect with a winger, opening routes beyond the first pressure.",
            "sourceUrls": [
              "https://totalfootballanalysis.com/team-analysis/hamburger-sv-202223-their-tactics-under-tim-walter-scout-report-tactical-analysis-tactics"
            ],
            "period": "HSV, early 2022–2023 season"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Adaptability",
        "points": [
          {
            "text": "These rotations were functional attempts to displace markers, not merely changes to a formation graphic. The goalkeeper’s involvement helped create an extra passing option before the team accelerated forward. The analysis therefore supports a connection between elaborate early construction and rapid progression once an opening appeared.",
            "sourceUrls": [
              "https://totalfootballanalysis.com/team-analysis/hamburger-sv-202223-their-tactics-under-tim-walter-scout-report-tactical-analysis-tactics"
            ],
            "period": "HSV, early 2022–2023 season"
          }
        ]
      },
      {
        "key": "development",
        "title": "Player development",
        "points": [
          {
            "text": "HSV observed frequent competitive games on specially marked pitches and relatively little isolated drill work. Walter asked players to make assertive one-against-one decisions even during build-up, while prioritising vertical passes with few touches. This documents the learning environment without measuring individual improvement.",
            "sourceUrls": [
              "https://www.hsv.de/news/das-prinzip-walter-so-laesst-der-coach-trainieren"
            ],
            "period": "HSV preseason, July 2021"
          }
        ]
      },
      {
        "key": "management",
        "title": "Management and communication",
        "points": [
          {
            "text": "The club describes clear instructions and vocal praise, with relatively few interruptions to playing exercises. Assistants also led activities and held individual conversations. Humorous competitive forfeits accompanied the demanding sessions, providing a specific example of how intensity and enjoyment were combined in that camp.",
            "sourceUrls": [
              "https://www.hsv.de/news/das-prinzip-walter-so-laesst-der-coach-trainieren"
            ],
            "period": "HSV preseason, July 2021"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://totalfootballanalysis.com/team-analysis/hamburger-sv-202223-their-tactics-under-tim-walter-scout-report-tactical-analysis-tactics",
        "title": "Tim Walter Tactics At Hamburger SV – Rotating Back-Four And A Ball-Playing Goalkeeper",
        "publisher": "Total Football Analysis"
      },
      {
        "url": "https://www.hsv.de/news/das-prinzip-walter-so-laesst-der-coach-trainieren",
        "title": "Das Prinzip Walter: So lässt der Coach in Grassau trainieren",
        "publisher": "Hamburger SV"
      }
    ],
    "limitations": [
      "The tactical page displays a 2025 publication date but its match and squad discussion concerns early 2022/23.",
      "A full defensive model and later employment are not verified by this selection. July 2021 training observations are not a current-role statement for 14 September 2026."
    ]
  },
  {
    "apiId": 1518,
    "name": "Philippe Clement",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Career context",
        "points": [
          {
            "text": "Monaco’s appointment announcement distinguishes Clement’s Brugge youth and assistant work from his later senior leadership. After Waasland-Beveren, he won the 2019 Belgian league with Genk and the next two with Brugge. These titles belong to his head-coach record, rather than being transferred from his earlier assistant period.",
            "sourceUrls": [
              "https://www.asmonaco.com/en/news/philippe-clement-becomes-as-monaco-coach"
            ],
            "period": "Club Brugge 2011–2017; Belgian head-coach roles 2017–2021; Monaco January 2022"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "In possession",
        "points": [
          {
            "text": "Clement described positional exchanges intended to create space for teammates, supported by an underlying structure. His stated ambition was to dominate games, but he acknowledged that available preparation time mattered. This is a declared attacking model at appointment, rather than evidence that every subsequent opponent was controlled.",
            "sourceUrls": [
              "https://www.rangers.co.uk/article/clement-highlights-the-importance-of-the-fans/3cZ6WtjrxHZGSaqkEJbab5"
            ],
            "period": "Rangers presentation, October 2023"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Out of possession",
        "points": [
          {
            "text": "The same explanation connected attacking organisation with protection against transitions. He accepted that players would make mistakes but stressed the immediate response afterwards. That supports attention to reaction and collective positioning; it does not provide a measured high-press frequency or a complete description of defensive triggers.",
            "sourceUrls": [
              "https://www.rangers.co.uk/article/clement-highlights-the-importance-of-the-fans/3cZ6WtjrxHZGSaqkEJbab5"
            ],
            "period": "Rangers presentation, October 2023"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Adaptability",
        "points": [
          {
            "text": "After the Dundee win, Clement discussed balancing attack and defence, second-half impatience and positional adjustments. The example shows him evaluating match control beyond the scoreline. A single clean sheet and limited goalkeeper involvement cannot establish defensive reliability across a season or against stronger opposition.",
            "sourceUrls": [
              "https://www.rangers.co.uk/article/philippe-clement-an-important-clean-sheet/2zYPW8gMflIJReh4722gV5"
            ],
            "period": "Rangers against Dundee, December 2024"
          }
        ]
      },
      {
        "key": "management",
        "title": "Management and communication",
        "points": [
          {
            "text": "With very little training time before the first fixture, Clement framed automatic combinations as something requiring repeated work. His presentation joined technical and tactical development with physical and mental preparation. These were expectations communicated to players and supporters, not independently verified assessments of his leadership impact.",
            "sourceUrls": [
              "https://www.rangers.co.uk/article/clement-highlights-the-importance-of-the-fans/3cZ6WtjrxHZGSaqkEJbab5"
            ],
            "period": "Rangers arrival, October 2023"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://www.asmonaco.com/en/news/philippe-clement-becomes-as-monaco-coach",
        "title": "Philippe Clement becomes AS Monaco coach",
        "publisher": "AS Monaco"
      },
      {
        "url": "https://www.rangers.co.uk/article/clement-highlights-the-importance-of-the-fans/3cZ6WtjrxHZGSaqkEJbab5",
        "title": "Clement Highlights The Importance Of The Fans",
        "publisher": "Rangers FC"
      },
      {
        "url": "https://www.rangers.co.uk/article/philippe-clement-an-important-clean-sheet/2zYPW8gMflIJReh4722gV5",
        "title": "Philippe Clement: An Important Clean Sheet",
        "publisher": "Rangers FC"
      }
    ],
    "limitations": [
      "Rangers presentation material records intentions; the Dundee interview is one match. Neither establishes a complete observed tactical model.",
      "The Belgian career evidence and historical Rangers spells do not verify his employer or availability on 14 September 2026."
    ]
  },
  {
    "apiId": 1541,
    "name": "David Wagner",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Career context",
        "points": [
          {
            "text": "The league’s review concerns Wagner’s work as Huddersfield head coach in the promotion season, while Norwich’s interview records his later arrival as head coach there. The two sources offer an observed earlier team and a subsequent statement of intent; they should not be read as one continuous tactical sample.",
            "sourceUrls": [
              "https://www.premierleague.com/en/news/419633",
              "https://www.canaries.co.uk/content/david-wagner-on-his-style-of-play"
            ],
            "period": "Huddersfield promotion season 2016–2017; Norwich appointment January 2023"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "In possession",
        "points": [
          {
            "text": "Huddersfield generally used a 4-2-3-1 and trusted shorter passing while stretching the pitch. Full-back and winger combinations were prominent, including Tommy Smith with Elias Kachunga on the right. The league analysis identifies this flank relationship as an important attacking route rather than reducing the team to pressing alone.",
            "sourceUrls": [
              "https://www.premierleague.com/en/news/419633"
            ],
            "period": "Huddersfield 2016–2017"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Out of possession",
        "points": [
          {
            "text": "The analysis describes pressure arriving in groups of two or three, but also Huddersfield sitting back in the play-off final. This is evidence of variation within the promotion campaign. Its suggestions about the forthcoming Premier League season were forecasts, not observations of how that later season unfolded.",
            "sourceUrls": [
              "https://www.premierleague.com/en/news/419633"
            ],
            "period": "Huddersfield 2016–2017"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Adaptability",
        "points": [
          {
            "text": "Wagner said establishing an intense, assertive approach required time on the training pitch and supporting video work. He linked rebuilding confidence to practical work on the field. His insistence on challenging opponents away as well as at home was an intention at appointment, not a verified away-performance outcome.",
            "sourceUrls": [
              "https://www.canaries.co.uk/content/david-wagner-on-his-style-of-play"
            ],
            "period": "Norwich appointment, January 2023"
          }
        ]
      },
      {
        "key": "management",
        "title": "Management and communication",
        "points": [
          {
            "text": "He described moving players and staff outside familiar routines while supporting them through the change. The emphasis is on challenge combined with assistance, rather than simply demanding effort. This interview establishes his stated management approach but does not independently measure player responses or development gains.",
            "sourceUrls": [
              "https://www.canaries.co.uk/content/david-wagner-on-his-style-of-play"
            ],
            "period": "Norwich appointment, January 2023"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://www.premierleague.com/en/news/419633",
        "title": "Huddersfield may need to resist urge to attack",
        "publisher": "Premier League"
      },
      {
        "url": "https://www.canaries.co.uk/content/david-wagner-on-his-style-of-play",
        "title": "Wagner on preferred style of play",
        "publisher": "Norwich City FC"
      }
    ],
    "limitations": [
      "No senior assistant achievements are attributed to Wagner. The Huddersfield evidence is explicitly the promotion period.",
      "The Norwich interview does not verify implementation across his tenure or current employment on 14 September 2026."
    ]
  },
  {
    "apiId": 1916,
    "name": "Gerhard Struber",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Career context",
        "points": [
          {
            "text": "New York’s appointment profile records Struber taking over Barnsley at the bottom of the Championship in November 2019 and securing survival. This was senior head-coach responsibility before his MLS move. The profile also identifies Wolfsberger as an earlier head-coach post; inherited results and youth honours are not reassigned here.",
            "sourceUrls": [
              "https://www.newyorkredbulls.com/news/get-know-new-york-red-bulls-head-coach-gerhard-struber"
            ],
            "period": "Barnsley 2019–2020; New York appointment 2020"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "In possession",
        "points": [
          {
            "text": "The match analysis describes a midfield diamond and combinations using a bounce pass to release a third player. Aaron Long, Frankie Amaya and Caden Clark feature in this mechanism. A goalkeeper pass beyond midfield also connected with Dru Yearwood before a forward run, illustrating an alternative to continuous short construction.",
            "sourceUrls": [
              "https://runningtheshowblog.wordpress.com/2021/05/10/tactical-analysis-new-york-red-bulls-tactics-gerhard-struber/"
            ],
            "period": "New York Red Bulls against Toronto, May 2021"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Out of possession",
        "points": [
          {
            "text": "Backward passes and receivers facing their own goal triggered pressure. Strikers guided play wide, with the nearest midfielder and full-back supporting the trap. Sean Davis protected space outside a centre-back when the full-back advanced, making cover behind the press an identifiable part of this particular match plan.",
            "sourceUrls": [
              "https://runningtheshowblog.wordpress.com/2021/05/10/tactical-analysis-new-york-red-bulls-tactics-gerhard-struber/"
            ],
            "period": "New York Red Bulls against Toronto, May 2021"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Adaptability",
        "points": [
          {
            "text": "When early short build-up struggled, New York played longer and contested second balls. Drawing Toronto deeper subsequently made shorter progression easier. This supports adapting the route of attack within a game rather than assuming that the diamond required one fixed passing style throughout.",
            "sourceUrls": [
              "https://runningtheshowblog.wordpress.com/2021/05/10/tactical-analysis-new-york-red-bulls-tactics-gerhard-struber/"
            ],
            "period": "New York Red Bulls against Toronto, May 2021"
          }
        ]
      },
      {
        "key": "development",
        "title": "Player development",
        "points": [
          {
            "text": "Amaya and Clark were given active combination roles within the analysed movements. Their involvement shows specific attacking responsibilities; it does not demonstrate that Struber caused subsequent career progress or establish a general youth-development success rate.",
            "sourceUrls": [
              "https://runningtheshowblog.wordpress.com/2021/05/10/tactical-analysis-new-york-red-bulls-tactics-gerhard-struber/"
            ],
            "period": "New York Red Bulls against Toronto, May 2021"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://www.newyorkredbulls.com/news/get-know-new-york-red-bulls-head-coach-gerhard-struber",
        "title": "GET TO KNOW: New York Red Bulls Head Coach Gerhard Struber",
        "publisher": "New York Red Bulls"
      },
      {
        "url": "https://runningtheshowblog.wordpress.com/2021/05/10/tactical-analysis-new-york-red-bulls-tactics-gerhard-struber/",
        "title": "Tactical analysis of New York Red Bulls’ tactics vs Toronto",
        "publisher": "Running The Show — David Selini"
      }
    ],
    "limitations": [
      "The tactical evidence is a single Toronto match, not a season-wide intensity or effectiveness assessment.",
      "Youth honours and Wolfsberger qualification are omitted where role or achievement timing could be misattributed. These sources do not verify employment on 14 September 2026."
    ]
  },
  {
    "apiId": 1923,
    "name": "Valerien Ismael",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Career context",
        "points": [
          {
            "text": "The sources examine successive Championship head-coach periods, first at Barnsley and then West Bromwich Albion. Opta’s West Brom discussion is an early-season checkpoint after 17 matches. Its promising opening results must not be presented as a completed promotion campaign or proof of sustained success across the full appointment.",
            "sourceUrls": [
              "https://theanalyst.com/articles/data-driven-talking-points-ahead-of-the-championships-return"
            ],
            "period": "Barnsley 2020–2021; West Bromwich Albion, first 17 games of 2021–2022"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "In possession",
        "points": [
          {
            "text": "Barnsley’s 3-4-3 used narrow forwards and wing-backs as the main width. Closely positioned attackers occupied central defenders and could free a wing-back outside. Although the back three and staggered midfield pair provided passing triangles, direct service into Cauley Woodrow offered a frequent way past midfield pressure.",
            "sourceUrls": [
              "https://totalfootballanalysis.com/team-analysis/barnsley-valerien-ismael-scout-report-tactical-analysis-tactics"
            ],
            "period": "Barnsley, analysis published February 2021"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Out of possession",
        "points": [
          {
            "text": "The review describes aggressive, opponent-oriented pressure with support arriving behind the first presser. When that pressure was beaten, the wing-backs could retreat into a back five. Their advanced positions also created exposure to counters, so pressing ambition should be read together with its covering demands.",
            "sourceUrls": [
              "https://totalfootballanalysis.com/team-analysis/barnsley-valerien-ismael-scout-report-tactical-analysis-tactics"
            ],
            "period": "Barnsley, analysis published February 2021"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Adaptability",
        "points": [
          {
            "text": "The study records changes in engagement height according to the game state, and a Chelsea example in which centre-backs received time while other passing options were pressed. That is more specific than describing the team as continuously high pressing regardless of opponent or score.",
            "sourceUrls": [
              "https://totalfootballanalysis.com/team-analysis/barnsley-valerien-ismael-scout-report-tactical-analysis-tactics"
            ],
            "period": "Barnsley 2020–2021"
          },
          {
            "text": "Opta describes direct play, long throws and a high defensive line supporting compact pressure. Its account also identifies the cost of poor synchronisation and wasted possession. The continuity with Barnsley lies in territorial pressure, while the recorded weaknesses prevent treating that approach as automatically effective.",
            "sourceUrls": [
              "https://theanalyst.com/articles/data-driven-talking-points-ahead-of-the-championships-return"
            ],
            "period": "West Bromwich Albion, first 17 games of 2021–2022"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://totalfootballanalysis.com/team-analysis/barnsley-valerien-ismael-scout-report-tactical-analysis-tactics",
        "title": "Barnsley lack quality – not intensity: why Valérien Ismaël is the right man for the job",
        "publisher": "Total Football Analysis"
      },
      {
        "url": "https://theanalyst.com/articles/data-driven-talking-points-ahead-of-the-championships-return",
        "title": "The Data-Driven Talking Points Ahead of the Championship’s Return",
        "publisher": "Opta Analyst"
      }
    ],
    "limitations": [
      "The West Brom evidence is a partial-season sample, not a final outcome. The Barnsley article’s account of the preceding coach’s departure is not relied upon.",
      "Historical tactical interpretation is separate from API statistics and does not establish current employment or availability on 14 September 2026."
    ]
  },
  {
    "apiId": 1956,
    "name": "Henrik Pedersen",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Career context",
        "points": [
          {
            "text": "Pedersen became Wednesday manager on 31 July 2025, after serving as Danny Röhl’s assistant from October 2023.",
            "sourceUrls": [
              "https://www.bbc.co.uk/sport/football/articles/cnv73qqrm0po"
            ],
            "period": "Sheffield Wednesday, assistant October 2023–July 2025; manager appointment July 2025"
          },
          {
            "text": "Wednesday’s own announcement confirms that the managerial appointment took immediate effect. It establishes the change in responsibility; earlier results under Röhl should remain attributed to the head coach of that period, with Pedersen identified in his assistant capacity.",
            "sourceUrls": [
              "https://www.linkedin.com/posts/sheffield-wednesday-football-club_swfc-activity-7356625122306256896-Mi78"
            ],
            "period": "Sheffield Wednesday appointment announcement, July 2025"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Out of possession",
        "points": [
          {
            "text": "Pedersen wanted supporters to recognise effort through pressing and the response immediately after losing the ball. This establishes a proposed identity centred on intensity. It does not specify a defensive formation, pressing success rate or evidence that the plan was sustained through the season.",
            "sourceUrls": [
              "https://fanbanter.co.uk/henrik-pedersen-gives-his-first-sit-down-interview-as-sheffield-wednesday-manager/"
            ],
            "period": "First interview as Wednesday manager, preseason 2025–2026"
          }
        ]
      },
      {
        "key": "development",
        "title": "Player development",
        "points": [
          {
            "text": "He connected development with helping players improve and creating value for the club. Alongside preparing the next match, he wanted decisions to support a longer-term future. These were stated priorities during a difficult transition, rather than verified transfer returns or individual improvement measurements.",
            "sourceUrls": [
              "https://fanbanter.co.uk/henrik-pedersen-gives-his-first-sit-down-interview-as-sheffield-wednesday-manager/"
            ],
            "period": "First interview as Wednesday manager, preseason 2025–2026"
          }
        ]
      },
      {
        "key": "management",
        "title": "Management and communication",
        "points": [
          {
            "text": "His account placed understanding individual players before tactical instruction, with time and communication adjusted to their circumstances. Barry Bannan was an important leadership and tactical sounding board. He also credited academy staff helping the working group, making shared support a concrete feature of his early setup. He described sometimes making room for a calmer individual conversation instead of assuming every player needed the same immediate instruction.",
            "sourceUrls": [
              "https://fanbanter.co.uk/henrik-pedersen-gives-his-first-sit-down-interview-as-sheffield-wednesday-manager/"
            ],
            "period": "First interview as Wednesday manager, preseason 2025–2026"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://www.linkedin.com/posts/sheffield-wednesday-football-club_swfc-activity-7356625122306256896-Mi78",
        "title": "Sheffield Wednesday Football Club: Henrik Pedersen appointed manager",
        "publisher": "Sheffield Wednesday FC"
      },
      {
        "url": "https://www.bbc.co.uk/sport/football/articles/cnv73qqrm0po",
        "title": "Troubled Sheff Wed appoint Pedersen as manager",
        "publisher": "BBC Sport"
      },
      {
        "url": "https://fanbanter.co.uk/henrik-pedersen-gives-his-first-sit-down-interview-as-sheffield-wednesday-manager/",
        "title": "Henrik Pedersen gives his first sit down interview as Sheffield Wednesday manager",
        "publisher": "Fan Banter — reproduced interview transcript"
      }
    ],
    "limitations": [
      "The interview transcript is reproduced by a secondary publisher. No detailed possession model is supported by this selection, so that section is omitted.",
      "The appointment is historical July 2025 evidence, not verification of his employer on 14 September 2026. Assistant-period achievements are not presented as his head-coach results."
    ]
  },
  {
    "apiId": 1993,
    "name": "Erik ten Hag",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Career context",
        "points": [
          {
            "text": "Ten Hag’s early senior work included Go Ahead Eagles before leading Bayern’s second team, a head-coach role distinct from assisting Guardiola’s first team. Ajax’s April 2022 announcement confirms that he had led their senior side since January 2018 and would leave for Manchester United after the season.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/erik-ten-hag-ajax-champions-league/",
              "https://english.ajax.nl/articles/ajax-and-manchester-united-agree-deal-for-erik-ten-hag"
            ],
            "period": "Go Ahead Eagles 2012–2013; Bayern II 2013–2015; Ajax January 2018–2022"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "In possession",
        "points": [
          {
            "text": "The Ajax analysis describes Frenkie de Jong and Lasse Schöne beneath advanced attacking rotations. Nicolás Tagliafico overlapped while Dušan Tadić moved inside; Hakim Ziyech’s inward movement and Noussair Mazraoui’s timing created a different relationship on the right. Donny van de Beek exploited spaces around those movements.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/erik-ten-hag-ajax-champions-league/"
            ],
            "period": "Ajax 2018–2019"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Out of possession",
        "points": [
          {
            "text": "Full-backs could advance to support wide pressure, requiring midfield cover behind them. Players leaving their lines to engage opponents made the relationship between presser and covering teammate important. These mechanisms do not establish that pressure always prevented counterattacks.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/erik-ten-hag-ajax-champions-league/"
            ],
            "period": "Ajax, periods analysed through April 2022"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Adaptability",
        "points": [
          {
            "text": "At half-time Ten Hag replaced Diogo Dalot with Aaron Wan-Bissaka to address Allan Saint-Maximin. Later midfield substitutions and forward repositioning strengthened the counterattacking setup. The final supplies a concrete example of personnel and role adjustment within a match, alongside the documented 2–0 trophy-winning result.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/manchester-united-newcastle-erik-ten-hag-league-cup-final-2022-23-tactics/"
            ],
            "period": "Manchester United–Newcastle, League Cup final, 26 February 2023"
          }
        ]
      },
      {
        "key": "development",
        "title": "Player development",
        "points": [
          {
            "text": "The later Ajax structure gave Ryan Gravenberch licence to advance while other players altered their build-up positions. This shows a defined responsibility for a young midfielder within the system. It does not isolate the coach’s contribution from the player’s ability or the wider academy environment.",
            "sourceUrls": [
              "https://learning.coachesvoice.com/cv/erik-ten-hag-ajax-champions-league/"
            ],
            "period": "Ajax 2021–2022"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://learning.coachesvoice.com/cv/erik-ten-hag-ajax-champions-league/",
        "title": "Erik ten Hag: Coach Watch",
        "publisher": "The Coaches’ Voice"
      },
      {
        "url": "https://english.ajax.nl/articles/ajax-and-manchester-united-agree-deal-for-erik-ten-hag",
        "title": "Ajax and Manchester United agree deal for Erik ten Hag",
        "publisher": "AFC Ajax"
      },
      {
        "url": "https://learning.coachesvoice.com/cv/manchester-united-newcastle-erik-ten-hag-league-cup-final-2022-23-tactics/",
        "title": "Manchester United 2 Newcastle 0 tactics: League Cup final analysis",
        "publisher": "The Coaches’ Voice"
      }
    ],
    "limitations": [
      "Ajax mechanisms span distinct squads; they are not asserted as an unchanged Manchester United model.",
      "The 2022 departure announcement and 2023 final do not verify employment or availability on 14 September 2026."
    ]
  },
  {
    "apiId": 2721,
    "name": "Sergej Jakirovic",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Career context",
        "points": [
          {
            "text": "The Premier League identifies Jakirovic as Hull’s manager after their Championship play-off promotion and awards him the August 2026 managerial prize. Hull won both August league fixtures, including the opener against Manchester United. This recent official evidence supports Hull employment near the 14 September review date.",
            "sourceUrls": [
              "https://www.premierleague.com/en/news/4713135/jakirovic-wins-barclays-manager-of-the-month-award"
            ],
            "period": "Hull 2025–2026; official update 11 September 2026"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "In possession",
        "points": [
          {
            "text": "At his presentation Jakirovic described building through midfield to create chances and preparing in training for the intended match approach. HRT’s account emphasised fast, vertical football. These are complementary descriptions of his initial intentions, rather than proof of a particular formation or season-long possession share.",
            "sourceUrls": [
              "https://www.thehullstory.com/allarticles/sergej-jakirovic-press-conference",
              "https://sport.hrt.hr/medunarodni-nogomet/jakirovic-odradio-prvi-trening-s-hullom-najveci-izazov-karijere-12227734"
            ],
            "period": "Hull appointment and first training, June–July 2025"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Out of possession",
        "points": [
          {
            "text": "He outlined an energetic high press while acknowledging the need to adapt to opponents. The statement supports an active defensive ambition with situational adjustment. It does not establish detailed pressing triggers, success against elite build-up teams or the protection left behind each attempted regain.",
            "sourceUrls": [
              "https://sport.hrt.hr/medunarodni-nogomet/jakirovic-odradio-prvi-trening-s-hullom-najveci-izazov-karijere-12227734"
            ],
            "period": "Hull first training, July 2025"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Adaptability",
        "points": [
          {
            "text": "In his HRT interview after promotion, Jakirovic discussed accepting constrained jobs and persisting through transfer restrictions, injuries and an uncertain route into the play-offs. His account gives context to resource adaptation, but does not quantify how much of the eventual success came from tactical changes.",
            "sourceUrls": [
              "https://sport.hrt.hr/hrvatski-nogomet/jakirovic-od-pocetka-karijere-isao-sam-korak-po-korak-12740406"
            ],
            "period": "Kayserispor before Hull; Hull 2025–2026, recalled May 2026"
          }
        ]
      },
      {
        "key": "management",
        "title": "Management and communication",
        "points": [
          {
            "text": "Jakirovic characterised his career moves as incremental steps into clubs that wanted him. He recalled persuading his working group to persist when the Turkish assignment initially appeared difficult. This is specific self-reported evidence of commitment under constraint, rather than an independent assessment of dressing-room relationships.",
            "sourceUrls": [
              "https://sport.hrt.hr/hrvatski-nogomet/jakirovic-od-pocetka-karijere-isao-sam-korak-po-korak-12740406"
            ],
            "period": "Career reflections after Hull promotion, May 2026"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://www.thehullstory.com/allarticles/sergej-jakirovic-press-conference",
        "title": "Jakirović eyes Championship top 10 ahead of new season",
        "publisher": "The Hull Story"
      },
      {
        "url": "https://sport.hrt.hr/medunarodni-nogomet/jakirovic-odradio-prvi-trening-s-hullom-najveci-izazov-karijere-12227734",
        "title": "Jakirović odradio prvi trening s Hullom: Najveći izazov karijere",
        "publisher": "HRT"
      },
      {
        "url": "https://sport.hrt.hr/hrvatski-nogomet/jakirovic-od-pocetka-karijere-isao-sam-korak-po-korak-12740406",
        "title": "Jakirović: Od početka karijere išao sam korak po korak",
        "publisher": "HRT"
      },
      {
        "url": "https://www.premierleague.com/en/news/4713135/jakirovic-wins-barclays-manager-of-the-month-award",
        "title": "Jakirovic wins Barclays Manager of the Month award",
        "publisher": "Premier League"
      }
    ],
    "limitations": [
      "Hull’s July 2025 tactical descriptions are appointment intentions; the September 2026 award establishes results and recent role, not proof of each mechanism.",
      "Recent employment evidence is not a statement about contractual freedom, wages or willingness to move."
    ]
  },
  {
    "apiId": 3609,
    "name": "Miron Muslic",
    "reviewedAt": "2026-09-14",
    "sections": [
      {
        "key": "career",
        "title": "Career context",
        "points": [
          {
            "text": "Schalke’s staff page distinguishes Muslic’s Cercle assistant period from his subsequent head-coach spell, followed by Plymouth and Schalke. It lists him as Schalke head coach from July 2025 and records the 2026 second-division title. The page provides role evidence at this review, rather than availability information.",
            "sourceUrls": [
              "https://schalke04.de/teams/profis/person/miron-muslic/"
            ],
            "period": "Cercle Brugge 2021–2024; Plymouth 2025; Schalke from July 2025"
          }
        ]
      },
      {
        "key": "in-possession",
        "title": "In possession",
        "points": [
          {
            "text": "Muslic described alert, forward-oriented football and quick transitions, connected to an active approach without the ball. This establishes his intended direction at appointment. It does not, by itself, specify a detailed build-up shape or demonstrate that every attack bypassed midfield with a long pass.",
            "sourceUrls": [
              "https://schalke04.de/en/inside-en/muslic-official-presentation/"
            ],
            "period": "Schalke presentation, June 2025"
          }
        ]
      },
      {
        "key": "out-of-possession",
        "title": "Out of possession",
        "points": [
          {
            "text": "The league’s promotion analysis emphasises intense pressure and a strong first-half defensive record, with Nikola Katić and Loris Karius prominent. This offers observed season context for the earlier promise of intensity. The evidence remains tied to that squad and competition, rather than a transferable defensive guarantee.",
            "sourceUrls": [
              "https://www.bundesliga.com/de/2bundesliga/news/schalke-04-miron-muslic-macher-aufstieg-bundesliga-zahlen-daten-fakten-37159"
            ],
            "period": "Schalke 2025–2026, league analysis May 2026"
          }
        ]
      },
      {
        "key": "adaptability",
        "title": "Adaptability",
        "points": [
          {
            "text": "The league account describes adding attacking quality in winter, including Edin Džeko and Adil Aouchiche, after the first half’s defensive foundation. It also records recovery after a difficult run early in the second half. Personnel changes therefore form part of the explanation, alongside coaching continuity.",
            "sourceUrls": [
              "https://www.bundesliga.com/de/2bundesliga/news/schalke-04-miron-muslic-macher-aufstieg-bundesliga-zahlen-daten-fakten-37159"
            ],
            "period": "Schalke winter and second half of 2025–2026"
          }
        ]
      },
      {
        "key": "management",
        "title": "Management and communication",
        "points": [
          {
            "text": "His introductory explanation emphasised clear responsibilities for players and staff, with training and analysis organised around developing the team’s game. Pressure to perform was acknowledged alongside daily improvement. This documents communicated working principles; it is not a measured judgment of every player’s experience under him.",
            "sourceUrls": [
              "https://schalke04.de/en/inside-en/muslic-official-presentation/"
            ],
            "period": "Schalke presentation, June 2025"
          }
        ]
      }
    ],
    "sources": [
      {
        "url": "https://schalke04.de/teams/profis/person/miron-muslic/",
        "title": "Miron Muslic – Chef-Trainer",
        "publisher": "FC Schalke 04"
      },
      {
        "url": "https://schalke04.de/en/inside-en/muslic-official-presentation/",
        "title": "Miron Muslic: We want to be active and ramp up the intensity",
        "publisher": "FC Schalke 04"
      },
      {
        "url": "https://www.bundesliga.com/de/2bundesliga/news/schalke-04-miron-muslic-macher-aufstieg-bundesliga-zahlen-daten-fakten-37159",
        "title": "So wurde Miron Muslić zum Schalker Aufstiegs-Architekt",
        "publisher": "Bundesliga"
      }
    ],
    "limitations": [
      "The official staff page supports Schalke employment at the September 2026 review, but supplies no basis for availability or contract-cost assumptions.",
      "The promotion analysis links recruitment and team outcomes; it does not isolate Muslic’s causal contribution or measure individual player development."
    ]
  }
]
