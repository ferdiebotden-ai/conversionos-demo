-- =============================================
-- Allow public (anonymous) lead submissions
-- Migration: 20260204000000_leads_public_insert.sql
-- =============================================

-- Allow anyone to insert a lead (for quote request submissions)
-- The service role policy was incorrectly checking JWT claims;
-- service role key bypasses RLS entirely, so that policy is unnecessary.
-- This policy allows anonymous API calls to create leads.
CREATE POLICY "Public lead submission" ON leads
  FOR INSERT
  WITH CHECK (true);

-- Also need to allow public inserts to audit_log for lead creation logging
CREATE POLICY "Public audit logging" ON audit_log
  FOR INSERT
  WITH CHECK (true);
