# Coach First — Competitor Audit & Next-Version Strategy
*Prepared 3 July 2026. Research only — no product changes made.*

---

## 1. Competitor Audit: CoachInside (coachinside.com)

**Who they are:** NV SportsConsult GmbH, Munich. Positioned as "the world's most powerful scouting database for professional football coaches."

### Their product suite
| Product | What it does | Who pays |
|---|---|---|
| **Platform** | Coach scouting database: search filters, performance indicators, 1v1 coach comparison, scouting reports, shortlists, org-wide sharing | Clubs, federations, agencies (enterprise sales) |
| **Player Match** | Scores player fit against a coach's game model across 4 dimensions (on-ball, off-ball, physical, tactical) | Clubs (recruitment teams) |
| **COACH+** | Coach-facing career profile: own performance data, tactical trends, visibility to clubs, job discovery | Individual coaches — free tier + €199/6mo or €299/12mo |
| **Market Screening** | Done-for-you screening service | Clubs, agencies |
| **API** | Coach data into club systems | Enterprise |

### Their claimed numbers (credibility engine)
- 65,000+ coaches (30k head coaches), 350,000+ players, 150+ competitions, 10M+ data points
- 200+ clients, 99% renewal rate
- Named clients: Eintracht Frankfurt, Newcastle, Leverkusen, Leeds, Southampton, Werder Bremen, KRC Genk, Hertha, Köln, Gladbach + ~40 more
- Testimonials from sporting directors (Philadelphia Union, Genk, Köln, Lech Poznań)
- Partners: Wyscout, Impect, Transfermarkt, SkillCorner, SAP, Scoutastic; associations incl. LMA, UEFA, DFB

### What their marketing does well (borrow this)
1. **Proof density.** Logos, testimonials from named sporting directors, hard numbers (200+ clients, 99% renewal) everywhere. Their homepage sells trust before features.
2. **Two-sided flywheel.** Coaches maintain their own profiles for free (COACH+), which enriches the database clubs pay for, and creates a coach community that markets the product for them.
3. **KPI-as-product.** "6 unique KPIs" turns their methodology into a brandable asset.
4. **Multiple entry prices.** Free coach profiles → €199 coach subs → enterprise club deals → API. Every visitor has a next step.
5. **Ecosystem legitimacy.** Data-partner logos (Wyscout, SkillCorner, Transfermarkt) answer "where does your data come from?" before it's asked.

### Their weaknesses (our openings)
1. **They are a database, not a decision workflow.** CoachInside ends at "shortlist + report." There is no mandate lifecycle, no board recommendation, no succession planning, no risk memory, no deliverable pipeline. That is exactly the layer Coach First already has.
2. **Generic scouting framing.** They serve media, agencies, coaches and clubs at once — the club decision-maker experience is diluted.
3. **No structured diligence.** Nothing equivalent to our background checks, risk ratings, dressing-room/board relationship intelligence with confidence scoring.
4. **German/Bundesliga-weighted client base.** English pyramid (EFL) appears underserved relative to our demo focus (QPR/Brighton/Bolton narratives).

---

## 2. The wider competitive map

| Player | Model | Strength | Gap we can exploit |
|---|---|---|---|
| **CoachInside** | SaaS database + coach subs | Data scale, brand proof, two-sided network | No decision/mandate workflow, no diligence layer |
| **Coach ID (Analytics FC)** | Consultancy + models (Standard / PLUS full-search service) | Deep impact modelling (coach effect on results, player values, injuries), style-fit matching | Service business — not self-serve software; opaque, project-priced |
| **FMDB Pro (Sports Interactive × Hudl)** | Staff + player intelligence platform (760k profiles, 7k competitions) | Massive qualitative scout network + Hudl event/physical data; staff database for backroom recruitment | Breadth over decision depth; player-first, staff is an add-on |
| **Twenty First Group (ex-21st Club) + Elite Performance Partners** | Advisory: head-coach surveillance + character assessment | Boardroom trust, character/leadership assessment | People-powered, expensive, not productized |
| **MRKT Insights / ScoutDecision etc.** | Consultancy / general scouting tools | Niche credibility | Not coach-recruitment-specific |

**The strategic read:** the market splits into (a) *databases* (CoachInside, FMDB Pro) and (b) *advisory services* (Coach ID, TFG/EPP). **Nobody owns the self-serve decision workspace** — the software a sporting director or search advisor actually runs a mandate inside. That is Coach First's lane, and our existing architecture (mandate → suggested longlist → curated longlist → shortlist → board recommendation → deliverables, plus diligence and risk memory) is already shaped for it.

**Positioning statement:** *CoachInside tells you who exists. Coach ID tells you what a consultant thinks. Coach First is where the club actually runs the decision — with evidence, provenance and board-ready memory.*

---

## 3. Where Coach First stands today (honest self-audit)

**Have (and competitors don't):** mandate lifecycle with board recommendations and candidate-type labelling (primary target / viable / stretch / benchmark), structured diligence (tactical reports, background checks, risk ratings), three-layer club data (facts / intelligence / workflow), agent & relationship tracking, intelligence items with confidence + source trails, alerts and next-action detection, evidence-backed development suggestions.

**Missing vs the market:**
1. **Data scale & performance KPIs.** They quantify coach performance from match data (PPG trends, style indices, economic impact). We rely on curated entries + basic API-Football sync. This is the #1 credibility gap in any sales conversation.
2. **Multi-user / organisation support.** Everything is single-user (per-user RLS). CoachInside sells org-wide sharing of shortlists and notes; a club buys seats, not a person.
3. **Coach-facing side.** No equivalent of COACH+ — no self-maintained coach profiles, no coach acquisition loop, no second revenue stream.
4. **Player–coach fit.** Player Match and Coach ID both connect coach game models to squad/player fit. We have the seed of this (development suggestions) but no fit engine.
5. **Exportable deliverables.** Head Coach Assessment Packs live in-app; no branded PDF export — the artifact a sporting director forwards upward.
6. **Marketing proof.** Landing page has strong language but zero numbers, logos, testimonials, screenshots or pricing.

---

## 4. Next-version plan (proposed priority order)

### V-next (4–6 weeks): "Sellable single-club product"
1. **Head Coach Assessment Pack PDF export** — one-click branded assessment pack per mandate (shortlist, fit rationale, risk summary, recommendation). Highest demo-to-deal value, lowest build cost; matches what Coach ID delivers as a consultancy artifact.
2. **Coach performance layer v1** — from existing API-Football pipeline: tenure timelines, PPG before/during/after, league-position trajectory, squad-age and youth-minutes trends per stint. Presented inside our evidence layer with provenance. Goal: neutralize "where's your data?" without buying a data deal yet.
3. **Landing-page proof upgrade** — screenshots of the mandate workspace, the three demo narratives as case studies, a concrete numbers strip, clear CTA to a guided demo account.
4. Fix the fresh-account redirect loop on `/dashboard/setup` (found today; new users see a blank screen after signup — fatal for trials).

### V+1 (2–3 months): "Sell to organisations, not individuals"
5. **Organisations & seats** — shared mandates, roles (admin / analyst / viewer), comments, and an audit trail of who curated what. This converts the product from a personal tool into club software and unlocks real pricing.
6. **Player–coach fit module v1** — score current squad fit against a candidate's game model (our tactical identity data + squad sync). Direct answer to Player Match, but embedded in the mandate decision, not a separate tool.

### V+2 (3–6 months): "Build the moat"
7. **Coach-side profiles (two-sided flywheel)** — coaches claim/maintain profiles, upload CV & philosophy docs, control visibility. Free tier seeds the database; paid tier (~£150–250/yr, benchmarked against COACH+ €199–299) adds visibility and market insight. This is how CoachInside got to 65k coaches without paying for the data.
8. **Data partnership** — one credible provider (SkillCorner, Impect, or Opta via reseller) to badge the evidence layer and deepen KPIs.
9. **API / integrations** — later; only once orgs exist.

### Go-to-market wedge
- Target the **English pyramid (Championship → League Two) and agencies advising them** — underserved by Bundesliga-centric CoachInside and priced out of TFG/Coach ID retainers.
- Sell the workflow: "run your next head-coach search in Coach First," not "browse coaches."
- Pricing hypothesis to validate: club workspace £X00/month per mandate-running org; advisor/agency tier; coach profiles freemium later.

---

## 5. Investor documents — what they tell us (added 5 July 2026)

Four documents received from an investor (a working head-coach search toolkit, June 2026):

1. **Head Coach Assessment Methodology** — a 9-criteria assessment matrix (Coach Profile, Performance & Impact, Tactical Proposal, Match Management, Training Management, Players Development, Media & Comms, Personality Profile, Cultural & Org Fit) crossed with 8 evidence methods (desktop research, data analysis, AI-generated info, media review, match analysis, training observation, interview, references). Each criterion has sub-criteria, objectives, deliverables and key questions. Final output: SWOT, budget, risk, probability of success, and a Proceed / Shortlist / Target / Monitor / Dismiss recommendation.
2. **Coach ID presentation — Albert Riera** — a worked candidate dossier following that methodology: at-a-glance strengths/risks/recommendation, career timeline with PPG per stint, contract/salary/agent/family/GBE work-permit assessment, xG pre-vs-post-appointment tables, ELO trajectory, market-value overperformance, formation usage %, tactical principles, training-week structure, transfer-asset P&L per player, media/personality profiles, character reference appendix. Annotations show it is a template mid-build: "AI / data:" hints throughout, "requires updated xG and injury data", "club-specific section".
3. **Interview Q&A** — 15 standardised + 5 club-specific interview questions, with "the 3 most revealing".
4. **References Process** — standardised 15-question banks per stakeholder group (Owners/CEOs, Coaching Staff, Players, Industry Network, Journalists) plus "the 5 most valuable questions".

### Strategic read

**This is the artifact the product should generate.** The Head Coach Assessment Pack is precisely the consultancy deliverable Analytics FC and Twenty First Group charge retainers for — and the investor is assembling a worked Albert Riera example by hand in PowerPoint, with explicit placeholders begging for automation ("AI-generated interpretation of the xG data", "requires thorough media screening"). Coach First's next version should be the machine that produces this assessment pack in minutes instead of weeks.

**Mapping to the current product:**
| Methodology criterion | Coach First today | Gap |
|---|---|---|
| 1. Coach Profile (incl. contract, agent, family, GBE) | Coach profiles, agent tracking | Contract/salary/GBE/relocation fields; work-permit calculator |
| 2. Performance & Impact (xG pre/post, ELO, PPG vs budget) | Basic stints + scores | The whole quantitative layer — matches V-next "performance layer" priority |
| 3. Tactical Proposal | Tactical identity fields + tactical reports | Formation-usage data, build-up vs press/block detail |
| 4. Match Management | — | New: subs patterns, game-state behaviour |
| 5. Training Management | — | New: training-week structure, methodology notes |
| 6. Players Development (incl. transfer asset P&L) | Development suggestions, player value | Transfer-asset ledger per coach tenure |
| 7. Media & Comms | Partial (background checks) | Structured media screening module |
| 8. Personality Profile | — | New: AI-drafted, source-verified leadership/behaviour profile |
| 9. Cultural & Org Fit | Board recommendations, mandate context | Club-DNA matching rubric |
| Interview kit | — | New: question banks, note capture, cross-candidate comparison |
| References tracker | Background checks (partial) | New: stakeholder-group question banks, pattern detection across referees |

### What the next version could look like: the "Assessment OS"

Inside a mandate, each shortlisted candidate gets a **9-section assessment workspace**. Sections auto-populate from three sources: (a) structured data already in the platform, (b) a coach-performance data layer (xG deltas, ELO, PPG vs budget, formation usage), and (c) **AI-drafted narrative sections** (personality profile, media screening, xG interpretation) that a human reviews and signs off — matching the investor's "AI-generated, verified by sources" annotation and our existing confidence/provenance model. Interview and reference modules capture structured answers against the standard question banks, tagged to criteria, so contradictions between what a coach says, what the data says, and what referees say surface automatically. One click renders the Head Coach Assessment Pack, ending in Proceed / Shortlist / Target / Monitor / Dismiss.

This reframes the V-next priorities: the **Head Coach Assessment Pack export** and **performance layer** stay top, but the export format is now defined by the investor's worked example, and the diligence layer expands into interview + references workflows — a feature no competitor (CoachInside, FMDB Pro) has productized, and which converts the consultancy playbook (Coach ID, TFG) into self-serve software.

## 6. Combined plan — Claude × Codex synthesis (5 July 2026)

Both analyses independently reached the same thesis: **productize the investor methodology into a Head Coach Assessment OS** — "run and document the appointment decision," not "browse coaches." The wedge vs CoachInside is confirmed from two directions.

**Adopted from Codex:**
- **Assessment Matrix as a coverage heatmap** — the methodology's 9-criteria × 8-evidence-methods grid rendered as a live view per candidate: what evidence exists, what's verified, what's missing. This doubles as the search's quality-control surface and is cheap to build over existing data.
- **Three-screen product framing** — (1) Mandate Workspace, (2) Candidate Assessment (matrix + scores), (3) Board Recommendation Pack. Everything ships as improvements to one of these three screens.
- **The killer demo script** — "Here is a mandate → three candidates → assessment matrix → evidence coverage → interview/reference findings → board-ready pack."
- **Don't build more generic database features.** Confirmed by both analyses.

**Retained from the Claude audit (gaps in the Codex plan):**
- **The quantitative performance layer is not optional.** The Head Coach Assessment Pack's core pages (xG pre/post appointment, ELO trajectory, PPG-vs-budget, formation usage) are data products. Without a data plan the pack generator produces empty sections. Sequencing: API-Football (already integrated) + public ELO/results first; FBref/StatsBomb/Opta partnership when revenue justifies it.
- **Organisations & seats.** An appointment process is multi-stakeholder by definition (different people conduct interviews and collect references). Single-user architecture caps the product at "analyst tool." Needed before selling to clubs, but not for the investor demo.
- **GBE work-permit calculator** — small, differentiating for the English market, present in the investor's own dossier.
- **GTM & pricing** (Section 4): English pyramid + agencies wedge, pricing benchmarks, coach-side flywheel later.

**Shared principle (both flagged independently):** AI drafts, humans sign off. Every claim carries source, method, confidence, verification status, date, and whether it fed the final recommendation. This is what makes the output board-defensible.

**Final refinements (Codex round 2, agreed):**
- **Assessment pack as forcing function, not export feature.** Every field, score, note, interview answer, reference and data source exists because it strengthens or qualifies the final recommendation. Anything that can't trace to the Head Coach Assessment Pack is scope creep. This is the product's design principle.
- **GBE/work-permit calculator pulled forward into Phase 1.** Small, concrete, demoable, England-specific seriousness. Feasible early: it's rules logic (cumulative months as first-team manager in GBE Band 1–5 leagues over 5 years + licence) over stint data the platform already models, plus a static league-band lookup.

**Phase 1 build order (agreed, 5 July 2026):**
1. **Assessment data model** — 9 criteria, evidence methods, evidence records, coverage + verification status. Reuse existing diligence tables (`coach_tactical_reports`, `coach_background_checks`) as evidence sources rather than duplicating them.
2. **Candidate assessment workspace** — matrix/heatmap plus per-criterion notes, confidence, evidence, gaps.
3. **GBE calculator** — deterministic eligibility from stint/league/licence data (static league-band lookup).
4. **Head Coach Assessment Pack generator** — structured HTML/PDF of the investor-defined pack.
5. **Mandate demo flow** — one mandate, three candidates, matrix, evidence gaps, recommendation pack.

Scope test for everything: *if it does not strengthen, qualify, evidence, or package the final appointment recommendation, it waits.*

### Final phased roadmap

| Phase | Scope | Outcome |
|---|---|---|
| **1. Assessment backbone** (~4–6 wks) | 9-criteria data model per mandate-candidate; assessment matrix coverage heatmap; assessment workspace auto-filled from existing data; Head Coach Assessment Pack PDF; GBE work-permit calculator | The killer demo works end-to-end with curated data |
| **2. Human evidence modules** | Interview kit (question banks, structured capture, per-criterion rating); references tracker (5 stakeholder banks, pattern + contradiction synthesis); AI-drafted sections with provenance & sign-off. Structured child tables (question item, respondent type, answer, rating, contradiction flag) linked to assessment_evidence rows — evidence stays the coverage seam, per the Codex review. Also from review: contract fields (expiry, current salary, release clauses) and key-staff-likely-to-follow on coaches, to complete the assessment-pack profile grid | The full methodology runs inside the product |
| **3. Quantitative layer** | xG pre/post, ELO, PPG-vs-budget, formation usage from API-Football + public sources; squad age & development metrics; transfer-asset ledger | Dossier data pages populate automatically |
| **4. Sell to organisations** | Orgs/seats/roles, shared mandates, audit trail; landing-page proof upgrade; pricing | Convert demo interest into club contracts |

## 7. Sources
- https://www.coachinside.com/ (+ /platform, /playermatch, /coachplus)
- https://analyticsfc.co.uk/coach-id-3/ and https://analyticsfc.co.uk/blog/2021/10/11/introducing-coach-id-using-data-to-scout-your-clubs-next-head-coach-2/
- https://coachidapp.com/en/
- https://www.hudl.com/blog/hudl-sports-interactive-partnership-fmdb-pro and https://www.fmdb.pro/
- https://eppglobal.com/how-we-think/21st-club-working-with-elite-performance-partners-to-enhance-manager-recruitment/
- https://www.twentyfirstgroup.com/
