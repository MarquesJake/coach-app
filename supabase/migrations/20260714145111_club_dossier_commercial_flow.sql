-- Organisation-aware club portal and controlled dossier commerce.
-- The commercial order wraps the existing confidential access request; it does
-- not grant access by itself. Only an approved release grant unlocks materials.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  organization_type text not null check (organization_type in ('internal', 'club', 'coach_business', 'agency')),
  club_id uuid references public.clubs(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'analyst', 'club_owner', 'club_director', 'club_viewer', 'coach', 'coach_representative')),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended', 'revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create or replace function public.is_organization_member(
  target_organization_id uuid,
  allowed_roles text[] default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and (allowed_roles is null or membership.role = any (allowed_roles))
  );
$$;

revoke all on function public.is_organization_member(uuid, text[]) from public;
revoke all on function public.is_organization_member(uuid, text[]) from anon;
grant execute on function public.is_organization_member(uuid, text[]) to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;

create policy "Members can view their organizations"
  on public.organizations for select to authenticated
  using (created_by = (select auth.uid()) or public.is_organization_member(id));

create policy "Users can create organizations"
  on public.organizations for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy "Organization owners can update organizations"
  on public.organizations for update to authenticated
  using (created_by = (select auth.uid()) or public.is_organization_member(id, array['owner', 'admin']))
  with check (created_by = (select auth.uid()) or public.is_organization_member(id, array['owner', 'admin']));

create policy "Members can view memberships"
  on public.organization_memberships for select to authenticated
  using (user_id = (select auth.uid()) or public.is_organization_member(organization_id, array['owner', 'admin']));

create policy "Organization owners can add memberships"
  on public.organization_memberships for insert to authenticated
  with check (
    public.is_organization_member(organization_id, array['owner', 'admin'])
    or exists (
      select 1 from public.organizations organization
      where organization.id = organization_id
        and organization.created_by = (select auth.uid())
    )
  );

create policy "Organization owners can update memberships"
  on public.organization_memberships for update to authenticated
  using (public.is_organization_member(organization_id, array['owner', 'admin']))
  with check (public.is_organization_member(organization_id, array['owner', 'admin']));

create table if not exists public.club_briefs (
  id uuid primary key default gen_random_uuid(),
  buyer_organization_id uuid not null references public.organizations(id) on delete restrict,
  service_organization_id uuid not null references public.organizations(id) on delete restrict,
  club_id uuid references public.clubs(id) on delete set null,
  linked_mandate_id uuid references public.mandates(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null,
  role_title text not null default 'Head Coach',
  status text not null default 'draft' check (status in ('draft', 'submitted', 'in_review', 'converted', 'closed')),
  appointment_context text,
  football_identity text,
  in_possession_requirements text,
  out_of_possession_requirements text,
  transition_requirements text,
  set_piece_requirements text,
  squad_context text,
  player_development_priorities text,
  leadership_and_culture text,
  budget_parameters text,
  availability_timeline text,
  location_requirements text,
  work_permit_position text,
  process_requirements text,
  confidentiality_notes text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dossier_offers (
  id uuid primary key default gen_random_uuid(),
  seller_organization_id uuid not null references public.organizations(id) on delete restrict,
  buyer_organization_id uuid not null references public.organizations(id) on delete restrict,
  club_brief_id uuid references public.club_briefs(id) on delete set null,
  mandate_id uuid not null references public.mandates(id) on delete restrict,
  coach_id uuid not null references public.coaches(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'published', 'purchased', 'withdrawn', 'expired')),
  headline text not null,
  preview_summary text not null,
  fit_summary text,
  key_strengths text,
  key_risks text,
  verdict text,
  confidence integer check (confidence is null or confidence between 0 and 100),
  coach_name text not null,
  coach_current_role text,
  coach_nationality text,
  included_sections jsonb not null default '[]'::jsonb,
  private_material_count integer not null default 0 check (private_material_count >= 0),
  price_amount integer not null default 1500000 check (price_amount >= 0),
  currency text not null default 'GBP' check (currency ~ '^[A-Z]{3}$'),
  available_until timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (buyer_organization_id, mandate_id, coach_id)
);

create table if not exists public.dossier_orders (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null unique references public.dossier_offers(id) on delete restrict,
  seller_organization_id uuid not null references public.organizations(id) on delete restrict,
  buyer_organization_id uuid not null references public.organizations(id) on delete restrict,
  club_brief_id uuid references public.club_briefs(id) on delete set null,
  mandate_id uuid not null references public.mandates(id) on delete restrict,
  coach_id uuid not null references public.coaches(id) on delete restrict,
  access_request_id uuid not null unique references public.confidential_access_requests(id) on delete restrict,
  ordered_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'requested' check (status in ('requested', 'under_review', 'approved', 'active', 'expired', 'declined', 'cancelled', 'revoked')),
  payment_status text not null default 'invoice_requested' check (payment_status in ('invoice_requested', 'invoice_issued', 'paid', 'waived', 'refunded')),
  price_amount integer not null check (price_amount >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  intended_use text not null,
  buyer_reference text,
  internal_notes text,
  ordered_at timestamptz not null default now(),
  approved_at timestamptz,
  activated_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.confidential_access_grants (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.dossier_orders(id) on delete cascade,
  access_request_id uuid not null unique references public.confidential_access_requests(id) on delete restrict,
  buyer_organization_id uuid not null references public.organizations(id) on delete restrict,
  coach_id uuid not null references public.coaches(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  granted_by uuid not null references auth.users(id) on delete restrict,
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  allow_download boolean not null default false,
  watermark_label text,
  release_notes text,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.confidential_access_grant_materials (
  grant_id uuid not null references public.confidential_access_grants(id) on delete cascade,
  material_id uuid not null references public.coach_private_materials(id) on delete restrict,
  released_by uuid not null references auth.users(id) on delete restrict,
  released_at timestamptz not null default now(),
  primary key (grant_id, material_id)
);

create table if not exists public.dossier_access_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.dossier_orders(id) on delete cascade,
  grant_id uuid references public.confidential_access_grants(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  material_id uuid references public.coach_private_materials(id) on delete set null,
  event_type text not null check (event_type in ('order_submitted', 'order_approved', 'access_activated', 'material_viewed', 'access_revoked', 'access_expired')),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists organization_memberships_user_idx on public.organization_memberships(user_id, status);
create index if not exists club_briefs_buyer_idx on public.club_briefs(buyer_organization_id, status);
create index if not exists dossier_offers_buyer_idx on public.dossier_offers(buyer_organization_id, status);
create index if not exists dossier_orders_buyer_idx on public.dossier_orders(buyer_organization_id, status);
create index if not exists dossier_orders_seller_idx on public.dossier_orders(seller_organization_id, status);
create index if not exists dossier_events_order_idx on public.dossier_access_events(order_id, occurred_at desc);

alter table public.club_briefs enable row level security;
alter table public.dossier_offers enable row level security;
alter table public.dossier_orders enable row level security;
alter table public.confidential_access_grants enable row level security;
alter table public.confidential_access_grant_materials enable row level security;
alter table public.dossier_access_events enable row level security;

create policy "Brief participants can view club briefs"
  on public.club_briefs for select to authenticated
  using (public.is_organization_member(buyer_organization_id) or public.is_organization_member(service_organization_id));
create policy "Club decision makers can create briefs"
  on public.club_briefs for insert to authenticated
  with check (created_by = (select auth.uid()) and public.is_organization_member(buyer_organization_id, array['owner', 'admin', 'club_owner', 'club_director']));
create policy "Brief participants can update club briefs"
  on public.club_briefs for update to authenticated
  using (public.is_organization_member(buyer_organization_id, array['owner', 'admin', 'club_owner', 'club_director']) or public.is_organization_member(service_organization_id, array['owner', 'admin', 'analyst']))
  with check (public.is_organization_member(buyer_organization_id) or public.is_organization_member(service_organization_id));

create policy "Offer participants can view dossier offers"
  on public.dossier_offers for select to authenticated
  using (public.is_organization_member(buyer_organization_id) or public.is_organization_member(seller_organization_id));
create policy "Seller can manage dossier offers"
  on public.dossier_offers for all to authenticated
  using (public.is_organization_member(seller_organization_id, array['owner', 'admin', 'analyst']))
  with check (created_by = (select auth.uid()) and public.is_organization_member(seller_organization_id, array['owner', 'admin', 'analyst']));

create policy "Order participants can view dossier orders"
  on public.dossier_orders for select to authenticated
  using (public.is_organization_member(buyer_organization_id) or public.is_organization_member(seller_organization_id));

create policy "Grant participants can view access grants"
  on public.confidential_access_grants for select to authenticated
  using (public.is_organization_member(buyer_organization_id) or exists (
    select 1 from public.dossier_orders orders
    where orders.id = order_id and public.is_organization_member(orders.seller_organization_id)
  ));

create policy "Grant participants can view released material links"
  on public.confidential_access_grant_materials for select to authenticated
  using (exists (
    select 1 from public.confidential_access_grants grants
    join public.dossier_orders orders on orders.id = grants.order_id
    where grants.id = grant_id
      and (public.is_organization_member(grants.buyer_organization_id) or public.is_organization_member(orders.seller_organization_id))
  ));

create policy "Order participants can view access events"
  on public.dossier_access_events for select to authenticated
  using (exists (
    select 1 from public.dossier_orders orders
    where orders.id = order_id
      and (public.is_organization_member(orders.buyer_organization_id) or public.is_organization_member(orders.seller_organization_id))
  ));

create policy "Active grants reveal selected private materials"
  on public.coach_private_materials for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.confidential_access_grant_materials released
      join public.confidential_access_grants grants on grants.id = released.grant_id
      where released.material_id = coach_private_materials.id
        and grants.status = 'active'
        and grants.expires_at > now()
        and public.is_organization_member(grants.buyer_organization_id)
    )
  );

create or replace function public.submit_dossier_order(
  target_offer_id uuid,
  intended_use_text text,
  buyer_reference_text text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_offer public.dossier_offers%rowtype;
  access_request_uuid uuid;
  order_uuid uuid;
  club_name text;
begin
  select * into selected_offer
  from public.dossier_offers
  where id = target_offer_id
  for update;

  if selected_offer.id is null or selected_offer.status <> 'published' then
    raise exception 'This dossier offer is not available';
  end if;
  if selected_offer.available_until is not null and selected_offer.available_until <= now() then
    raise exception 'This dossier offer has expired';
  end if;
  if not public.is_organization_member(selected_offer.buyer_organization_id, array['owner', 'admin', 'club_owner', 'club_director']) then
    raise exception 'You cannot order for this club';
  end if;
  if nullif(trim(intended_use_text), '') is null then
    raise exception 'Intended use is required';
  end if;
  if not exists (
    select 1 from public.mandate_shortlist shortlist
    where shortlist.mandate_id = selected_offer.mandate_id
      and shortlist.coach_id = selected_offer.coach_id
  ) then
    raise exception 'Candidate is not available in this process';
  end if;

  select name into club_name from public.organizations where id = selected_offer.buyer_organization_id;

  insert into public.confidential_access_requests (
    user_id, mandate_id, coach_id, requested_by, requester_role, club_context, request_reason, status
  ) values (
    selected_offer.created_by,
    selected_offer.mandate_id,
    selected_offer.coach_id,
    'Club portal',
    'Club decision-maker',
    club_name,
    trim(intended_use_text),
    'requested'
  ) returning id into access_request_uuid;

  insert into public.dossier_orders (
    offer_id, seller_organization_id, buyer_organization_id, club_brief_id,
    mandate_id, coach_id, access_request_id, ordered_by, status, payment_status,
    price_amount, currency, intended_use, buyer_reference
  ) values (
    selected_offer.id, selected_offer.seller_organization_id, selected_offer.buyer_organization_id,
    selected_offer.club_brief_id, selected_offer.mandate_id, selected_offer.coach_id,
    access_request_uuid, (select auth.uid()), 'requested', 'invoice_requested',
    selected_offer.price_amount, selected_offer.currency, trim(intended_use_text), nullif(trim(buyer_reference_text), '')
  ) returning id into order_uuid;

  update public.dossier_offers set status = 'purchased', updated_at = now() where id = selected_offer.id;
  insert into public.dossier_access_events (order_id, actor_user_id, event_type)
  values (order_uuid, (select auth.uid()), 'order_submitted');

  return order_uuid;
end;
$$;

create or replace function public.approve_dossier_order(
  target_order_id uuid,
  material_ids uuid[],
  access_days integer default 30,
  permit_download boolean default false,
  release_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_order public.dossier_orders%rowtype;
  grant_uuid uuid;
begin
  select * into selected_order from public.dossier_orders where id = target_order_id for update;
  if selected_order.id is null then raise exception 'Order not found'; end if;
  if not public.is_organization_member(selected_order.seller_organization_id, array['owner', 'admin', 'analyst']) then
    raise exception 'You cannot approve this order';
  end if;
  if access_days < 1 or access_days > 365 then raise exception 'Access duration must be between 1 and 365 days'; end if;
  if coalesce(array_length(material_ids, 1), 0) = 0 then raise exception 'Select at least one material'; end if;
  if exists (
    select 1 from unnest(material_ids) material_id
    left join public.coach_private_materials materials on materials.id = material_id
    where materials.id is null
      or materials.coach_id <> selected_order.coach_id
      or materials.user_id <> (select auth.uid())
  ) then raise exception 'One or more materials cannot be released'; end if;

  update public.confidential_access_requests
  set status = 'shared', decided_at = now(), updated_at = now()
  where id = selected_order.access_request_id and user_id = (select auth.uid());
  if not found then raise exception 'The linked confidential request is not owned by this analyst'; end if;

  insert into public.confidential_access_grants (
    order_id, access_request_id, buyer_organization_id, coach_id, status,
    granted_by, expires_at, allow_download, watermark_label, release_notes
  ) values (
    selected_order.id, selected_order.access_request_id, selected_order.buyer_organization_id,
    selected_order.coach_id, 'active', (select auth.uid()), now() + make_interval(days => access_days),
    permit_download, 'Confidential - ' || (select name from public.organizations where id = selected_order.buyer_organization_id),
    nullif(trim(release_note), '')
  )
  on conflict (order_id) do update set
    status = 'active', granted_by = excluded.granted_by, granted_at = now(),
    expires_at = excluded.expires_at, allow_download = excluded.allow_download,
    watermark_label = excluded.watermark_label, release_notes = excluded.release_notes,
    revoked_at = null, updated_at = now()
  returning id into grant_uuid;

  delete from public.confidential_access_grant_materials where grant_id = grant_uuid;
  insert into public.confidential_access_grant_materials (grant_id, material_id, released_by)
  select grant_uuid, material_id, (select auth.uid()) from unnest(material_ids) material_id;

  update public.dossier_orders set
    status = 'active', payment_status = 'paid', approved_at = now(), activated_at = now(),
    expires_at = now() + make_interval(days => access_days), updated_at = now()
  where id = selected_order.id;

  insert into public.dossier_access_events (order_id, grant_id, actor_user_id, event_type, metadata)
  values (selected_order.id, grant_uuid, (select auth.uid()), 'order_approved', jsonb_build_object('material_count', array_length(material_ids, 1), 'access_days', access_days));
  insert into public.dossier_access_events (order_id, grant_id, actor_user_id, event_type)
  values (selected_order.id, grant_uuid, (select auth.uid()), 'access_activated');
  return grant_uuid;
end;
$$;

create or replace function public.revoke_dossier_access(target_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare selected_order public.dossier_orders%rowtype;
declare grant_uuid uuid;
begin
  select * into selected_order from public.dossier_orders where id = target_order_id for update;
  if selected_order.id is null then raise exception 'Order not found'; end if;
  if not public.is_organization_member(selected_order.seller_organization_id, array['owner', 'admin', 'analyst']) then
    raise exception 'You cannot revoke this order';
  end if;
  update public.confidential_access_grants
  set status = 'revoked', revoked_at = now(), updated_at = now()
  where order_id = selected_order.id returning id into grant_uuid;
  update public.dossier_orders set status = 'revoked', updated_at = now() where id = selected_order.id;
  insert into public.dossier_access_events (order_id, grant_id, actor_user_id, event_type)
  values (selected_order.id, grant_uuid, (select auth.uid()), 'access_revoked');
end;
$$;

revoke all on function public.submit_dossier_order(uuid, text, text) from public;
revoke all on function public.approve_dossier_order(uuid, uuid[], integer, boolean, text) from public;
revoke all on function public.revoke_dossier_access(uuid) from public;
revoke all on function public.submit_dossier_order(uuid, text, text) from anon;
revoke all on function public.approve_dossier_order(uuid, uuid[], integer, boolean, text) from anon;
revoke all on function public.revoke_dossier_access(uuid) from anon;
grant execute on function public.submit_dossier_order(uuid, text, text) to authenticated;
grant execute on function public.approve_dossier_order(uuid, uuid[], integer, boolean, text) to authenticated;
grant execute on function public.revoke_dossier_access(uuid) to authenticated;

grant select, insert, update on public.organizations to authenticated;
grant select, insert, update on public.organization_memberships to authenticated;
grant select, insert, update on public.club_briefs to authenticated;
grant select, insert, update, delete on public.dossier_offers to authenticated;
grant select on public.dossier_orders to authenticated;
grant select on public.confidential_access_grants to authenticated;
grant select on public.confidential_access_grant_materials to authenticated;
grant select on public.dossier_access_events to authenticated;
