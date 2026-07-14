-- Cover club identity foreign keys used by audit and lifecycle lookups.
create index if not exists club_invitations_invited_by_idx
  on public.club_invitations(invited_by);
create index if not exists club_invitations_claimed_by_idx
  on public.club_invitations(claimed_by)
  where claimed_by is not null;
create index if not exists organization_access_events_invitation_idx
  on public.organization_access_events(invitation_id)
  where invitation_id is not null;
create index if not exists organization_access_events_actor_idx
  on public.organization_access_events(actor_user_id)
  where actor_user_id is not null;
create index if not exists organization_access_events_target_idx
  on public.organization_access_events(target_user_id)
  where target_user_id is not null;
