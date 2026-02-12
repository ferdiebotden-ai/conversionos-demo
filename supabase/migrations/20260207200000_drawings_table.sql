-- =============================================
-- Lead-to-Quote Engine v2 - Drawings Table
-- Migration: 20260207200000_drawings_table.sql
-- [DEV-091]
-- =============================================

-- =============================================
-- DRAWINGS TABLE: CAD/architecture drawings
-- =============================================
CREATE TABLE drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Drawing Identity
  name TEXT NOT NULL,
  description TEXT,

  -- Linked Lead (optional)
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Drawing Data (serialized CAD state)
  drawing_data JSONB DEFAULT '{}',
  thumbnail_url TEXT,

  -- Status & Permitting
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'approved', 'rejected'
  )),
  permit_number TEXT,

  -- Files
  pdf_url TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON drawings
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Service role bypass" ON drawings
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_drawings_lead_id ON drawings(lead_id);
CREATE INDEX idx_drawings_status ON drawings(status);
CREATE INDEX idx_drawings_created_at ON drawings(created_at DESC);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER drawings_updated_at
  BEFORE UPDATE ON drawings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
