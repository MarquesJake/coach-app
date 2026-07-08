# Coach First Platform Workflow Audit - 8 July 2026

## Flow Captured

1. Dashboard OS - healthy.
2. Mandates list - healthy, but internal workflow labels were visible before the cleanup.
3. New mandate - healthy and usable as the start of a real club brief.
4. Mandate workspace - healthy after server data load; the generic spinner made it feel hung during first load.
5. Intelligence Inbox - healthy, but an empty queue did not explain the capture model strongly enough.
6. Coach database - healthy.
7. Coach profile - healthy after server data load; benefits from the improved loading state.
8. Coach portal - healthy and directionally strong for the coach-side moat.
9. Candidate assessment - healthy.
10. Head Coach Assessment Pack - healthy and board-facing.

## Findings

- Internal labels such as `[Workflow Test]` made otherwise credible demo data feel artificial.
- Slow server-rendered routes showed a bare spinner, which could be mistaken for a broken app in an investor walkthrough.
- The Intelligence Inbox empty state did not yet explain the operating model from the meeting: agent route, football reference, coach material, public signal.
- The core source-to-decision spine is now in place: raw intelligence can be promoted into profile claims, assessment evidence, confidential material, agent interactions, or the general feed.

## Changes Made

- Added a shared display-name helper so internal test prefixes are stripped from investor-facing club/mandate names.
- Applied that helper across dashboard, mandates, workspace, assessment, pack, intelligence, coach profile, coach intelligence, coach fit, coach career and shortlist export surfaces.
- Replaced the bare app spinner with a branded Appointment OS loading state.
- Added four Intelligence Inbox capture lanes that match the meeting thesis: Agent route, Football reference, Coach material, Public signal.
- Regenerated the investor data/API costing PDF with current public pricing sources and a 90-day budget recommendation.

## Remaining Risks

- Full coach-owned authentication and uploads still need proper product hardening.
- Data/video providers need formal quotes before the investor number becomes procurement-ready.
- Organisation roles, audit logs and external club access remain the next real-product step after the demo.
