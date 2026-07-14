-- Security hardening: the demo/admin data-tools helpers are SECURITY DEFINER and
-- were callable by the anonymous PostgREST role via /rest/v1/rpc/*. They are only
-- ever invoked from the internal analyst admin data-tools pages by an authenticated
-- analyst, so anonymous execution is never legitimate.
--
-- Functions grant EXECUTE to PUBLIC by default, so revoking from anon alone is a
-- no-op — we must revoke from PUBLIC and re-grant only to authenticated.
-- (Flagged by Supabase security advisor lint 0028.)
revoke all on function public.claim_unowned_rows() from public, anon;
revoke all on function public.get_unowned_counts() from public, anon;
grant execute on function public.claim_unowned_rows() to authenticated;
grant execute on function public.get_unowned_counts() to authenticated;
