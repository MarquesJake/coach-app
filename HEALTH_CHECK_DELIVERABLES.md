# Health Check Deliverables

## 1. Status

| Check | Result |
|-------|--------|
| **npm run lint** | Pass |
| **npx tsc --noEmit** | Pass |
| **npm run build** | Pass |
| **Supabase schema vs code** | All queries use columns that exist in `src/lib/types/database.ts`. No mismatches (e.g. `created_at` / `occurred_at` / `last_updated` are used correctly). |
| **Auth / user scoping** | Fixed: Matches page and Intelligence page now scope to the authenticated user. Vacancies/new now scopes coaches to user. |
| **RLS** | Mandates, shortlist, deliverables, activity_log, and config tables have RLS and policies. Vacancies and matches have update/insert policies; SELECT is not restricted by RLS (app filters by user's clubs). See note below. |
| **UI navigation** | All major routes have a visible nav entry in the sidebar: Dashboard Overview, Coaches, Mandates, Matches, Intelligence, Clubs, Settings, Config. Sub-routes (e.g. coach profile, mandate detail, mandate preferences, mandate new) are reachable from these. |

**RLS note (vacancies / matches):** The combined migration adds UPDATE policy for vacancies and INSERT/UPDATE for matches. It does **not** add SELECT policies for `vacancies` or `matches`. If RLS is enabled on those tables, add SELECT policies scoped to the user's clubs (e.g. `club_id IN (SELECT id FROM clubs WHERE user_id = auth.uid())` for vacancies; for matches, `vacancy_id IN (SELECT v.id FROM vacancies v JOIN clubs c ON v.club_id = c.id WHERE c.user_id = auth.uid())`). The app now filters these in code so data is scoped even without RLS SELECT.

---

## 2. Fixes applied (file paths)

- **src/app/(dashboard)/matches/page.tsx**  
  - `loadVacancies`: Only load vacancies for the current user's clubs (fetch clubs by `user_id`, then `vacancies` with `club_id` in those club ids).  
  - `loadVacancyAndMatches`: After loading vacancy and matches, ensure the vacancy belongs to the user's clubs; otherwise return null vacancy and empty matches.

- **src/app/(dashboard)/intelligence/page.tsx**  
  - Intelligence feed scoped to the current user: load coach ids for `user_id`, then load `coach_updates` with `coach_id` in those ids.

- **src/app/(dashboard)/vacancies/new/page.tsx**  
  - Coaches fetch for matchmaking scoped to current user: `.eq('user_id', user.id)` on `coaches` select.

---

## 3. Combined SQL script for Supabase

A single script is provided so you can paste and run it in the Supabase SQL Editor:

**File:** `supabase/migrations/COMBINED_apply_all.sql`

- Uses `create table if not exists`, `add column if not exists`, `create index if not exists`.
- Drops and recreates policies (PostgreSQL has no `create policy if not exists`).
- Does not drop data or rename columns.
- **Prerequisite:** Base tables must already exist: `coaches`, `clubs`, `vacancies`, `matches`, `coach_updates`. If your project has no prior migrations, create these first or run your base schema.

**Ordered checklist of migrations (apply in this order):**

| Order | Migration | What it changes | Pages that depend on it |
|-------|-----------|-----------------|--------------------------|
| 1 | 20260217 | Coach scoring columns; coach_updates (occurred_at, confidence, etc.); mandates, mandate_shortlist, mandate_deliverables tables and RLS | Overview, Coaches list/profile, Mandates list/detail/new/preferences/edit, mandate shortlist & deliverables |
| 2 | 20260218 | vacancies.executive_brief; RLS policies for vacancy update and match insert/update | Matches (generate brief), vacancies |
| 3 | 20260219 | mandates.pipeline_stage | Mandates board/detail, pipeline stage UI |
| 4 | 20260220 | activity_log table and RLS | Coach profile activity, any activity timeline |
| 5 | 20260221 | matches risk_score, confidence_score, board_compatibility_score | Matches page, scoring display |
| 6 | 20260222 | mandates.custom_club_name, club_id nullable | Mandates new/detail (custom club name) |
| 7 | 20260223 | Realtime publication (mandates, mandate_shortlist, activity_log) | Realtime mandate/shortlist/activity updates |
| 8 | 20260224 | clubs.notes | Clubs list/detail |
| 9 | 20260225 | All config_* tables and RLS | Config hub and all config sub-pages |
| 10 | 20260226 | mandate_shortlist.notes | Mandate detail shortlist notes |

**Page dependencies (summary):**

- Overview, mandates list/detail/preferences/edit, mandate new: mandates, shortlist, deliverables, pipeline_stage, custom_club_name, clubs.
- Coaches list/profile, intelligence: coaches, coach_updates, activity_log.
- Matches, vacancies/new: vacancies, matches, executive_brief, matches scoring columns.
- Clubs: clubs, notes.
- Config pages: all config_* tables.

---

## 4. How to verify

**Commands (run from repo root):**

```bash
npm run lint
npx tsc --noEmit
npm run build
```

**Smoke test path (after applying the combined SQL and with a logged-in user):**

1. **Overview** – Go to `/dashboard` (redirects to `/dashboard/overview`). Should load without error.
2. **Coaches** – Go to `/coaches`. List should load (possibly empty).
3. **Coach profile** – Click a coach or go to `/coaches/[id]`. Profile and activity/updates should load.
4. **Mandates** – Go to `/mandates`. Board/list should load.
5. **Mandate wizard step 1** – Go to `/mandates/new`. Form and club selector should load; create a mandate (with or without a new club).
6. **Mandate preferences** – From a mandate detail, go to `/mandates/[id]/preferences`. Preferences page should load.
7. **Mandate detail** – Go to `/mandates/[id]`. Detail, shortlist, deliverables should load.
8. **Matches** – Go to `/matches`. Only vacancies for your clubs should appear; select one to see matches.
9. **Intelligence** – Go to `/intelligence`. Only updates for your coaches should appear.
10. **Clubs** – Go to `/clubs`. List and notes should load.
11. **Settings** – Go to `/settings`. Page should load.
12. **Config** – Go to `/config`. Config hub and sub-pages (e.g. pipeline stages, reputation tiers) should load.

**Quick one-liner (build + lint + typecheck):**

```bash
npm run lint && npx tsc --noEmit && npm run build
```

All should complete with no errors.
