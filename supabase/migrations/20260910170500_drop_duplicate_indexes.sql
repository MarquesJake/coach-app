-- Drop redundant duplicate indexes.
--
-- Each pair below indexes exactly the same columns with the same opclass and
-- predicate, so the second copy only costs write throughput and storage. In
-- every pair the surviving index is the one a migration declares; the dropped
-- one was created outside version control and has no migration defining it.

begin;

-- activity_log: keep activity_log_entity_idx (20260214_activity_log)
drop index if exists public.activity_entity_idx;

-- agent_club_relationships: keep the agent_club_rel_* names the migration declares
drop index if exists public.agent_club_relationships_user_id_idx;
drop index if exists public.agent_club_relationships_club_id_idx;
drop index if exists public.agent_club_relationships_agent_id_idx;

-- agents: keep agents_full_name_idx
drop index if exists public.agents_name_idx;

commit;
