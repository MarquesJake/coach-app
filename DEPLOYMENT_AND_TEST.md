# Deployment and test summary

## What was implemented in this pass

### 1. Migrations (no manual SQL)

- **`supabase/migrations/20260227_ownership_bootstrap.sql`**
  - Adds `user_id` to `public.clubs` and `public.coaches` if not exists (nullable, FK to `auth.users`).
  - Enables RLS and policies for clubs and coaches (view/insert/update/delete own rows).
  - Defines RPCs for Admin Data tools:
    - `get_unowned_counts()`: returns counts of rows where `user_id` is null (and whether tables have `user_id`).
    - `claim_unowned_rows()`: sets `user_id = auth.uid()` where null for clubs and coaches; returns counts claimed.

### 2. GitHub Actions (migrations on push)

- **`.github/workflows/supabase-migrations.yml`**
  - Uses `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, and optional `SUPABASE_DB_PASSWORD`.
  - If `SUPABASE_DB_PASSWORD` is set, runs `supabase db push --yes --db-url "postgresql://postgres:$SUPABASE_DB_PASSWORD@db.$SUPABASE_PROJECT_REF.supabase.co:5432/postgres"`.
  - Otherwise runs `supabase db push --yes` (uses linked project; may prompt for password in CI if not provided).
  - Fails the job if migrations fail.

### 3. Admin Data tools (claim unowned rows)

- **`src/app/(dashboard)/admin/data-tools/page.tsx`**
  - Server-rendered page that calls `get_unowned_counts` and shows unowned counts for clubs and coaches.
  - If tables lack `user_id`, shows a clear message instead of erroring.
- **`src/app/(dashboard)/admin/data-tools/actions.ts`**
  - `claimUnownedRowsAction()` calls `claim_unowned_rows` and returns claimed counts or error.
- **`src/app/(dashboard)/admin/data-tools/_components/claim-data-button.tsx`**
  - Client button “Claim all unowned rows” with loading state and toasts; reloads after success.

### 4. Sidebar navigation

- **`src/app/(dashboard)/_components/sidebar.tsx`**
  - Admin section now includes: **Config**, **Settings**, **Data tools** (link to `/admin/data-tools`).
  - Data tools uses the Database icon.

### 5. Empty state

- **`src/app/(dashboard)/coaches/page.tsx`**
  - When there are no coaches, shows an empty state with title “No coaches yet”, short description, and “Add coach” CTA to `/coaches/new`.

### 6. Build and checks

- `npm run lint` passes.
- `npx tsc --noEmit` passes.
- `npm run build` passes.

---

## GitHub secrets to set

For migrations to run on push to `main`:

1. **SUPABASE_ACCESS_TOKEN** – from Supabase dashboard: Account → Access Tokens.
2. **SUPABASE_PROJECT_REF** – project reference (e.g. from dashboard URL: `https://supabase.com/dashboard/project/<ref>`).
3. **SUPABASE_DB_PASSWORD** (recommended) – database password for the project, so `supabase db push` can connect without prompts.

---

## What to test

1. **Sidebar**
   - Open app; confirm **Dashboard Overview**, **Coaches**, **Clubs**, **Mandates**, **Matches**, **Intelligence** under Platform, and **Config**, **Settings**, **Data tools** under Admin. Every link goes to a valid page.

2. **Data tools**
   - Go to **Admin → Data tools**.
   - If migration has not been applied: you may see an error message about applying the migration (or that tables don’t have `user_id`).
   - After applying migration: page shows unowned counts for clubs and coaches (or 0). Click **Claim all unowned rows**; toast and reload; counts should become 0.

3. **Coaches**
   - With no coaches, coaches list shows empty state and “Add coach” CTA. Add a coach and confirm they appear.

4. **Mandate Step 1**
   - Create a mandate (Step 1). Confirm it saves without constraint errors (pipeline_stage and enum handling from previous fixes).

5. **Migrations in CI**
   - Push to `main` and confirm the Supabase Migrations workflow runs and applies migrations (or fails with a clear error if secrets/DB are misconfigured).

---

## Commands to run locally

```bash
npm run lint
npx tsc --noEmit
npm run build
```

All three should pass.

---

## Not done in this pass (for later)

- Config-driven dropdowns with “add new” and free-text on every selection (partial today; Config/SelectWithOther exist).
- Coach profile expansion and structured manual scoring (e.g. last reviewed, reasons).
- Mandate longlist ranking UI and score breakdown per coach.
- Global loading/error boundaries and toasts for every CRUD (mandates have toasts; others can be added incrementally).
- Matches page wiring is already scoped to user’s clubs; further UX polish is optional.

These can be tackled in follow-up changes.
