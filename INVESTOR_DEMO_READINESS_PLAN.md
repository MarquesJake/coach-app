# Coach First Investor Demo Readiness Plan

Target demo window: two weeks from 2026-08-27.

## Demo Objective

Show Coach First as a private head-coach appointment decision system, not a searchable coach database. The investor should leave believing:

1. Clubs have an urgent, expensive decision problem.
2. Coach First turns scattered football intelligence into a board-ready appointment recommendation.
3. The moat is trusted evidence, workflow control, and decision memory, not public stats alone.
4. The product is live, demoable, and has a clear path from manual expert workflow to scalable data-assisted intelligence.

## Two-Week Build Plan

### Week 1: Demo Spine and Data Credibility

Must ship:

- Production health is boring: uptime check, demo login, seed data, no failing scheduled notifications, no broken onboarding route.
- Dashboard tells the operator what to do today: blocked work, release requests, source review, active mandates, coach submissions.
- Mandate workspace opens with a decisive board recommendation and a visible fit-detail path.
- Club profile shows football context, coaching stability, season results, and a season-results strength proxy trend.
- The West Ham United demo mandate has believable club context, six fully assessed decision candidates, a recorded recommendation, board packs and a controlled club preview.
- Kieran McKenna is the frozen lead story; breadth beyond that story is supporting proof, not part of the main click path.
- Investor demo script is rehearsable in under 12 minutes.

Should ship:

- Board recommendation card click-through to the selected candidate.
- Club case to mandate conversion copy and affordances, even if the first version is partly manual.
- Clear badges for evidence source type: public, independent source, coach supplied, Coach First conclusion.
- A production smoke-test checklist that can be run the morning of the demo.

Could ship:

- Simple outcome-memory placeholder: "decision record" and "post-appointment review" card.
- Demo export pack refresh with the strongest candidate assessment.
- One polished mobile path for a coach profile or club dossier.

### Week 2: Investor Polish and Risk Burn-Down

Must ship:

- Full dry run on production with screenshots and timestamps.
- Demo data freeze 48 hours before the meeting.
- One backup demo account and one backup local build.
- Investor narrative: problem, live workflow, moat, data roadmap, commercial model, funding ask.
- ELO story positioned honestly: current season-results strength proxy for demo, provider-backed ingestion after budget.

Should ship:

- Error states and empty states reviewed on Dashboard, Mandates, Clubs, Coaches, Intelligence, Club portal, Coach portal.
- Release-desk story tightened so confidential material does not look casually exposed.
- API/data cost plan added to the investor appendix.

Could ship:

- Small "why now" data slide: manager churn, appointment cost, fragmentation of evidence, growing club pressure.

## ELO And Strength Trends Plan

### What We Can Demo Now

We can show a transparent season-results strength proxy from existing club season data. It uses league position, points, and goal difference, then smooths those into a rating around a 1500 baseline. This is useful for:

- Showing whether the club environment is rising, stable, or declining.
- Framing the appointment problem: rebuilding, sustaining momentum, or stopping decay.
- Adding quantitative context to a mandate without pretending the app has full proprietary match-by-match ratings yet.

### What Proper ELO Requires

True ELO should be generated from match-level results, opponent strength, home/away context, competition weighting, and manager appointment dates. For manager ELO, we need to attribute each match to the manager in post and separate club strength from manager effect.

Recommended staging:

- Demo stage: internal season-results strength proxy from stored season results.
- Seed stage: ingest ClubElo-style club ratings for relevant clubs and dates where permitted.
- Paid data stage: ingest fixtures/results from API-Football or football-data.org and compute match-by-match club ELO.
- Manager model stage: join fixtures to coach tenures and estimate manager-context movement versus baseline club trend.

## Monthly Investment Plan

Baseline production stack:

| Need | Vendor | Current public price checked 2026-08-27 | Recommendation |
| --- | --- | ---: | --- |
| Hosting | Vercel Pro | $20/month per seat, usage based beyond included allowance | Budget $20-$60/month for demo and early pilots |
| Database/auth/storage | Supabase Pro | From $25/month, includes daily backups and 100k MAU allowance | Move production to Pro before investor demo |
| Transactional email | Resend Pro | $20/month for 50k emails/month; free tier has daily cap | Use Pro once external demo invites begin |
| Football API | API-Football | Free 100 requests/day; Pro $19/month for 7,500/day; Ultra $29/month for 75,000/day | Start Pro for demo, Ultra only if running broad syncs |
| Alternative football API | football-data.org | Free; ML Pack Light/Deep Data at EUR29/month, Standard EUR49/month, Advanced EUR99/month | Evaluate for European historical depth |
| AI analysis | OpenAI API | GPT-5.6 sol listed at $4 input / $20 output per 1M short-context tokens | Budget $100-$300/month for controlled analyst workflows |

Practical two-week budget:

- Minimum live-demo budget: $85-$150/month.
- Safer investor-demo budget: $200-$500/month, including usage buffer and data/API experimentation.
- Serious pilot budget: $750-$2,000/month once clubs, analysts, and data ingestion jobs are active.

## Demo Risk Register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Supabase project pause or degraded health | Demo cannot log in or load data | Supabase Pro, daily production smoke test, backup demo account |
| API provider quota/rate limit | Sync or live enrichment fails | Pre-seed demo data and avoid live sync dependency during meeting |
| Demo data looks thin | Investors see a shell, not a product | Freeze three strong mandate stories and eight credible coach profiles |
| ELO claim overreaches | Trust damage with football/data-savvy investors | Label current feature as a season-results strength proxy; show proper ingestion roadmap |
| Confidentiality model unclear | Product seems risky for clubs/coaches | Emphasize source review, controlled release, role boundaries |
| Too many screens | Demo feels sprawling | Use one spine: club signal -> mandate -> recommendation -> diligence -> controlled release |

## Demo Story Spine

1. Start on Dashboard: "This is what the operator needs to move today."
2. Open a live club/mandate: "The question is not who exists, it is who fits this specific board problem."
3. Show club context and the season-results strength proxy trend: "The club situation changes the appointment brief."
4. Show board recommendation: "We turn evidence into a decision, with confidence and risks visible."
5. Open candidate detail/assessment pack: "Every conclusion is traceable and reviewable."
6. Show intelligence workflow: "The moat is controlled evidence, not scraped public profiles."
7. Show club/coach portal boundary: "External users only see what they are allowed to see."
8. Close with roadmap and funding ask: "Investment buys data coverage, workflow reliability, and go-to-market pilots."

## Next Product Slices

1. Make the board recommendation card interactive and state-synchronised.
2. Keep the West Ham/Kieran narrative contract enforced in the repo by the demo gate, then validate the live records with the authenticated dry-run checklist.
3. Add an investor-safe "Data coverage" badge to coach and mandate pages.
4. Add manager-context trend placeholders to coach career pages using stint dates and club trend data.
5. Build production smoke-test automation for the final two-week run-in.

## Source Links Checked

- API-Football pricing: https://www.api-football.com/pricing
- football-data.org pricing: https://www.football-data.org/pricing
- football-data.org API documentation: https://www.football-data.org/documentation/api
- ClubElo reference via soccerdata docs: https://soccerdata.readthedocs.io/en/latest/reference/clubelo.html
- Supabase pricing: https://supabase.com/pricing
- Vercel pricing: https://vercel.com/pricing
- Resend pricing: https://resend.com/pricing
- OpenAI API pricing: https://developers.openai.com/api/docs/pricing
