-- =============================================
-- Lead-to-Quote Engine v2 - Invoices & Payments
-- Migration: 20260207100000_invoices_and_payments.sql
-- [DEV-073 to DEV-076]
-- =============================================

-- =============================================
-- INVOICE SEQUENCES: Year-based auto-incrementing
-- =============================================
CREATE TABLE invoice_sequences (
  year INTEGER PRIMARY KEY,
  last_number INTEGER DEFAULT 0
);

-- Function to get next invoice number (INV-2026-001 format)
CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  next_num INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::INTEGER;

  INSERT INTO invoice_sequences (year, last_number)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET last_number = invoice_sequences.last_number + 1
  RETURNING last_number INTO next_num;

  RETURN 'INV-' || current_year || '-' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INVOICES TABLE
-- =============================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Invoice Identity
  invoice_number TEXT UNIQUE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  quote_draft_id UUID REFERENCES quote_drafts(id) ON DELETE SET NULL,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'
  )),

  -- Line Items (copied from quote at creation time)
  line_items JSONB NOT NULL DEFAULT '[]',

  -- Totals
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  contingency_percent NUMERIC(4,2) DEFAULT 0,
  contingency_amount NUMERIC(10,2) DEFAULT 0,
  hst_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Payment Tracking
  amount_paid NUMERIC(10,2) DEFAULT 0,
  balance_due NUMERIC(10,2) NOT NULL DEFAULT 0,
  deposit_required NUMERIC(10,2) DEFAULT 0,
  deposit_received BOOLEAN DEFAULT FALSE,

  -- Denormalized Customer Info (snapshot at invoice creation)
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  customer_city TEXT DEFAULT 'Stratford',
  customer_province TEXT DEFAULT 'ON',
  customer_postal_code TEXT,

  -- Dates
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  sent_at TIMESTAMPTZ,

  -- Files
  pdf_url TEXT,

  -- Notes
  notes TEXT,
  internal_notes TEXT
);

-- =============================================
-- PAYMENTS TABLE
-- =============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Link to invoice
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  -- Payment Details
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'cash', 'cheque', 'etransfer', 'credit_card'
  )),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_number TEXT,

  -- Metadata
  recorded_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- =============================================
-- TRIGGER: Auto-update invoice on payment insert
-- =============================================
CREATE OR REPLACE FUNCTION payment_balance_update()
RETURNS TRIGGER AS $$
DECLARE
  inv_total NUMERIC(10,2);
  inv_deposit_required NUMERIC(10,2);
  new_amount_paid NUMERIC(10,2);
  new_balance NUMERIC(10,2);
  new_status TEXT;
  is_deposit_met BOOLEAN;
BEGIN
  -- Calculate new totals
  SELECT
    COALESCE(SUM(p.amount), 0),
    i.total,
    i.deposit_required
  INTO new_amount_paid, inv_total, inv_deposit_required
  FROM invoices i
  LEFT JOIN payments p ON p.invoice_id = i.id
  WHERE i.id = NEW.invoice_id
  GROUP BY i.total, i.deposit_required;

  new_balance := inv_total - new_amount_paid;
  is_deposit_met := new_amount_paid >= COALESCE(inv_deposit_required, 0);

  -- Determine new status
  IF new_balance <= 0 THEN
    new_status := 'paid';
  ELSIF new_amount_paid > 0 THEN
    new_status := 'partially_paid';
  ELSE
    -- Keep current status
    SELECT status INTO new_status FROM invoices WHERE id = NEW.invoice_id;
  END IF;

  -- Update invoice
  UPDATE invoices SET
    amount_paid = new_amount_paid,
    balance_due = GREATEST(new_balance, 0),
    deposit_received = is_deposit_met,
    status = new_status,
    updated_at = NOW()
  WHERE id = NEW.invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_balance_update
  AFTER INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION payment_balance_update();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access" ON invoices
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access" ON payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access" ON invoice_sequences
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Service role bypass
CREATE POLICY "Service role bypass" ON invoices
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role bypass" ON payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role bypass" ON invoice_sequences
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_lead_id ON invoices(lead_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date DESC);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
