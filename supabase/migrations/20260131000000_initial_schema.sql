-- =============================================
-- Lead-to-Quote Engine v2 - Initial Schema
-- Migration: 20260131000000_initial_schema.sql
-- =============================================

-- =============================================
-- LEADS TABLE: Core lead/quote request storage
-- =============================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status Management
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new', 'draft_ready', 'needs_clarification', 'sent', 'won', 'lost'
  )),

  -- Contact Information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT DEFAULT 'Stratford',
  province TEXT DEFAULT 'ON',

  -- Project Details
  project_type TEXT CHECK (project_type IN (
    'kitchen', 'bathroom', 'basement', 'flooring', 'painting', 'exterior', 'other'
  )),
  area_sqft INTEGER,
  timeline TEXT CHECK (timeline IN (
    'asap', '1_3_months', '3_6_months', '6_plus_months', 'just_exploring'
  )),
  budget_band TEXT CHECK (budget_band IN (
    'under_15k', '15k_25k', '25k_40k', '40k_60k', '60k_plus', 'not_sure'
  )),
  finish_level TEXT CHECK (finish_level IN ('economy', 'standard', 'premium')),
  goals_text TEXT,

  -- AI-Generated Data
  chat_transcript JSONB, -- Full conversation history
  scope_json JSONB, -- Structured extraction from conversation
  quote_draft_json JSONB, -- AI-generated quote
  confidence_score NUMERIC(3,2), -- 0.00 to 1.00
  ai_notes TEXT, -- AI's reasoning/concerns

  -- Files
  uploaded_photos TEXT[], -- Array of storage URLs
  generated_concepts TEXT[], -- Array of visualization URLs
  quote_pdf_url TEXT,

  -- Tracking
  source TEXT DEFAULT 'website', -- website, referral, etc.
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  session_id UUID,

  -- Admin
  owner_notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  last_contacted_at TIMESTAMPTZ,
  follow_up_date DATE
);

-- =============================================
-- QUOTE DRAFTS TABLE: Detailed quote information
-- =============================================
CREATE TABLE quote_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,

  -- Quote Content
  line_items JSONB NOT NULL, -- Array of {description, category, quantity, unit, unit_price, total}

  -- Tiered Pricing (optional)
  tier_good JSONB,
  tier_better JSONB,
  tier_best JSONB,

  -- Assumptions & Exclusions
  assumptions TEXT[],
  exclusions TEXT[],
  special_notes TEXT,
  recommended_next_step TEXT,

  -- Totals
  subtotal NUMERIC(10,2),
  contingency_percent NUMERIC(4,2) DEFAULT 10.00,
  contingency_amount NUMERIC(10,2),
  hst_percent NUMERIC(4,2) DEFAULT 13.00,
  hst_amount NUMERIC(10,2),
  total NUMERIC(10,2),
  deposit_percent NUMERIC(4,2) DEFAULT 50.00,
  deposit_required NUMERIC(10,2),

  -- Validity
  validity_days INTEGER DEFAULT 30,
  expires_at DATE,

  -- Delivery
  sent_at TIMESTAMPTZ,
  sent_to_email TEXT,
  opened_at TIMESTAMPTZ,
  pdf_url TEXT
);

-- =============================================
-- AUDIT LOG: Track all changes
-- =============================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  lead_id UUID REFERENCES leads(id),
  action TEXT NOT NULL, -- 'create', 'update', 'send_quote', 'status_change', etc.
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT
);

-- =============================================
-- CHAT SESSIONS: For save/resume functionality
-- =============================================
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',

  email TEXT, -- For magic link resume
  messages JSONB NOT NULL DEFAULT '[]',
  extracted_data JSONB,
  state TEXT DEFAULT 'active', -- active, completed, expired, abandoned

  -- Tracking
  device_type TEXT,
  started_from TEXT -- 'home_cta', 'services_page', 'visualizer', etc.
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Admin full access policies
CREATE POLICY "Admin full access" ON leads
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access" ON quote_drafts
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access" ON audit_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Service role bypass (for API routes using service client)
CREATE POLICY "Service role bypass" ON leads
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role bypass" ON quote_drafts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role bypass" ON audit_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Chat sessions accessible by session ID (for anonymous users)
-- Note: Access controlled by session ID in app logic
CREATE POLICY "Public insert" ON chat_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Session read by id" ON chat_sessions
  FOR SELECT USING (true);

CREATE POLICY "Session update by id" ON chat_sessions
  FOR UPDATE USING (true);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_quote_drafts_lead_id ON quote_drafts(lead_id);
CREATE INDEX idx_audit_log_lead_id ON audit_log(lead_id);
CREATE INDEX idx_chat_sessions_email ON chat_sessions(email);
CREATE INDEX idx_chat_sessions_expires_at ON chat_sessions(expires_at);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER quote_drafts_updated_at
  BEFORE UPDATE ON quote_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
