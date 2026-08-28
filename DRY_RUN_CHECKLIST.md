# Coach First - Investor Demo Dry-Run Checklist

**Production:** https://coach-app-seven-rose.vercel.app
**Login:** `jakemarques@live.com`
**Browser:** Chrome
**Primary story:** West Ham United -> Kieran McKenna
**Mandate:** `f3646b63-7d72-4420-8c16-b8456a4fee98`
**Candidate:** `c04c8747-bda1-4c95-a1ad-ed82af70c31d`

Authenticated production audit completed on 28 August 2026. The dashboard, appointment plan, mandate workspace, candidate room, assessment overview, Kieran McKenna assessment, board pack and club decision room loaded without browser errors.

## Pre-Call

- [ ] Run `npm run verify:production` and `npm run verify:demo`.
- [ ] Confirm the deployed commit includes the investor-demo credibility branch.
- [ ] Open Tab 1 at the production dashboard.
- [ ] Open Tab 2 at Kieran McKenna's assessment pack as the fallback.
- [ ] Save a fresh PDF backup named `Kieran-McKenna-Head-Coach-Assessment-Pack.pdf` with background graphics enabled.
- [ ] Confirm the PDF opens and the confidential cover, findings and reference appendix render.
- [ ] Close unrelated tabs, collapse internal tools and turn notifications off.

## Exact Click Path

1. **Today -> Mandates -> West Ham United -> Plan**
2. **Brief** to show the club context and analyst recommendation
3. **Assessment** to show the three-option board decision set
4. **Kieran McKenna** to open the evidence workspace
5. **Players Development** or **Cultural & Organisational Fit** to show evidence provenance
6. **Assessment pack ->** to show the board artifact
7. **Pack -> Open purchased preview** to show the controlled club decision room

## Production Truth To Confirm

- [ ] The appointment plan shows `6/7 gates ready`.
- [ ] The only open gate is appointment feasibility.
- [ ] The workspace shows a recorded `Proceed` recommendation for Kieran McKenna at 83% confidence.
- [ ] The candidate room contains six decision candidates.
- [ ] The assessment overview shows Kieran McKenna, Francesco Farioli and Gary O'Neil as lead, monitor and do-not-proceed examples.
- [ ] Kieran's assessment shows `9/9 criteria`, `9/9 complete`, five interview/reference records and four private materials.
- [ ] The board pack labels illustrative analysis, synthetic interview answers and composite references honestly.
- [ ] The pack lists four controlled materials and three composite reference records.
- [ ] The club decision room shows four confidential materials held by Coach First and an active release request.

## What Not To Touch

- [ ] Do not create a user, mandate, candidate, preview or release request live.
- [ ] Do not run **Generate demo data** or a football API sync.
- [ ] Do not edit recommendation scores or assessment evidence.
- [ ] Do not open internal data tools or the legacy **Matches** route.
- [ ] Do not expose agent contact details, source identities or private storage paths.

## Known Questions

| Question | Answer |
| --- | --- |
| Is the evidence real? | The production workflow is live. Investor records clearly label illustrative analysis, synthetic interview answers and composite references; paid work replaces them with authorised evidence. |
| Is the recommendation automated? | Evidence pull-through is automated; the analyst owns the judgement, confidence and verdict. |
| Why is feasibility still open? | It is the honest next gate: compensation, staff, family, relocation and timing require direct permissioned checks. |
| Where is ELO? | The live product uses a transparent season-results strength proxy. Funding adds provider-backed match ingestion and manager-context ELO trajectories. |
| How is private material protected? | The club sees scope and status first. Files are released only after commercial scope and coach permissions are approved, through controlled short-lived access. |

## Pass Criteria

- [ ] Complete the story in under seven minutes without mutating data.
- [ ] Every page loads without an error overlay or visible empty state.
- [ ] The language matches the live labels and scores.
- [ ] The saved PDF opens before the call.
- [ ] A second person can run the path using only this checklist and the demo script.
