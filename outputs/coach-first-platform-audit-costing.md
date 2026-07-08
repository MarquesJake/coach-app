# Coach First - Investor Data, API and Platform Costing

Prepared 8 July 2026.


## 1. Product Direction
- The app should operate as a source-to-decision system: raw intelligence enters once, is verified, then becomes profile claims, assessment evidence, confidential material or board-pack content.
- The coach portal is the supply-side moat: coaches and agents add presentations, training clips, game model documents, staff network and feasibility details before a club asks.
- The relationship layer is the USP: agent calls, CEO/sporting director references, journalist context and trusted football conversations must be stored with source tier, confidence, sensitivity and contradiction status.
- The board pack stays simple: strengths, risks, recommendation, confidence, missing evidence, cost/feasibility and next action.

## 2. Costed Data Stack

| Need | Provider examples | Public pricing / range | Recommendation |
| --- | --- | --- | --- |
| Core fixtures, results, standings, squads | API-Football | Plans start at $19/month; all plans include competitions/endpoints. | Keep as lean base layer for broad football coverage. |
| Premium event/video/scouting data | Hudl Wyscout, StatsBomb, Opta/Stats Perform | Mostly quote-led. Wyscout publishes package tiers but API/custom data requires quote. | Do not buy blind. Get quotes and test against 20 coach profiles. |
| News monitoring | NewsAPI | Developer free for dev only; Business $449/month; Advanced $1,749/month. | Use free/dev for prototype; budget Business for production monitoring. |
| Google/news/social scraping | Apify, SerpApi | Apify Starter $29/month, Scale $199, Business $999 plus usage. SerpApi $25/1k, $75/5k, $150/15k searches. | Start with targeted coach queries; avoid large legal-risk scraping until policies are clear. |
| Call/video transcription | OpenAI, AssemblyAI | OpenAI mini transcription approx $0.003/min; AssemblyAI has a substantial free tier and pay-as-you-go/custom scale. | Use transcription immediately for agent calls and Zooms. |
| AI extraction/classification | OpenAI API | OpenAI web search tool listed at $10/1k calls; token pricing varies by model. | Use cheaper models for extraction, expensive models only for pack drafting/reasoning. |
| Social listening | Brandwatch, Talkwalker, Meltwater alternatives | Quote-led; enterprise social listening often five figures/year. | Phase 3, after targeted monitoring proves value. |
| Storage and data room | Supabase Storage/Vercel Blob/S3 | Low at demo scale; rises with video volume and egress. | Store metadata now; keep large videos linked or object-stored with access controls. |

## 3. Recommended Budget

| Scenario | Monthly tools/data | One-off build budget | What it buys |
| --- | --- | --- | --- |
| Lean investor-ready | GBP200-GBP900 | GBP5k-GBP10k | API-Football, targeted scraping/search, transcription, AI extraction, storage, manual analyst review. |
| Serious club pilot | GBP2k-GBP8k | GBP20k-GBP40k | News monitoring, structured source graph, coach portal uploads, access controls, pack versioning, one data/video quote. |
| Institutional product | GBP8k-GBP25k+ | GBP75k-GBP150k+ | Premium event/video data, organisation seats, audit trail, automated ingestion, legal review, enterprise monitoring. |

## 4. Build Priorities
- Close the intelligence loop: every raw item must promote to feed, profile claim, assessment evidence, confidential material or relationship log.
- Add source expiry and contradiction flags so stale agent intelligence does not silently drive recommendations.
- Make coach portal invitations real: coach-owned login, upload storage, review status, share controls, and analyst approval.
- Add board-pack versioning: every pack should have prepared-by, version, source appendix, excluded evidence count and redaction state.
- Add organisation model only after investor demo: club seats, roles, access logs and external data-room requests.

## 5. Investor Ask
Ask for a 90-day product/data budget rather than a vague software budget. The right ask is GBP20k-GBP40k: enough to harden the app, create the source/claim/evidence graph, run targeted ingestion, buy transcription/search/news tools, and get serious quotes from Wyscout/StatsBomb/Opta without committing to a large annual deal too early.

## 6. Source Notes
- API-Football pricing: https://www.api-football.com/pricing
- NewsAPI pricing and terms: https://newsapi.org/pricing and https://newsapi.org/terms
- Apify pricing: https://apify.com/pricing
- SerpApi pricing: https://serpapi.com/pricing
- OpenAI API pricing: https://developers.openai.com/api/docs/pricing
- AssemblyAI pricing: https://www.assemblyai.com/pricing
- Hudl Wyscout pricing page: https://www.hudl.com/products/wyscout/pricing
- Brandwatch plans: https://www.brandwatch.com/plans/
