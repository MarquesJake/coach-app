-- Add title and detail to alerts for display
alter table public.alerts add column if not exists title text default '';
alter table public.alerts add column if not exists detail text;

-- 20260305_alerts_title_detail
-- Purpose: add display fields to alerts for UI rendering
-- Safe to re-run: uses IF NOT EXISTS and idempotent backfill

begin;

-- Add columns
alter table public.alerts
  add column if not exists title text,
  add column if not exists detail text;

-- Backfill existing rows so UI does not render null titles
update public.alerts
set title = coalesce(title, '')
where title is null;

-- Ensure title is always present going forward
alter table public.alerts
  alter column title set default '',
  alter column title set not null;

commit;