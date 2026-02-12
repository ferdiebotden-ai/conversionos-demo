-- =============================================
-- Lead-to-Quote Engine v2 - Multi-Tenancy: site_id
-- Migration: 20260210000000_add_site_id_multi_tenancy.sql
-- Purpose: Add site_id column to all tables for multi-site data isolation
-- =============================================

-- =============================================
-- STEP 1: Add site_id column to all 12 tables (with temporary default)
-- =============================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS site_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE quote_drafts ADD COLUMN IF NOT EXISTS site_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS site_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS site_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE visualizations ADD COLUMN IF NOT EXISTS site_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS site_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS site_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS site_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE drawings ADD COLUMN IF NOT EXISTS site_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE lead_visualizations ADD COLUMN IF NOT EXISTS site_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE visualization_metrics ADD COLUMN IF NOT EXISTS site_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE invoice_sequences ADD COLUMN IF NOT EXISTS site_id TEXT NOT NULL DEFAULT 'default';

-- =============================================
-- STEP 2: Drop defaults (force explicit site_id from app)
-- =============================================

ALTER TABLE leads ALTER COLUMN site_id DROP DEFAULT;
ALTER TABLE quote_drafts ALTER COLUMN site_id DROP DEFAULT;
ALTER TABLE audit_log ALTER COLUMN site_id DROP DEFAULT;
ALTER TABLE chat_sessions ALTER COLUMN site_id DROP DEFAULT;
ALTER TABLE visualizations ALTER COLUMN site_id DROP DEFAULT;
ALTER TABLE admin_settings ALTER COLUMN site_id DROP DEFAULT;
ALTER TABLE invoices ALTER COLUMN site_id DROP DEFAULT;
ALTER TABLE payments ALTER COLUMN site_id DROP DEFAULT;
ALTER TABLE drawings ALTER COLUMN site_id DROP DEFAULT;
ALTER TABLE lead_visualizations ALTER COLUMN site_id DROP DEFAULT;
ALTER TABLE visualization_metrics ALTER COLUMN site_id DROP DEFAULT;
ALTER TABLE invoice_sequences ALTER COLUMN site_id DROP DEFAULT;

-- =============================================
-- STEP 3: Update unique constraints
-- =============================================

-- admin_settings: UNIQUE(key) → UNIQUE(site_id, key)
ALTER TABLE admin_settings DROP CONSTRAINT IF EXISTS admin_settings_key_key;
DO $$ BEGIN
  ALTER TABLE admin_settings ADD CONSTRAINT admin_settings_site_id_key_key UNIQUE (site_id, key);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- invoices: UNIQUE(invoice_number) → UNIQUE(site_id, invoice_number)
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;
DO $$ BEGIN
  ALTER TABLE invoices ADD CONSTRAINT invoices_site_id_invoice_number_key UNIQUE (site_id, invoice_number);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- lead_visualizations: UNIQUE(lead_id, visualization_id) → UNIQUE(site_id, lead_id, visualization_id)
ALTER TABLE lead_visualizations DROP CONSTRAINT IF EXISTS lead_visualizations_lead_id_visualization_id_key;
DO $$ BEGIN
  ALTER TABLE lead_visualizations ADD CONSTRAINT lead_visualizations_site_id_lead_id_visualization_id_key UNIQUE (site_id, lead_id, visualization_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- invoice_sequences: PK(year) → PK(site_id, year)
ALTER TABLE invoice_sequences DROP CONSTRAINT IF EXISTS invoice_sequences_pkey;
DO $$ BEGIN
  ALTER TABLE invoice_sequences ADD CONSTRAINT invoice_sequences_pkey PRIMARY KEY (site_id, year);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- =============================================
-- STEP 4: Add site_id indexes (one per table)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_leads_site_id ON leads(site_id);
CREATE INDEX IF NOT EXISTS idx_quote_drafts_site_id ON quote_drafts(site_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_site_id ON audit_log(site_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_site_id ON chat_sessions(site_id);
CREATE INDEX IF NOT EXISTS idx_visualizations_site_id ON visualizations(site_id);
CREATE INDEX IF NOT EXISTS idx_admin_settings_site_id ON admin_settings(site_id);
CREATE INDEX IF NOT EXISTS idx_invoices_site_id ON invoices(site_id);
CREATE INDEX IF NOT EXISTS idx_payments_site_id ON payments(site_id);
CREATE INDEX IF NOT EXISTS idx_drawings_site_id ON drawings(site_id);
CREATE INDEX IF NOT EXISTS idx_lead_visualizations_site_id ON lead_visualizations(site_id);
CREATE INDEX IF NOT EXISTS idx_visualization_metrics_site_id ON visualization_metrics(site_id);
CREATE INDEX IF NOT EXISTS idx_invoice_sequences_site_id ON invoice_sequences(site_id);

-- =============================================
-- STEP 5: Update database functions
-- =============================================

-- next_invoice_number: add p_site_id parameter
CREATE OR REPLACE FUNCTION next_invoice_number(p_site_id TEXT)
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  next_num INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::INTEGER;

  INSERT INTO invoice_sequences (site_id, year, last_number)
  VALUES (p_site_id, current_year, 1)
  ON CONFLICT (site_id, year) DO UPDATE
    SET last_number = invoice_sequences.last_number + 1
  RETURNING last_number INTO next_num;

  RETURN 'INV-' || current_year || '-' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Drop the old zero-argument version
DROP FUNCTION IF EXISTS next_invoice_number();

-- record_visualization_metrics: add p_site_id parameter
CREATE OR REPLACE FUNCTION record_visualization_metrics(
  p_site_id TEXT,
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
    site_id,
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
    p_site_id,
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

-- get_visualization_summary: add p_site_id parameter
CREATE OR REPLACE FUNCTION get_visualization_summary(
  p_site_id TEXT,
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
  WHERE site_id = p_site_id
    AND created_at > NOW() - (p_days || ' days')::INTERVAL;
$$;

-- Drop old versions of functions with different signatures
DROP FUNCTION IF EXISTS get_visualization_summary(INTEGER);

-- link_visualization_to_lead: add p_site_id parameter
CREATE OR REPLACE FUNCTION link_visualization_to_lead(
  p_site_id TEXT,
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
    WHERE site_id = p_site_id AND lead_id = p_lead_id AND is_primary = true;
  END IF;

  -- Insert or update the link
  INSERT INTO lead_visualizations (site_id, lead_id, visualization_id, is_primary, admin_selected)
  VALUES (p_site_id, p_lead_id, p_visualization_id, p_is_primary, p_admin_selected)
  ON CONFLICT (site_id, lead_id, visualization_id)
  DO UPDATE SET
    is_primary = EXCLUDED.is_primary,
    admin_selected = EXCLUDED.admin_selected
  RETURNING id INTO v_link_id;

  RETURN v_link_id;
END;
$$;

-- Drop old version
DROP FUNCTION IF EXISTS link_visualization_to_lead(UUID, UUID, BOOLEAN, BOOLEAN);

-- get_lead_visualizations: add p_site_id parameter
CREATE OR REPLACE FUNCTION get_lead_visualizations(p_site_id TEXT, p_lead_id UUID)
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
  WHERE lv.site_id = p_site_id AND lv.lead_id = p_lead_id
  ORDER BY lv.is_primary DESC, lv.admin_selected DESC, v.created_at DESC;
$$;

-- Drop old version
DROP FUNCTION IF EXISTS get_lead_visualizations(UUID);

-- =============================================
-- STEP 6: Update views to include site_id
-- =============================================

-- Daily metrics summary (add site_id to GROUP BY)
DROP VIEW IF EXISTS visualization_metrics_daily;
CREATE VIEW visualization_metrics_daily AS
SELECT
  site_id,
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
GROUP BY site_id, DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Hourly metrics for recent monitoring (add site_id to GROUP BY)
DROP VIEW IF EXISTS visualization_metrics_hourly;
CREATE VIEW visualization_metrics_hourly AS
SELECT
  site_id,
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(*) AS total_visualizations,
  AVG(generation_time_ms) AS avg_generation_time_ms,
  COUNT(*) FILTER (WHERE error_occurred) AS error_count,
  SUM(estimated_cost_usd) AS cost_usd
FROM visualization_metrics
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY site_id, DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- =============================================
-- STEP 7: Seed admin_settings for both sites
-- =============================================

-- Remove default-site rows
DELETE FROM admin_settings WHERE site_id = 'default';

-- Insert settings for redwhitereno site
INSERT INTO admin_settings (site_id, key, value, description) VALUES
  ('redwhitereno', 'pricing_kitchen', '{"economy": {"min": 150, "max": 200}, "standard": {"min": 200, "max": 275}, "premium": {"min": 275, "max": 400}}', 'Kitchen pricing per square foot by finish level'),
  ('redwhitereno', 'pricing_bathroom', '{"economy": {"min": 200, "max": 300}, "standard": {"min": 300, "max": 450}, "premium": {"min": 450, "max": 600}}', 'Bathroom pricing per square foot by finish level'),
  ('redwhitereno', 'pricing_basement', '{"economy": {"min": 40, "max": 55}, "standard": {"min": 55, "max": 70}, "premium": {"min": 70, "max": 100}}', 'Basement pricing per square foot by finish level'),
  ('redwhitereno', 'pricing_flooring', '{"economy": {"min": 8, "max": 12}, "standard": {"min": 12, "max": 18}, "premium": {"min": 18, "max": 30}}', 'Flooring pricing per square foot by finish level'),
  ('redwhitereno', 'labor_rate', '{"hourly": 85}', 'Internal labour rate per hour'),
  ('redwhitereno', 'contract_markup', '{"percent": 15}', 'Contract labour markup percentage'),
  ('redwhitereno', 'contingency', '{"percent": 10}', 'Default contingency percentage'),
  ('redwhitereno', 'hst_rate', '{"percent": 13}', 'Ontario HST rate (locked)'),
  ('redwhitereno', 'deposit_rate', '{"percent": 50}', 'Deposit percentage required'),
  ('redwhitereno', 'quote_validity', '{"days": 30}', 'Quote validity period in days')
ON CONFLICT (site_id, key) DO NOTHING;

-- Insert settings for demo site
INSERT INTO admin_settings (site_id, key, value, description) VALUES
  ('demo', 'pricing_kitchen', '{"economy": {"min": 150, "max": 200}, "standard": {"min": 200, "max": 275}, "premium": {"min": 275, "max": 400}}', 'Kitchen pricing per square foot by finish level'),
  ('demo', 'pricing_bathroom', '{"economy": {"min": 200, "max": 300}, "standard": {"min": 300, "max": 450}, "premium": {"min": 450, "max": 600}}', 'Bathroom pricing per square foot by finish level'),
  ('demo', 'pricing_basement', '{"economy": {"min": 40, "max": 55}, "standard": {"min": 55, "max": 70}, "premium": {"min": 70, "max": 100}}', 'Basement pricing per square foot by finish level'),
  ('demo', 'pricing_flooring', '{"economy": {"min": 8, "max": 12}, "standard": {"min": 12, "max": 18}, "premium": {"min": 18, "max": 30}}', 'Flooring pricing per square foot by finish level'),
  ('demo', 'labor_rate', '{"hourly": 85}', 'Internal labour rate per hour'),
  ('demo', 'contract_markup', '{"percent": 15}', 'Contract labour markup percentage'),
  ('demo', 'contingency', '{"percent": 10}', 'Default contingency percentage'),
  ('demo', 'hst_rate', '{"percent": 13}', 'Ontario HST rate (locked)'),
  ('demo', 'deposit_rate', '{"percent": 50}', 'Deposit percentage required'),
  ('demo', 'quote_validity', '{"days": 30}', 'Quote validity period in days')
ON CONFLICT (site_id, key) DO NOTHING;
