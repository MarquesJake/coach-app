# Coach First Investor Demo Freeze Checklist

Use this for the final seven-day credibility sprint and again 48 hours before the investor demo.

## Freeze Goal

Freeze one strong, honest story:

`Dashboard -> Mandate workspace -> club context -> current leading candidate -> assessment -> board pack -> controlled release`

Do not demo broad browsing. The product should feel like a private appointment decision system with a clear operating spine.

## Daily Gate

- [ ] Run `npm run lint`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run `npm run verify:production`.
- [ ] Run `npm run verify:demo`.
- [ ] If `SUPABASE_DB_URL` is available, run `npm run test:rls:materials`.

## Demo Data Freeze

- [ ] Pick the primary mandate story and write its opening sentence in the demo script.
- [ ] Confirm the mandate has a complete club context, season-results strength proxy, coaching stability, and clear strategic objective.
- [ ] Confirm the workspace opens to either a true analyst recommendation or an honestly labeled current leading candidate.
- [ ] Confirm the top candidate has enough evidence to support the assessment page and board pack.
- [ ] Confirm two contrast mandates exist only as backup/proof of breadth, not the main click path.
- [ ] Confirm 8-12 coach profiles have credible career, tactical, leadership, risk, feasibility, and source coverage.
- [ ] Confirm no live demo step depends on a fresh API sync.

## Trust Boundary Freeze

- [ ] Open a released club dossier and confirm confidential materials use `/api/private-materials/...` links.
- [ ] Confirm private material links create short-lived signed URLs and do not expose storage paths.
- [ ] Confirm coach-uploaded material is labeled separately from independent intelligence.
- [ ] Confirm analyst conclusions are not presented as automated verification.
- [ ] Confirm source identities and raw notes do not appear in club-facing screens.

## Investor Wording

- [ ] Say `season-results strength proxy` for the live trend.
- [ ] Say `provider-backed ELO trajectory` only for the paid-data roadmap.
- [ ] Say `current leading candidate` unless there is a recorded analyst recommendation verdict.
- [ ] Say `controlled release` for confidential materials, not open file sharing.
- [ ] Say `evidence-led workflow` before `AI`.

## What Not To Click

- [ ] Do not open legacy `/matches` unless explicitly asked.
- [ ] Do not run fresh sign-up or onboarding during the demo.
- [ ] Do not run live API sync during the meeting.
- [ ] Do not mutate demo data live.
- [ ] Do not open admin data tools unless explaining internal operations after the core demo.

## Freeze Sign-Off

- [ ] Production URL loads.
- [ ] Demo account logs in.
- [ ] Backup demo account logs in.
- [ ] Primary board pack is opened once before the call.
- [ ] A PDF backup of the primary board pack is saved locally.
- [ ] Browser tabs are preloaded and notifications are off.
- [ ] Latest verified commit hash is written here:

`commit: ______________________________`
