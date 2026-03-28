-- Intelligence layer: extend intelligence_items + agent_interactions

-- 1. Extend intelligence_items with direction, sensitivity, mandate_id, is_deleted
ALTER TABLE intelligence_items
  ADD COLUMN IF NOT EXISTS direction text CHECK (direction IN ('Positive', 'Negative', 'Neutral')),
  ADD COLUMN IF NOT EXISTS sensitivity text NOT NULL DEFAULT 'Standard' CHECK (sensitivity IN ('High', 'Standard')),
  ADD COLUMN IF NOT EXISTS mandate_id uuid REFERENCES mandates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- Index for soft-delete filter
CREATE INDEX IF NOT EXISTS intelligence_items_not_deleted ON intelligence_items (user_id, entity_type, entity_id) WHERE is_deleted = false;

-- Index for mandate-linked intel
CREATE INDEX IF NOT EXISTS intelligence_items_mandate ON intelligence_items (mandate_id) WHERE mandate_id IS NOT NULL;

-- 2. Extend agent_interactions with interaction_type, reliability_score, influence_score,
--    follow_up_date, coach_id (nullable FK), club_id (nullable FK)
ALTER TABLE agent_interactions
  ADD COLUMN IF NOT EXISTS interaction_type text CHECK (interaction_type IN ('Call', 'Meeting', 'Message', 'Email', 'Other')),
  ADD COLUMN IF NOT EXISTS reliability_score integer CHECK (reliability_score >= 0 AND reliability_score <= 100),
  ADD COLUMN IF NOT EXISTS influence_score integer CHECK (influence_score >= 0 AND influence_score <= 100),
  ADD COLUMN IF NOT EXISTS follow_up_date date,
  ADD COLUMN IF NOT EXISTS coach_id uuid REFERENCES coaches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES clubs(id) ON DELETE SET NULL;

-- Index for coach-linked agent interactions
CREATE INDEX IF NOT EXISTS agent_interactions_coach ON agent_interactions (coach_id) WHERE coach_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS agent_interactions_club ON agent_interactions (club_id) WHERE club_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS agent_interactions_follow_up ON agent_interactions (follow_up_date) WHERE follow_up_date IS NOT NULL;
