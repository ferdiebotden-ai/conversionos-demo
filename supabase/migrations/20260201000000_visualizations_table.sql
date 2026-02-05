-- =============================================
-- Lead-to-Quote Engine v2 - Visualizations Table
-- Migration: 20260201000000_visualizations_table.sql
-- =============================================

-- =============================================
-- VISUALIZATIONS TABLE: AI design visualization sessions
-- =============================================
CREATE TABLE visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- User Info (optional - for non-authenticated users)
  email TEXT,

  -- Original Input
  original_photo_url TEXT NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN (
    'kitchen', 'bathroom', 'living_room', 'bedroom', 'basement', 'dining_room'
  )),
  style TEXT NOT NULL CHECK (style IN (
    'modern', 'traditional', 'farmhouse', 'industrial', 'minimalist', 'contemporary'
  )),
  constraints TEXT, -- User preferences/requirements

  -- Generated Output
  generated_concepts JSONB NOT NULL DEFAULT '[]', -- Array of {id, imageUrl, description, generatedAt}
  generation_time_ms INTEGER, -- How long generation took

  -- Relationships
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Sharing
  shared BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE, -- For shareable URLs

  -- Tracking
  downloaded BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  source TEXT DEFAULT 'visualizer', -- 'visualizer', 'estimate_page', etc.

  -- Analytics
  device_type TEXT,
  user_agent TEXT
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE visualizations ENABLE ROW LEVEL SECURITY;

-- Public can insert visualizations
CREATE POLICY "Public insert" ON visualizations
  FOR INSERT WITH CHECK (true);

-- Public can view shared visualizations by share_token
CREATE POLICY "View shared" ON visualizations
  FOR SELECT USING (shared = true OR share_token IS NOT NULL);

-- Admin full access
CREATE POLICY "Admin full access" ON visualizations
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Service role bypass
CREATE POLICY "Service role bypass" ON visualizations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_visualizations_created_at ON visualizations(created_at DESC);
CREATE INDEX idx_visualizations_email ON visualizations(email);
CREATE INDEX idx_visualizations_share_token ON visualizations(share_token);
CREATE INDEX idx_visualizations_lead_id ON visualizations(lead_id);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER visualizations_updated_at
  BEFORE UPDATE ON visualizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- STORAGE BUCKET: For visualization images
-- =============================================
-- Note: Run this via Supabase Dashboard or CLI:
-- supabase storage create-bucket visualizations --public

-- Storage policies would be configured in dashboard:
-- - Public read access for shared images
-- - Service role write access for uploads
