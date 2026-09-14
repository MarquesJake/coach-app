export type ReviewedNarrativeAlias = {
  apiId: number
  narrativeApiId: number
  canonicalName: string
  scope: 'narrative_only'
  status: 'verified_stored_identity_link' | 'reviewed_name_and_club_identity'
  checkedAt: string
  sourceUrls: readonly string[]
  evidence: string
}

// Reviewed narrative routing only. Never use these aliases to merge provider careers or match statistics.
export const REVIEWED_NARRATIVE_ALIASES: readonly ReviewedNarrativeAlias[] = [
  {
    "apiId": 25762,
    "narrativeApiId": 16246,
    "canonicalName": "Michael Carrick",
    "scope": "narrative_only",
    "status": "verified_stored_identity_link",
    "checkedAt": "2026-09-14",
    "sourceUrls": [
      "https://v3.football.api-sports.io/coachs?id=25762",
      "https://v3.football.api-sports.io/coachs?id=16246"
    ],
    "evidence": "Stored directory identity and canonical provider record linked through reviewed name and matching birth date. Detailed evidence retained in the identity audit."
  },
  {
    "apiId": 26564,
    "narrativeApiId": 16373,
    "canonicalName": "Steven Schumacher",
    "scope": "narrative_only",
    "status": "verified_stored_identity_link",
    "checkedAt": "2026-09-14",
    "sourceUrls": [
      "https://v3.football.api-sports.io/coachs?id=26564",
      "https://v3.football.api-sports.io/coachs?id=16373"
    ],
    "evidence": "Stored directory identity and canonical provider record linked through reviewed name and matching birth date. Detailed evidence retained in the identity audit."
  },
  {
    "apiId": 26573,
    "narrativeApiId": 627,
    "canonicalName": "Michael Duff",
    "scope": "narrative_only",
    "status": "verified_stored_identity_link",
    "checkedAt": "2026-09-14",
    "sourceUrls": [
      "https://v3.football.api-sports.io/coachs?id=26573",
      "https://v3.football.api-sports.io/coachs?id=627"
    ],
    "evidence": "Stored directory identity and canonical provider record linked through reviewed name and matching birth date. Detailed evidence retained in the identity audit."
  },
  {
    "apiId": 26578,
    "narrativeApiId": 618,
    "canonicalName": "Ryan Lowe",
    "scope": "narrative_only",
    "status": "verified_stored_identity_link",
    "checkedAt": "2026-09-14",
    "sourceUrls": [
      "https://v3.football.api-sports.io/coachs?id=26578",
      "https://v3.football.api-sports.io/coachs?id=618"
    ],
    "evidence": "Stored directory identity and canonical provider record linked through reviewed name and matching birth date. Detailed evidence retained in the identity audit."
  },
  {
    "apiId": 26677,
    "narrativeApiId": 14971,
    "canonicalName": "Edward Still",
    "scope": "narrative_only",
    "status": "verified_stored_identity_link",
    "checkedAt": "2026-09-14",
    "sourceUrls": [
      "https://v3.football.api-sports.io/coachs?id=26677",
      "https://v3.football.api-sports.io/coachs?id=14971"
    ],
    "evidence": "Stored directory identity and canonical provider record linked through reviewed name and matching birth date. Detailed evidence retained in the identity audit."
  },
  {
    "apiId": 25651,
    "narrativeApiId": 1923,
    "canonicalName": "Valerien Ismael",
    "scope": "narrative_only",
    "status": "reviewed_name_and_club_identity",
    "checkedAt": "2026-09-14",
    "sourceUrls": [
      "https://v3.football.api-sports.io/coachs?id=25651",
      "https://v3.football.api-sports.io/coachs?id=1923",
      "https://www.cardiffcityfc.co.uk/news/match-preview-blackburn-rovers-vs-cardiff-city-4"
    ],
    "evidence": "Cardiff’s 13 March 2025 preview links Blackburn’s Valerien Ismael to Barnsley, West Brom, Besiktas and Watford, matching the canonical provider career. Both provider records identify Blackburn. Their start dates disagree; no dates or statistics are merged."
  },
  {
    "apiId": 25745,
    "narrativeApiId": 25015,
    "canonicalName": "James Morrison",
    "scope": "narrative_only",
    "status": "reviewed_name_and_club_identity",
    "checkedAt": "2026-09-14",
    "sourceUrls": [
      "https://v3.football.api-sports.io/coachs?id=25745",
      "https://v3.football.api-sports.io/coachs?id=25015",
      "https://www.wba.co.uk/news/james-morrison-appointed-albion-head-coach"
    ],
    "evidence": "West Brom’s 30 April 2026 appointment identifies James Morrison, the Scotland international and long-serving Albion player. This matches the canonical provider nationality and age, and both IDs identify West Brom. Sparse-ID birth date is absent; this is a reviewed narrative link only."
  },
  {
    "apiId": 25753,
    "narrativeApiId": 18552,
    "canonicalName": "Matt Bloomfield",
    "scope": "narrative_only",
    "status": "reviewed_name_and_club_identity",
    "checkedAt": "2026-09-14",
    "sourceUrls": [
      "https://v3.football.api-sports.io/coachs?id=25753",
      "https://v3.football.api-sports.io/coachs?id=18552",
      "https://www.oufc.co.uk/news/matt-bloomfield-appointed-oxford-united-head-coach"
    ],
    "evidence": "Oxford’s 9 January 2026 appointment explicitly links Matt Bloomfield to prior head-coach roles at Colchester, Wycombe and Luton, matching the canonical provider career. Sparse-ID Oxford start of August 2025 conflicts with the announcement and is not adopted."
  },
  {
    "apiId": 25765,
    "narrativeApiId": 636,
    "canonicalName": "Rob Edwards",
    "scope": "narrative_only",
    "status": "reviewed_name_and_club_identity",
    "checkedAt": "2026-09-14",
    "sourceUrls": [
      "https://v3.football.api-sports.io/coachs?id=25765",
      "https://v3.football.api-sports.io/coachs?id=636",
      "https://www.wolves.co.uk/news/mens-first-team/20251112-edwards-becomes-new-wolves-head-coach/"
    ],
    "evidence": "Wolves’ 12 November 2025 appointment explicitly links Rob Edwards to Middlesbrough, Luton, Watford, Forest Green and earlier Wolves coaching, matching the canonical provider chain. This distinguishes him from namesakes; the sparse provider start date is not validated."
  },
  {
    "apiId": 25924,
    "narrativeApiId": 13920,
    "canonicalName": "Jon Brady",
    "scope": "narrative_only",
    "status": "reviewed_name_and_club_identity",
    "checkedAt": "2026-09-14",
    "sourceUrls": [
      "https://v3.football.api-sports.io/coachs?id=25924",
      "https://v3.football.api-sports.io/coachs?id=13920",
      "https://www.port-vale.co.uk/news/get-know-jon-brady"
    ],
    "evidence": "Port Vale’s 6 January 2026 biography links its new manager Jon Brady to Brackley and Northampton academy and first-team roles, matching the canonical provider career. The sparse provider’s August 2025 Vale start is inconsistent with this announcement and is not adopted."
  },
  {
    "apiId": 25929,
    "narrativeApiId": 7465,
    "canonicalName": "Ian Holloway",
    "scope": "narrative_only",
    "status": "reviewed_name_and_club_identity",
    "checkedAt": "2026-09-14",
    "sourceUrls": [
      "https://v3.football.api-sports.io/coachs?id=25929",
      "https://v3.football.api-sports.io/coachs?id=7465",
      "https://www.port-vale.co.uk/news/match-preview-swindon-town-vs-port-vale"
    ],
    "evidence": "Sparse name Scott Holloway Ian contains the same complete name components as provider Ian Scott Holloway, in a different order. Both refer to Swindon; Port Vale’s February 2025 preview links its manager Ian Holloway to Blackpool and Bristol Rovers. Explicit one-off review; no general name-token matcher."
  },
  {
    "apiId": 25930,
    "narrativeApiId": 641,
    "canonicalName": "Gareth Ainsworth",
    "scope": "narrative_only",
    "status": "reviewed_name_and_club_identity",
    "checkedAt": "2026-09-14",
    "sourceUrls": [
      "https://v3.football.api-sports.io/coachs?id=25930",
      "https://v3.football.api-sports.io/coachs?id=641",
      "https://www.gillinghamfootballclub.com/news/gills-appoint-gareth-ainsworth-new-first-team-manager"
    ],
    "evidence": "Gillingham’s 25 March 2025 appointment links Gareth Ainsworth to Wycombe, QPR and Shrewsbury, matching the canonical provider career. Both provider records identify Gillingham. Different provider start dates are not reconciled through this narrative alias."
  },
  {
    "apiId": 25931,
    "narrativeApiId": 608,
    "canonicalName": "Steve Evans",
    "scope": "narrative_only",
    "status": "reviewed_name_and_club_identity",
    "checkedAt": "2026-09-14",
    "sourceUrls": [
      "https://v3.football.api-sports.io/coachs?id=25931",
      "https://v3.football.api-sports.io/coachs?id=608",
      "https://www.bristolrovers.co.uk/news/bristol-rovers-appoint-steve-evans-mens-head-coach"
    ],
    "evidence": "Bristol Rovers’ 16 December 2025 appointment links Scottish coach Steve Evans to Rotherham, Stevenage, Crawley, Leeds and Gillingham, matching the canonical provider. The sparse record identifies Bristol Rovers but predates the appointment; its chronology remains unverified."
  },
  {
    "apiId": 25933,
    "narrativeApiId": 24677,
    "canonicalName": "Conor Hourihane",
    "scope": "narrative_only",
    "status": "reviewed_name_and_club_identity",
    "checkedAt": "2026-09-14",
    "sourceUrls": [
      "https://v3.football.api-sports.io/coachs?id=25933",
      "https://v3.football.api-sports.io/coachs?id=24677",
      "https://www.skysports.com/football/news/11095/13407835/conor-hourihane-interview-barnsley-boss-on-how-coaching-while-playing-led-him-to-a-head-coach-role-at-34"
    ],
    "evidence": "The August 2025 direct interview identifies Barnsley head coach Conor Hourihane and his player-coach progression. Both IDs identify this Barnsley coach; the canonical provider age agrees. The sparse record supplies no birthday, so this authorises narrative routing, not demographic or statistical merging."
  },
  {
    "apiId": 25934,
    "narrativeApiId": 10649,
    "canonicalName": "Kevin Nolan",
    "scope": "narrative_only",
    "status": "reviewed_name_and_club_identity",
    "checkedAt": "2026-09-14",
    "sourceUrls": [
      "https://v3.football.api-sports.io/coachs?id=25934",
      "https://v3.football.api-sports.io/coachs?id=10649",
      "https://www.skysports.com/football/news/11739/13332470/kevin-nolan-interview-northampton-town-boss-on-working-under-david-moyes-at-west-ham-and-loving-being-a-manager-again"
    ],
    "evidence": "The March 2025 direct interview links Northampton manager Kevin Nolan to Leyton Orient, Notts County and West Ham. This matches the canonical career and sparse Northampton identity. The sparse January 2026 start is contradicted by this earlier interview and is not adopted."
  },
  {
    "apiId": 25935,
    "narrativeApiId": 591,
    "canonicalName": "Gary Bowyer",
    "scope": "narrative_only",
    "status": "reviewed_name_and_club_identity",
    "checkedAt": "2026-09-14",
    "sourceUrls": [
      "https://v3.football.api-sports.io/coachs?id=25935",
      "https://v3.football.api-sports.io/coachs?id=591",
      "https://www.pafc.co.uk/news/preview-burton-albion-h"
    ],
    "evidence": "Plymouth’s 4 January 2026 Burton preview identifies Gary Bowyer and connects him to Blackburn, Blackpool, Bradford, Salford and Dundee. Both provider records identify Burton and the canonical age agrees. This confirms narrative identity, not exact tenure dates."
  },
  {
    "apiId": 26568,
    "narrativeApiId": 24458,
    "canonicalName": "Matt Hamshaw",
    "scope": "narrative_only",
    "status": "reviewed_name_and_club_identity",
    "checkedAt": "2026-09-14",
    "sourceUrls": [
      "https://v3.football.api-sports.io/coachs?id=26568",
      "https://v3.football.api-sports.io/coachs?id=24458",
      "https://images.gc.rotherhamunitedfcservices.co.uk/01f5afd0-361f-11f0-b74d-298b845c5142.pdf"
    ],
    "evidence": "Sparse Matthew Hamshaw exactly matches the canonical provider full name; both records identify Rotherham. The club’s 2025/26 brochure names Matt Hamshaw as first-team manager. This reviewed full-name and club link permits narratives only; missing sparse birth and nationality remain missing."
  }
]

export function narrativeApiIdForReviewedAlias(apiId: number): number | undefined {
  return REVIEWED_NARRATIVE_ALIASES.find(alias => alias.apiId === apiId)?.narrativeApiId
}
