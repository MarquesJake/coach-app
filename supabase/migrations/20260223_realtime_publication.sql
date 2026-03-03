-- Enable Supabase Realtime for mandate stage changes, shortlist, and activity log.
-- Only add tables if not already in the publication (safe to run multiple times).
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mandates') then
    alter publication supabase_realtime add table public.mandates;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mandate_shortlist') then
    alter publication supabase_realtime add table public.mandate_shortlist;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'activity_log') then
    alter publication supabase_realtime add table public.activity_log;
  end if;
end
$$;
