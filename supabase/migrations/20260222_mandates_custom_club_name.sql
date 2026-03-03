-- Allow mandates to reference either a club (club_id) or a custom name (custom_club_name).
-- Backward compatibility: existing rows keep club_id set; new "custom only" rows have club_id null.
alter table public.mandates
  add column if not exists custom_club_name text,
  alter column club_id drop not null;

comment on column public.mandates.custom_club_name is 'Display name when no club record is used (club_id null)';
