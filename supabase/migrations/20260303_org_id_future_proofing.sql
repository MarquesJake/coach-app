-- Phase 2: Schema future proofing for multi-tenant support.
-- Add nullable org_id to key tables. user_id logic unchanged. No RLS changes.
-- TODO (app): Future: migrate filtering from user_id to org_id for multi-tenant support.

ALTER TABLE coaches ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE mandates ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE intelligence_items ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE mandate_longlist ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE mandate_shortlist ADD COLUMN IF NOT EXISTS org_id uuid;

COMMENT ON COLUMN coaches.org_id IS 'Future: migrate filtering from user_id to org_id for multi-tenant support.';
COMMENT ON COLUMN clubs.org_id IS 'Future: migrate filtering from user_id to org_id for multi-tenant support.';
COMMENT ON COLUMN staff.org_id IS 'Future: migrate filtering from user_id to org_id for multi-tenant support.';
COMMENT ON COLUMN mandates.org_id IS 'Future: migrate filtering from user_id to org_id for multi-tenant support.';
COMMENT ON COLUMN intelligence_items.org_id IS 'Future: migrate filtering from user_id to org_id for multi-tenant support.';
COMMENT ON COLUMN mandate_longlist.org_id IS 'Future: migrate filtering from user_id to org_id for multi-tenant support.';
COMMENT ON COLUMN mandate_shortlist.org_id IS 'Future: migrate filtering from user_id to org_id for multi-tenant support.';
