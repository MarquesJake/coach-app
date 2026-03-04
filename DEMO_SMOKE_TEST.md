# Demo data smoke test checklist

Use this after running **Generate demo data** from **Admin → Data tools** to confirm every coach profile reads like a real dossier.

## 1. Generate and list

- [ ] Run **Generate demo data** (demo user). Toast shows counts (coaches, stints, intelligence, mandates, etc.).
- [ ] **Coaches** list shows 12 coaches. No empty list.
- [ ] Re-run **Generate demo data**. No duplicate spam; counts remain stable (idempotent).

## 2. Coach profile – every tab has content

Open **one coach** (e.g. first in list). For each tab, confirm **no placeholder or “No data”** where content is expected:

- [ ] **Overview** – Snapshot, executive summary, key metrics present.
- [ ] **Tactical** – Formation, in/out of possession shapes, pressing height, build-up, transitions, defensive structure, notes (specific triggers, e.g. jump to full-back, lock onto 6).
- [ ] **Leadership** – Leadership style, staff management, player development, academy, comms. 2–4 intelligence items with concrete behaviours (training standards, delegation, senior players, meetings).
- [ ] **Coaching model** – Sliders/fields populated: tactical identity, transition model, rest defence, set pieces, training methodology.
- [ ] **Career** – Stints with club names, dates, appointment/exit context, performance summary, style summary, notable outcomes (2–3 bullets), plausible PPG/win rate.
- [ ] **Staff network** – 3–6 entries; real roles (e.g. Assistant Coach, Set Piece Coach, Head of Performance); impact and before/after observations.
- [ ] **Data / Recruitment DNA** – Recruitment history 8–15 rows; some repeated signings/agents; derived metrics (repeat signings, repeat agents, loan reliance, network density) consistent with data.
- [ ] **Risk** – Background check (dressing room, media, board, risk rating). If risk flags: 2–4 due diligence items, professional wording.
- [ ] **Intelligence** – 10–18 items; scout-note style titles; categories spread; dates over last 18 months; themes match tactical/leadership.
- [ ] **Scoring** – Scores present; high-press coaches trend higher on tactical; narrative matches scores.
- [ ] **Fit** – At least one mandate with meaningful fit explanation.
- [ ] **Similar** – 5–8 similar coaches; scores 70–92; breakdown with short explanation.
- [ ] **Mandate fit** – Longlist fit explanation and shortlist notes read like real rationale; shortlist status one of: Under Review, Shortlisted, In Negotiations, Declined.

## 3. Coherence

- [ ] Tactical report matches coach’s preferred style, pressing intensity, build preference, systems.
- [ ] Career progression (reputation tier, wage band) fits stint outcomes (survival, promotion, cup run, etc.).
- [ ] Staff network roles and impact align with leadership/staff management narrative.
- [ ] Intelligence items reference same themes as tactical and leadership sections.
- [ ] Derived metrics match recruitment (repeat agents, repeat signings, loan reliance, network density).
- [ ] All data is fictional (no real people or real clubs).

## 4. Mandate shortlist status

- [ ] Mandate → Shortlist: status dropdown shows only **Under Review**, **Shortlisted**, **In Negotiations**, **Declined**.
- [ ] Adding/updating a shortlist entry with one of these statuses saves without error.

## 5. Profile save refresh

- [ ] **Modify profile** (edit coach) → Save. Changes appear immediately (no stale data); list and profile refresh.

## 6. Quality gate (CI)

- [ ] `npm run lint` passes.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run build` succeeds.
