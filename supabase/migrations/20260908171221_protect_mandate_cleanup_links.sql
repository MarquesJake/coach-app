-- Preserve external brief and confidential access history, including concurrent linking.
-- Existing dossier offer/order foreign keys already use ON DELETE RESTRICT.
-- Internal mandate shortlist and assessment records keep their existing cascades.
begin;
alter table public.club_briefs drop constraint club_briefs_linked_mandate_id_fkey;
alter table public.club_briefs add constraint club_briefs_linked_mandate_id_fkey
  foreign key (linked_mandate_id) references public.mandates(id) on delete restrict;
alter table public.confidential_access_requests drop constraint confidential_access_requests_mandate_id_fkey;
alter table public.confidential_access_requests add constraint confidential_access_requests_mandate_id_fkey
  foreign key (mandate_id) references public.mandates(id) on delete restrict;
commit;
