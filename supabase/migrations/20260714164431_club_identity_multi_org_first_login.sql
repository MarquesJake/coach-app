-- A user may legitimately hold seats at more than one club. Keep one first-login
-- event per organization rather than one event for the user's entire lifetime.
drop index if exists public.organization_access_events_first_login_idx;
create unique index organization_access_events_first_login_idx
  on public.organization_access_events(organization_id, target_user_id)
  where event_type = 'club_first_login';
