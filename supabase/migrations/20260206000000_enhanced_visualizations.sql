-- =============================================
-- Lead-to-Quote Engine v2 - Enhanced Visualizations
-- Migration: 20260206000000_enhanced_visualizations.sql
-- Purpose: Add conversation context, photo analysis, and admin fields
-- =============================================

-- =============================================
-- ENHANCED COLUMNS FOR VISUALIZATIONS TABLE
-- =============================================

-- Add conversation context (stores the full conversation state)
ALTER TABLE visualizations
  ADD COLUMN IF NOT EXISTS conversation_context JSONB;

COMMENT ON COLUMN visualizations.conversation_context IS
  'Full conversation context from conversation mode including extracted design intent';

-- Add photo analysis (GPT Vision analysis results)
ALTER TABLE visualizations
  ADD COLUMN IF NOT EXISTS photo_analysis JSONB;

COMMENT ON COLUMN visualizations.photo_analysis IS
  'Room analysis from GPT Vision including structural elements, lighting, perspective';

-- Add the prompt used for generation (for debugging and improvement)
ALTER TABLE visualizations
  ADD COLUMN IF NOT EXISTS prompt_used TEXT;

COMMENT ON COLUMN visualizations.prompt_used IS
  'The actual prompt sent to the image generation model';

-- Admin notes for contractor review
ALTER TABLE visualizations
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

COMMENT ON COLUMN visualizations.admin_notes IS
  'Internal notes from admin/contractor review';

-- Selected concept index (which concept did admin/user prefer)
ALTER TABLE visualizations
  ADD COLUMN IF NOT EXISTS selected_concept_index INTEGER;

COMMENT ON COLUMN visualizations.selected_concept_index IS
  '0-based index of the preferred concept (0-3)';

-- Contractor feasibility score (1-5)
ALTER TABLE visualizations
  ADD COLUMN IF NOT EXISTS contractor_feasibility_score INTEGER
    CHECK (contractor_feasibility_score IS NULL OR (contractor_feasibility_score >= 1 AND contractor_feasibility_score <= 5));

COMMENT ON COLUMN visualizations.contractor_feasibility_score IS
  'Contractor assessment of how feasible the visualization is (1-5)';

-- Estimated cost impact (text description)
ALTER TABLE visualizations
  ADD COLUMN IF NOT EXISTS estimated_cost_impact TEXT;

COMMENT ON COLUMN visualizations.estimated_cost_impact IS
  'Estimated cost impact description (e.g., "High - requires structural changes")';

-- Technical concerns array
ALTER TABLE visualizations
  ADD COLUMN IF NOT EXISTS technical_concerns TEXT[];

COMMENT ON COLUMN visualizations.technical_concerns IS
  'Array of technical concerns identified by contractor';

-- =============================================
-- LEAD-VISUALIZATION JUNCTION TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS lead_visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  visualization_id UUID NOT NULL REFERENCES visualizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Is this the primary/featured visualization for this lead?
  is_primary BOOLEAN DEFAULT false,

  -- Was this selected by admin for the quote?
  admin_selected BOOLEAN DEFAULT false,

  -- Ordering for display
  display_order INTEGER DEFAULT 0,

  -- Notes specific to this lead-visualization relationship
  relationship_notes TEXT,

  UNIQUE(lead_id, visualization_id)
);

COMMENT ON TABLE lead_visualizations IS
  'Junction table linking leads to their visualizations with metadata';

-- =============================================
-- ROW LEVEL SECURITY FOR JUNCTION TABLE
-- =============================================

ALTER TABLE lead_visualizations ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access" ON lead_visualizations
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Service role bypass
CREATE POLICY "Service role bypass" ON lead_visualizations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- INDEXES
-- =============================================

-- Index for looking up visualizations by lead
CREATE INDEX IF NOT EXISTS idx_lead_visualizations_lead_id
  ON lead_visualizations(lead_id);

-- Index for looking up leads by visualization
CREATE INDEX IF NOT EXISTS idx_lead_visualizations_visualization_id
  ON lead_visualizations(visualization_id);

-- Index for primary visualizations
CREATE INDEX IF NOT EXISTS idx_lead_visualizations_primary
  ON lead_visualizations(lead_id) WHERE is_primary = true;

-- Index for admin-selected visualizations
CREATE INDEX IF NOT EXISTS idx_lead_visualizations_admin_selected
  ON lead_visualizations(lead_id) WHERE admin_selected = true;

-- Index on visualizations for conversation mode tracking
CREATE INDEX IF NOT EXISTS idx_visualizations_source_conversation
  ON visualizations(source) WHERE source = 'visualizer_conversation';

-- =============================================
-- HELPER FUNCTION: Link visualization to lead
-- =============================================

CREATE OR REPLACE FUNCTION link_visualization_to_lead(
  p_lead_id UUID,
  p_visualization_id UUID,
  p_is_primary BOOLEAN DEFAULT false,
  p_admin_selected BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_link_id UUID;
BEGIN
  -- If this should be primary, unset any existing primary first
  IF p_is_primary THEN
    UPDATE lead_visualizations
    SET is_primary = false
    WHERE lead_id = p_lead_id AND is_primary = true;
  END IF;

  -- Insert or update the link
  INSERT INTO lead_visualizations (lead_id, visualization_id, is_primary, admin_selected)
  VALUES (p_lead_id, p_visualization_id, p_is_primary, p_admin_selected)
  ON CONFLICT (lead_id, visualization_id)
  DO UPDATE SET
    is_primary = EXCLUDED.is_primary,
    admin_selected = EXCLUDED.admin_selected
  RETURNING id INTO v_link_id;

  RETURN v_link_id;
END;
$$;

-- =============================================
-- HELPER FUNCTION: Get visualizations for lead
-- =============================================

CREATE OR REPLACE FUNCTION get_lead_visualizations(p_lead_id UUID)
RETURNS TABLE (
  visualization_id UUID,
  is_primary BOOLEAN,
  admin_selected BOOLEAN,
  original_photo_url TEXT,
  room_type TEXT,
  style TEXT,
  generated_concepts JSONB,
  generation_time_ms INTEGER,
  photo_analysis JSONB,
  admin_notes TEXT,
  contractor_feasibility_score INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    v.id as visualization_id,
    lv.is_primary,
    lv.admin_selected,
    v.original_photo_url,
    v.room_type,
    v.style,
    v.generated_concepts,
    v.generation_time_ms,
    v.photo_analysis,
    v.admin_notes,
    v.contractor_feasibility_score,
    v.created_at
  FROM lead_visualizations lv
  JOIN visualizations v ON v.id = lv.visualization_id
  WHERE lv.lead_id = p_lead_id
  ORDER BY lv.is_primary DESC, lv.admin_selected DESC, v.created_at DESC;
$$;

-- =============================================
-- UPDATE TRIGGERS
-- =============================================

-- Ensure updated_at is maintained on lead_visualizations
CREATE OR REPLACE FUNCTION update_lead_visualization_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.created_at = COALESCE(OLD.created_at, NOW());
  RETURN NEW;
END;
$$;

-- Note: We don't add updated_at to junction table, but we could if needed
