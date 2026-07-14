-- Supabase grants function execution to API roles through default privileges.
-- These definer functions are intentionally authenticated-only and validate
-- membership again inside every transition.
revoke all on function public.is_organization_member(uuid, text[]) from anon;
revoke all on function public.submit_dossier_order(uuid, text, text) from anon;
revoke all on function public.approve_dossier_order(uuid, uuid[], integer, boolean, text) from anon;
revoke all on function public.revoke_dossier_access(uuid) from anon;
