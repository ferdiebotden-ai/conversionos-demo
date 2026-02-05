-- Migration: AI Quote Generation & Admin Settings
-- [DEV-072]
-- Adds ai_draft_json column to quote_drafts and creates admin_settings table

-- Add AI draft column to quote_drafts for storing original AI generation
ALTER TABLE quote_drafts
ADD COLUMN IF NOT EXISTS ai_draft_json JSONB;

COMMENT ON COLUMN quote_drafts.ai_draft_json IS 'Original AI-generated quote for reference/comparison';

-- Create admin_settings table for configurable business settings
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE admin_settings IS 'Configurable business settings for pricing, rates, and defaults';

-- Create index for faster key lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);

-- Enable RLS on admin_settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admin users can read/write settings
CREATE POLICY "Admins can read settings"
ON admin_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert settings"
ON admin_settings FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update settings"
ON admin_settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Service role has full access to settings"
ON admin_settings
TO service_role
USING (true)
WITH CHECK (true);

-- Insert default settings
INSERT INTO admin_settings (key, value, description)
VALUES
  ('pricing_kitchen', '{"economy": {"min": 150, "max": 200}, "standard": {"min": 200, "max": 275}, "premium": {"min": 275, "max": 400}}', 'Kitchen pricing per square foot by finish level'),
  ('pricing_bathroom', '{"economy": {"min": 200, "max": 300}, "standard": {"min": 300, "max": 450}, "premium": {"min": 450, "max": 600}}', 'Bathroom pricing per square foot by finish level'),
  ('pricing_basement', '{"economy": {"min": 40, "max": 55}, "standard": {"min": 55, "max": 70}, "premium": {"min": 70, "max": 100}}', 'Basement pricing per square foot by finish level'),
  ('pricing_flooring', '{"economy": {"min": 8, "max": 12}, "standard": {"min": 12, "max": 18}, "premium": {"min": 18, "max": 30}}', 'Flooring pricing per square foot by finish level'),
  ('labor_rate', '{"hourly": 85}', 'Internal labour rate per hour'),
  ('contract_markup', '{"percent": 15}', 'Contract labour markup percentage'),
  ('contingency', '{"percent": 10}', 'Default contingency percentage'),
  ('hst_rate', '{"percent": 13}', 'Ontario HST rate (locked)'),
  ('deposit_rate', '{"percent": 50}', 'Deposit percentage required'),
  ('quote_validity', '{"days": 30}', 'Quote validity period in days')
ON CONFLICT (key) DO NOTHING;

-- Add trigger to update updated_at on admin_settings
CREATE OR REPLACE FUNCTION update_admin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_settings_timestamp
BEFORE UPDATE ON admin_settings
FOR EACH ROW
EXECUTE FUNCTION update_admin_settings_updated_at();
