-- =============================================
-- Lead-to-Quote Engine v2 - Visualization Metrics
-- Migration: 20260207000000_visualization_metrics.sql
-- Purpose: Track metrics for visualization performance and quality
-- =============================================

-- =============================================
-- VISUALIZATION METRICS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS visualization_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Link to visualization
  visualization_id UUID REFERENCES visualizations(id) ON DELETE CASCADE,

  -- Generation metrics
  generation_time_ms INTEGER NOT NULL,
  retry_count INTEGER DEFAULT 0,
  concepts_requested INTEGER DEFAULT 4,
  concepts_generated INTEGER NOT NULL,

  -- Quality metrics
  structure_validation_score NUMERIC(3,2),
  photorealism_score NUMERIC(3,2),
  validation_passed BOOLEAN,

  -- Mode tracking
  mode TEXT CHECK (mode IN ('quick', 'conversation')) DEFAULT 'quick',
  photo_analyzed BOOLEAN DEFAULT false,
  conversation_turns INTEGER DEFAULT 0,

  -- Cost tracking
  estimated_cost_usd NUMERIC(6,4),
  analysis_cost_usd NUMERIC(6,4),
  generation_cost_usd NUMERIC(6,4),
  validation_cost_usd NUMERIC(6,4),

  -- Outcome tracking
  proceeded_to_quote BOOLEAN DEFAULT false,
  admin_selected BOOLEAN DEFAULT false,
  user_downloaded BOOLEAN DEFAULT false,
  user_shared BOOLEAN DEFAULT false,

  -- Error tracking
  error_occurred BOOLEAN DEFAULT false,
  error_code TEXT,
  error_message TEXT
);

COMMENT ON TABLE visualization_metrics IS
  'Tracks performance, quality, and cost metrics for each visualization';

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE visualization_metrics ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access" ON visualization_metrics
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Service role bypass
CREATE POLICY "Service role bypass" ON visualization_metrics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_visualization_metrics_visualization_id
  ON visualization_metrics(visualization_id);

CREATE INDEX IF NOT EXISTS idx_visualization_metrics_created_at
  ON visualization_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_visualization_metrics_mode
  ON visualization_metrics(mode);

-- =============================================
-- AGGREGATION VIEWS
-- =============================================

-- Daily metrics summary
CREATE OR REPLACE VIEW visualization_metrics_daily AS
SELECT
  DATE_TRUNC('day', created_at) AS date,
  COUNT(*) AS total_visualizations,
  AVG(generation_time_ms) AS avg_generation_time_ms,
  AVG(concepts_generated::float / NULLIF(concepts_requested, 0)) AS avg_success_rate,
  AVG(retry_count) AS avg_retry_count,
  SUM(retry_count) AS total_retries,
  AVG(structure_validation_score) AS avg_validation_score,
  COUNT(*) FILTER (WHERE mode = 'conversation') AS conversation_mode_count,
  COUNT(*) FILTER (WHERE mode = 'quick') AS quick_mode_count,
  COUNT(*) FILTER (WHERE proceeded_to_quote) AS proceeded_to_quote,
  COUNT(*) FILTER (WHERE admin_selected) AS admin_selected,
  SUM(estimated_cost_usd) AS total_cost_usd
FROM visualization_metrics
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Hourly metrics for recent monitoring
CREATE OR REPLACE VIEW visualization_metrics_hourly AS
SELECT
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(*) AS total_visualizations,
  AVG(generation_time_ms) AS avg_generation_time_ms,
  COUNT(*) FILTER (WHERE error_occurred) AS error_count,
  SUM(estimated_cost_usd) AS cost_usd
FROM visualization_metrics
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Record metrics for a visualization
CREATE OR REPLACE FUNCTION record_visualization_metrics(
  p_visualization_id UUID,
  p_generation_time_ms INTEGER,
  p_retry_count INTEGER DEFAULT 0,
  p_concepts_requested INTEGER DEFAULT 4,
  p_concepts_generated INTEGER DEFAULT 4,
  p_structure_validation_score NUMERIC DEFAULT NULL,
  p_mode TEXT DEFAULT 'quick',
  p_photo_analyzed BOOLEAN DEFAULT false,
  p_conversation_turns INTEGER DEFAULT 0,
  p_estimated_cost_usd NUMERIC DEFAULT NULL,
  p_error_occurred BOOLEAN DEFAULT false,
  p_error_code TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_metrics_id UUID;
BEGIN
  INSERT INTO visualization_metrics (
    visualization_id,
    generation_time_ms,
    retry_count,
    concepts_requested,
    concepts_generated,
    structure_validation_score,
    validation_passed,
    mode,
    photo_analyzed,
    conversation_turns,
    estimated_cost_usd,
    error_occurred,
    error_code,
    error_message
  ) VALUES (
    p_visualization_id,
    p_generation_time_ms,
    p_retry_count,
    p_concepts_requested,
    p_concepts_generated,
    p_structure_validation_score,
    COALESCE(p_structure_validation_score >= 0.7, true),
    p_mode,
    p_photo_analyzed,
    p_conversation_turns,
    p_estimated_cost_usd,
    p_error_occurred,
    p_error_code,
    p_error_message
  )
  RETURNING id INTO v_metrics_id;

  RETURN v_metrics_id;
END;
$$;

-- Update outcome metrics
CREATE OR REPLACE FUNCTION update_visualization_outcome(
  p_visualization_id UUID,
  p_proceeded_to_quote BOOLEAN DEFAULT NULL,
  p_admin_selected BOOLEAN DEFAULT NULL,
  p_user_downloaded BOOLEAN DEFAULT NULL,
  p_user_shared BOOLEAN DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE visualization_metrics
  SET
    proceeded_to_quote = COALESCE(p_proceeded_to_quote, proceeded_to_quote),
    admin_selected = COALESCE(p_admin_selected, admin_selected),
    user_downloaded = COALESCE(p_user_downloaded, user_downloaded),
    user_shared = COALESCE(p_user_shared, user_shared)
  WHERE visualization_id = p_visualization_id;
END;
$$;

-- Get summary metrics for dashboard
CREATE OR REPLACE FUNCTION get_visualization_summary(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_visualizations BIGINT,
  avg_generation_time_ms NUMERIC,
  avg_validation_score NUMERIC,
  retry_rate NUMERIC,
  quote_conversion_rate NUMERIC,
  admin_selection_rate NUMERIC,
  conversation_mode_rate NUMERIC,
  total_cost_usd NUMERIC,
  avg_cost_per_visualization NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COUNT(*) AS total_visualizations,
    ROUND(AVG(generation_time_ms), 0) AS avg_generation_time_ms,
    ROUND(AVG(structure_validation_score), 2) AS avg_validation_score,
    ROUND(AVG(retry_count), 2) AS retry_rate,
    ROUND(
      COUNT(*) FILTER (WHERE proceeded_to_quote)::NUMERIC /
      NULLIF(COUNT(*), 0) * 100, 1
    ) AS quote_conversion_rate,
    ROUND(
      COUNT(*) FILTER (WHERE admin_selected)::NUMERIC /
      NULLIF(COUNT(*), 0) * 100, 1
    ) AS admin_selection_rate,
    ROUND(
      COUNT(*) FILTER (WHERE mode = 'conversation')::NUMERIC /
      NULLIF(COUNT(*), 0) * 100, 1
    ) AS conversation_mode_rate,
    ROUND(SUM(estimated_cost_usd), 2) AS total_cost_usd,
    ROUND(AVG(estimated_cost_usd), 4) AS avg_cost_per_visualization
  FROM visualization_metrics
  WHERE created_at > NOW() - (p_days || ' days')::INTERVAL;
$$;
