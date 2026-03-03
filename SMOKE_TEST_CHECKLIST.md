# Smoke test checklist (Coach Intelligence Core)

Run after applying migration `20260228_coach_intelligence_core.sql` and deploying.

## 1. Auth & layout (1 min)
- [ ] Log in; sidebar shows: Overview, Coaches, Staff, Clubs, Mandates, Matches, Intelligence, Config, Settings, Data tools
- [ ] Each nav link loads a page (no 404)

## 2. Staff (1 min)
- [ ] **Staff** → list (empty or with rows)
- [ ] **Add staff** → form; submit creates staff and redirects to detail
- [ ] Staff detail shows overview and “Work history with coaches” (empty if none)

## 3. Coaches (1 min)
- [ ] **Coaches** → list with search and filters
- [ ] **Add coach** (from list or /coaches/new) → create with name only; no placeholder "—" in DB for new coaches
- [ ] Coach detail loads; pipeline stepper shows labels (e.g. “Board approved”)

- [ ] **Coach profile edit (drawers)** — Open a coach; each tab (Overview, Tactical, Leadership, Risk, Scoring) has **Edit**. Edit fields, Save, toast; refresh to see persistence. Scoring: 0–100, blank = null. No placeholder stored.

## 4. Mandates & pipeline (1 min)
- [ ] **Mandates** → board with columns (Identified, Board approved, … Closed)
- [ ] Empty columns show “Add mandate” CTA
- [ ] Drag a card to another column → toast “Moved to …”; refresh → card stays in new column (DB key used, e.g. `board_approved`)
- [ ] Mandate detail: tabs **Overview | Longlist | Shortlist**
- [ ] **Longlist** → “Generate longlist” runs; list shows coaches with score/explanation; “Save longlist” persists
- [ ] **Shortlist** → shows shortlisted coaches if any

## 5. Intelligence (1 min)
- [ ] **Intelligence** → “Weekly Intelligence Feed” (coach updates) + “Evidence & intelligence items” section
- [ ] **Quick add** → modal: entity type (Coach/Staff/Club/Mandate), entity, title; submit adds item to feed
- [ ] Filter evidence by All / Coach / Staff / Club / Mandate

## 6. Build & lint
- [ ] `npm run lint` — no errors
- [ ] `npx tsc --noEmit` — no errors
- [ ] `npm run build` — succeeds
