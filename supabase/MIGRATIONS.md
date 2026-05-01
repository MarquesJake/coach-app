# Supabase Migration Hygiene

## Source of truth

The source of truth for database structure is the ordered SQL history in `supabase/migrations/` plus the live Supabase project after those migrations have been applied.

`src/lib/types/database.ts` is generated from the live database. It is not the schema source of truth. If generated types expose a table or column, that table or column must also be explainable by an ordered migration in `supabase/migrations/`.

Manual SQL files, one-off repair scripts, and combined apply scripts must not live in `supabase/migrations/` unless they are intended to run exactly once through `supabase db push`.

## How to add migrations

1. Create a new SQL file in `supabase/migrations/` with a unique timestamp prefix.
2. Keep migrations append-only. Do not edit old migrations after they have been applied to shared or remote databases.
3. Prefer idempotent safety where practical: `create table if not exists`, `alter table ... add column if not exists`, `drop policy if exists` followed by `create policy`.
4. Keep data backfills explicit and scoped. Avoid destructive statements unless the migration name and comments make the intent obvious.
5. Run `supabase db push` against the intended environment through the normal workflow.

## When to regenerate database types

Regenerate `src/lib/types/database.ts` after any migration that changes tables, columns, enums, relationships, views, or function signatures used by the app.

After regenerating types, run:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

If generated types change but no migration explains the change, stop and reconcile the migration history before building new app code on top of that schema.

## What not to do

- Do not keep combined helper scripts such as `COMBINED_apply_all.sql` inside `supabase/migrations/`.
- Do not rename applied migrations just to make filenames prettier.
- Do not patch generated types by hand to hide schema drift.
- Do not add schema changes through the Supabase SQL editor without adding a matching migration.
- Do not rely on broad RLS policies as placeholders. Tighten policies in new migrations with `drop policy if exists` and `create policy`.
- Do not mix demo seed data, destructive reset scripts, and production schema changes in the same migration.
