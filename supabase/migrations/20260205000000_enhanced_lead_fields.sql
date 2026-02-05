-- =============================================
-- Lead-to-Quote Engine v2 - Enhanced Lead Fields
-- Migration: 20260205000000_enhanced_lead_fields.sql
-- Purpose: Add Ontario-specific fields and AI enhancement columns
-- =============================================

-- =============================================
-- LEADS TABLE: Add Ontario-specific property fields
-- =============================================

-- Property type (detached, semi, townhouse, condo, other)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS property_type TEXT CHECK (property_type IN (
    'detached', 'semi', 'townhouse', 'condo', 'other'
  ));

-- Property age for permit assessment
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS property_age TEXT CHECK (property_age IN (
    'new', '0-10', '10-25', '25-50', '50+'
  ));

-- Ownership status
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT true;

-- HOA/Condo board restrictions
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS has_hoa BOOLEAN DEFAULT false;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS hoa_restrictions TEXT;

-- Permit awareness acknowledgment
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS permit_aware BOOLEAN DEFAULT false;

-- Preferred project start date
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS preferred_start_date DATE;

-- Access notes (keys, codes, pets, parking)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS access_notes TEXT;

-- Voice transcript from GPT-4o Realtime
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS voice_transcript JSONB;

-- Design chat context for visualizer AI prompt optimization
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS design_chat_context JSONB;

-- Extracted user preferences from chat/voice
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS extracted_preferences JSONB;

-- =============================================
-- VISUALIZATIONS TABLE: Add AI prompt context
-- =============================================

-- Design chat context for better prompt generation
ALTER TABLE visualizations
  ADD COLUMN IF NOT EXISTS prompt_context JSONB;

-- Link to design chat session if applicable
ALTER TABLE visualizations
  ADD COLUMN IF NOT EXISTS design_chat_id UUID REFERENCES chat_sessions(id);

-- =============================================
-- INDEXES for new fields
-- =============================================

CREATE INDEX IF NOT EXISTS idx_leads_property_type ON leads(property_type);
CREATE INDEX IF NOT EXISTS idx_leads_preferred_start_date ON leads(preferred_start_date);
CREATE INDEX IF NOT EXISTS idx_visualizations_design_chat_id ON visualizations(design_chat_id);

-- =============================================
-- COMMENTS for documentation
-- =============================================

COMMENT ON COLUMN leads.property_type IS 'Ontario property type: detached, semi, townhouse, condo, other';
COMMENT ON COLUMN leads.property_age IS 'Property age range for permit and scope assessment';
COMMENT ON COLUMN leads.is_owner IS 'Whether the requester is the property owner';
COMMENT ON COLUMN leads.has_hoa IS 'Whether property has HOA/condo board restrictions';
COMMENT ON COLUMN leads.hoa_restrictions IS 'Details about HOA restrictions that affect renovation';
COMMENT ON COLUMN leads.permit_aware IS 'Customer acknowledged that permits may be required';
COMMENT ON COLUMN leads.preferred_start_date IS 'Customer preferred project start date';
COMMENT ON COLUMN leads.access_notes IS 'Access info: keys, codes, pets, parking, etc.';
COMMENT ON COLUMN leads.voice_transcript IS 'Transcript from GPT-4o Realtime voice conversation';
COMMENT ON COLUMN leads.design_chat_context IS 'Context from visualizer design chat for AI quotes';
COMMENT ON COLUMN leads.extracted_preferences IS 'AI-extracted preferences from chat/voice interactions';
COMMENT ON COLUMN visualizations.prompt_context IS 'Full context used for Gemini prompt generation';
COMMENT ON COLUMN visualizations.design_chat_id IS 'Reference to design chat session if applicable';
