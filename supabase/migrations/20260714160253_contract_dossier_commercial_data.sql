-- Remove the compatibility bridge after the application has switched to the
-- seller-only commercial tables. Club-readable records then contain no
-- commercial or internal-note columns at all.

drop trigger sync_dossier_offer_commercial_from_legacy
  on public.dossier_offers;
drop function public.sync_dossier_offer_commercial_from_legacy();

drop trigger sync_dossier_order_commercial_to_legacy
  on public.dossier_order_commercials;
drop function public.sync_dossier_order_commercial_to_legacy();

alter table public.dossier_offers
  drop column price_amount,
  drop column currency;

alter table public.dossier_orders
  drop column payment_status,
  drop column price_amount,
  drop column currency,
  drop column internal_notes;

notify pgrst, 'reload schema';
