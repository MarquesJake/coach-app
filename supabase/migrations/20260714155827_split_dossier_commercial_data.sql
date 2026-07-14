-- Keep club-visible workflow records free of Coach First commercial terms.
-- Buyer organisations can read dossier offers and orders through RLS, so
-- seller-only values must live in separate seller-restricted tables.

create table public.dossier_offer_commercials (
  offer_id uuid primary key references public.dossier_offers(id) on delete cascade,
  seller_organization_id uuid not null references public.organizations(id) on delete restrict,
  price_amount integer not null default 1500000 check (price_amount >= 0),
  currency text not null default 'GBP' check (currency ~ '^[A-Z]{3}$'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dossier_order_commercials (
  order_id uuid primary key references public.dossier_orders(id) on delete cascade,
  seller_organization_id uuid not null references public.organizations(id) on delete restrict,
  price_amount integer not null check (price_amount >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  payment_status text not null default 'invoice_requested'
    check (payment_status in ('invoice_requested', 'invoice_issued', 'paid', 'waived', 'refunded')),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.dossier_offer_commercials (
  offer_id,
  seller_organization_id,
  price_amount,
  currency,
  created_by,
  created_at,
  updated_at
)
select
  id,
  seller_organization_id,
  price_amount,
  currency,
  created_by,
  created_at,
  updated_at
from public.dossier_offers;

insert into public.dossier_order_commercials (
  order_id,
  seller_organization_id,
  price_amount,
  currency,
  payment_status,
  internal_notes,
  created_at,
  updated_at
)
select
  id,
  seller_organization_id,
  price_amount,
  currency,
  payment_status,
  internal_notes,
  ordered_at,
  updated_at
from public.dossier_orders;

create index dossier_offer_commercials_seller_idx
  on public.dossier_offer_commercials(seller_organization_id);
create index dossier_order_commercials_seller_idx
  on public.dossier_order_commercials(seller_organization_id, payment_status);

alter table public.dossier_offer_commercials enable row level security;
alter table public.dossier_order_commercials enable row level security;

create policy "Seller can view dossier offer commercials"
  on public.dossier_offer_commercials for select to authenticated
  using (
    public.is_organization_member(
      seller_organization_id,
      array['owner', 'admin', 'analyst']
    )
  );

create policy "Seller can create dossier offer commercials"
  on public.dossier_offer_commercials for insert to authenticated
  with check (
    public.is_organization_member(
      seller_organization_id,
      array['owner', 'admin', 'analyst']
    )
    and exists (
      select 1
      from public.dossier_offers offer
      where offer.id = offer_id
        and offer.seller_organization_id = dossier_offer_commercials.seller_organization_id
    )
  );

create policy "Seller can update dossier offer commercials"
  on public.dossier_offer_commercials for update to authenticated
  using (
    public.is_organization_member(
      seller_organization_id,
      array['owner', 'admin', 'analyst']
    )
  )
  with check (
    public.is_organization_member(
      seller_organization_id,
      array['owner', 'admin', 'analyst']
    )
    and exists (
      select 1
      from public.dossier_offers offer
      where offer.id = offer_id
        and offer.seller_organization_id = dossier_offer_commercials.seller_organization_id
    )
  );

create policy "Seller can view dossier order commercials"
  on public.dossier_order_commercials for select to authenticated
  using (
    public.is_organization_member(
      seller_organization_id,
      array['owner', 'admin', 'analyst']
    )
  );

revoke all on table public.dossier_offer_commercials from public, anon, authenticated;
revoke all on table public.dossier_order_commercials from public, anon, authenticated;
grant select, insert, update on table public.dossier_offer_commercials to authenticated;
grant select on table public.dossier_order_commercials to authenticated;

drop policy "Offer participants can view dossier offers" on public.dossier_offers;

create policy "Buyer can view published dossier offers"
  on public.dossier_offers for select to authenticated
  using (
    status in ('published', 'purchased')
    and public.is_organization_member(buyer_organization_id)
  );

-- The transition RPC omits legacy commercial fields. Defaults keep the old
-- table shape valid until the compatibility trigger mirrors the true values.
alter table public.dossier_orders
  alter column price_amount set default 1500000,
  alter column currency set default 'GBP';

-- Compatibility bridge for the currently deployed publisher. It still writes
-- offer commercial values to the legacy columns until the new app is live.
create or replace function public.sync_dossier_offer_commercial_from_legacy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.dossier_offer_commercials (
    offer_id,
    seller_organization_id,
    price_amount,
    currency,
    created_by,
    updated_at
  ) values (
    new.id,
    new.seller_organization_id,
    new.price_amount,
    new.currency,
    new.created_by,
    now()
  )
  on conflict (offer_id) do update set
    seller_organization_id = excluded.seller_organization_id,
    price_amount = excluded.price_amount,
    currency = excluded.currency,
    updated_at = now();

  return new;
end;
$$;

revoke all on function public.sync_dossier_offer_commercial_from_legacy()
  from public, anon, authenticated;

create trigger sync_dossier_offer_commercial_from_legacy
after insert or update of price_amount, currency on public.dossier_offers
for each row execute function public.sync_dossier_offer_commercial_from_legacy();

-- The rewritten RPCs use the seller-only order record immediately. Mirror it
-- back to legacy columns only while the old analyst page is still deployed.
create or replace function public.sync_dossier_order_commercial_to_legacy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.dossier_orders
  set
    price_amount = new.price_amount,
    currency = new.currency,
    payment_status = new.payment_status,
    internal_notes = new.internal_notes,
    updated_at = now()
  where id = new.order_id;

  return new;
end;
$$;

revoke all on function public.sync_dossier_order_commercial_to_legacy()
  from public, anon, authenticated;

create trigger sync_dossier_order_commercial_to_legacy
after insert or update of price_amount, currency, payment_status, internal_notes
on public.dossier_order_commercials
for each row execute function public.sync_dossier_order_commercial_to_legacy();

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
  selected_commercial public.dossier_offer_commercials%rowtype;
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
  if not public.is_organization_member(
    selected_offer.buyer_organization_id,
    array['owner', 'admin', 'club_owner', 'club_director']
  ) then
    raise exception 'You cannot request this dossier for this club';
  end if;
  if nullif(trim(intended_use_text), '') is null then
    raise exception 'Intended use is required';
  end if;
  if not exists (
    select 1
    from public.mandate_shortlist shortlist
    where shortlist.mandate_id = selected_offer.mandate_id
      and shortlist.coach_id = selected_offer.coach_id
  ) then
    raise exception 'Candidate is not available in this process';
  end if;

  select * into selected_commercial
  from public.dossier_offer_commercials
  where offer_id = selected_offer.id;

  if selected_commercial.offer_id is null then
    raise exception 'This dossier offer cannot currently be requested';
  end if;

  select name into club_name
  from public.organizations
  where id = selected_offer.buyer_organization_id;

  insert into public.confidential_access_requests (
    user_id,
    mandate_id,
    coach_id,
    requested_by,
    requester_role,
    club_context,
    request_reason,
    status
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
    offer_id,
    seller_organization_id,
    buyer_organization_id,
    club_brief_id,
    mandate_id,
    coach_id,
    access_request_id,
    ordered_by,
    status,
    intended_use,
    buyer_reference
  ) values (
    selected_offer.id,
    selected_offer.seller_organization_id,
    selected_offer.buyer_organization_id,
    selected_offer.club_brief_id,
    selected_offer.mandate_id,
    selected_offer.coach_id,
    access_request_uuid,
    (select auth.uid()),
    'requested',
    trim(intended_use_text),
    nullif(trim(buyer_reference_text), '')
  ) returning id into order_uuid;

  insert into public.dossier_order_commercials (
    order_id,
    seller_organization_id,
    price_amount,
    currency,
    payment_status
  ) values (
    order_uuid,
    selected_offer.seller_organization_id,
    selected_commercial.price_amount,
    selected_commercial.currency,
    'invoice_requested'
  );

  update public.dossier_offers
  set status = 'purchased', updated_at = now()
  where id = selected_offer.id;

  insert into public.dossier_access_events (
    order_id,
    actor_user_id,
    event_type
  ) values (
    order_uuid,
    (select auth.uid()),
    'order_submitted'
  );

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
  select * into selected_order
  from public.dossier_orders
  where id = target_order_id
  for update;

  if selected_order.id is null then
    raise exception 'Order not found';
  end if;
  if not public.is_organization_member(
    selected_order.seller_organization_id,
    array['owner', 'admin', 'analyst']
  ) then
    raise exception 'You cannot approve this order';
  end if;
  if access_days < 1 or access_days > 365 then
    raise exception 'Access duration must be between 1 and 365 days';
  end if;
  if coalesce(array_length(material_ids, 1), 0) = 0 then
    raise exception 'Select at least one material';
  end if;
  if exists (
    select 1
    from unnest(material_ids) material_id
    left join public.coach_private_materials materials on materials.id = material_id
    where materials.id is null
      or materials.coach_id <> selected_order.coach_id
      or materials.user_id <> (select auth.uid())
  ) then
    raise exception 'One or more materials cannot be released';
  end if;

  update public.confidential_access_requests
  set status = 'shared', decided_at = now(), updated_at = now()
  where id = selected_order.access_request_id
    and user_id = (select auth.uid());

  if not found then
    raise exception 'The linked confidential request is not owned by this analyst';
  end if;

  insert into public.confidential_access_grants (
    order_id,
    access_request_id,
    buyer_organization_id,
    coach_id,
    status,
    granted_by,
    expires_at,
    allow_download,
    watermark_label,
    release_notes
  ) values (
    selected_order.id,
    selected_order.access_request_id,
    selected_order.buyer_organization_id,
    selected_order.coach_id,
    'active',
    (select auth.uid()),
    now() + make_interval(days => access_days),
    permit_download,
    'Confidential - ' || (
      select name
      from public.organizations
      where id = selected_order.buyer_organization_id
    ),
    nullif(trim(release_note), '')
  )
  on conflict (order_id) do update set
    status = 'active',
    granted_by = excluded.granted_by,
    granted_at = now(),
    expires_at = excluded.expires_at,
    allow_download = excluded.allow_download,
    watermark_label = excluded.watermark_label,
    release_notes = excluded.release_notes,
    revoked_at = null,
    updated_at = now()
  returning id into grant_uuid;

  delete from public.confidential_access_grant_materials
  where grant_id = grant_uuid;

  insert into public.confidential_access_grant_materials (
    grant_id,
    material_id,
    released_by
  )
  select grant_uuid, material_id, (select auth.uid())
  from unnest(material_ids) material_id;

  update public.dossier_orders
  set
    status = 'active',
    approved_at = now(),
    activated_at = now(),
    expires_at = now() + make_interval(days => access_days),
    updated_at = now()
  where id = selected_order.id;

  update public.dossier_order_commercials
  set payment_status = 'paid', updated_at = now()
  where order_id = selected_order.id;

  if not found then
    raise exception 'Commercial record is missing for this order';
  end if;

  insert into public.dossier_access_events (
    order_id,
    grant_id,
    actor_user_id,
    event_type,
    metadata
  ) values (
    selected_order.id,
    grant_uuid,
    (select auth.uid()),
    'order_approved',
    jsonb_build_object(
      'material_count',
      array_length(material_ids, 1),
      'access_days',
      access_days
    )
  );

  insert into public.dossier_access_events (
    order_id,
    grant_id,
    actor_user_id,
    event_type
  ) values (
    selected_order.id,
    grant_uuid,
    (select auth.uid()),
    'access_activated'
  );

  return grant_uuid;
end;
$$;

revoke all on function public.submit_dossier_order(uuid, text, text) from public, anon;
revoke all on function public.approve_dossier_order(uuid, uuid[], integer, boolean, text) from public, anon;
grant execute on function public.submit_dossier_order(uuid, text, text) to authenticated;
grant execute on function public.approve_dossier_order(uuid, uuid[], integer, boolean, text) to authenticated;

notify pgrst, 'reload schema';
