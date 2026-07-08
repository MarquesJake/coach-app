-- Add the missing commercial-deal context that makes a Head Coach Assessment
-- Pack valuable beyond public data: expiry, compensation/release path, and
-- internal notes about how achievable the appointment is.

alter table public.coaches
  add column if not exists contract_expiry date,
  add column if not exists release_clause text,
  add column if not exists contract_notes text;
