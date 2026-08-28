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
- [ ] After demo-smoke secrets are configured, run `npm run verify:demo:authenticated` or dispatch **Investor Demo Smoke** in GitHub Actions.
- [ ] If `SUPABASE_DB_URL` is available, run `npm run test:rls:materials`.

## Demo Data Freeze

- [ ] Freeze West Ham United as the primary mandate story and Kieran McKenna as the lead candidate.
- [ ] Confirm mandate `f3646b63-7d72-4420-8c16-b8456a4fee98` still shows 6/7 appointment gates ready.
- [ ] Confirm the workspace shows a recorded `Proceed` recommendation for Kieran McKenna at 83% confidence.
- [ ] Confirm Kieran has 9/9 criteria complete, five interview/reference records, four controlled materials, a board pack and a published club preview.
- [ ] Confirm the assessment decision set still contrasts Kieran McKenna, Francesco Farioli and Gary O'Neil.
- [ ] Keep any additional mandates and coach profiles as backup/proof of breadth, not the main click path.
- [ ] Confirm no live demo step depends on a fresh API sync.

## Trust Boundary Freeze

- [ ] Open the frozen club dossier and confirm the 13 August expiry is shown as `Access expired` with no released file links.
- [ ] If the release is intentionally renewed before the demo, confirm material links use `/api/private-materials/...`, create short-lived signed URLs and never expose storage paths.
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

`verified application baseline: record the final production merge during the 48-hour freeze`
