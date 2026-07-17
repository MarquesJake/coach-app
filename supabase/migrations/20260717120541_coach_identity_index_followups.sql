-- Cover coach access-event foreign keys used by audit and revocation queries.
create index if not exists coach_access_events_organization_idx
  on public.coach_access_events (organization_id);
create index if not exists coach_access_events_actor_idx
  on public.coach_access_events (actor_user_id)
  where actor_user_id is not null;
create index if not exists coach_access_events_target_idx
  on public.coach_access_events (target_user_id)
  where target_user_id is not null;
create index if not exists coach_invitations_organization_idx
  on public.coach_invitations (organization_id);
