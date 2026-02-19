/**
 * Invoice Email Template
 * Professional email template for sending invoices to customers
 * Adapted from quote-email.tsx
 * [DEV-090]
 */

import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
  Link,
} from '@react-email/components';
import type { Invoice } from '@/types/database';

const COLORS = {
  primary: '#1565C0',
  secondary: '#1a1a1a',
  muted: '#666666',
  border: '#e5e5e5',
  background: '#f8f8f8',
  white: '#ffffff',
};

const main = {
  backgroundColor: COLORS.background,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: COLORS.white,
  margin: '0 auto',
  padding: '40px 0',
  maxWidth: '600px',
};

const headerSection = {
  padding: '0 40px 30px',
  borderBottom: `2px solid ${COLORS.primary}`,
};

const brandName = {
  fontSize: '28px',
  fontWeight: '700' as const,
  color: COLORS.primary,
  margin: '0',
};

const tagline = {
  fontSize: '14px',
  color: COLORS.muted,
  margin: '4px 0 0',
};

const contentSection = {
  padding: '30px 40px',
};

const greeting = {
  fontSize: '18px',
  fontWeight: '600' as const,
  color: COLORS.secondary,
  margin: '0 0 16px',
};

const paragraph = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: COLORS.secondary,
  margin: '0 0 16px',
};

const invoiceCard = {
  backgroundColor: COLORS.background,
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const invoiceTitle = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: COLORS.primary,
  margin: '0 0 16px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const invoiceRow = {
  margin: '0 0 8px',
};

const invoiceLabel = {
  fontSize: '14px',
  color: COLORS.muted,
  margin: '0',
};

const invoiceValue = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: COLORS.secondary,
  margin: '0',
};

const totalRow = {
  paddingTop: '16px',
  marginTop: '16px',
  borderTop: `2px solid ${COLORS.primary}`,
};

const totalLabel = {
  fontSize: '18px',
  fontWeight: '700' as const,
  color: COLORS.secondary,
  margin: '0',
};

const totalValue = {
  fontSize: '24px',
  fontWeight: '700' as const,
  color: COLORS.primary,
  margin: '0',
};

const balanceText = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: COLORS.primary,
  margin: '8px 0 0',
};

const ctaSection = {
  textAlign: 'center' as const,
  padding: '16px 0 24px',
};

const ctaButton = {
  backgroundColor: COLORS.primary,
  borderRadius: '6px',
  color: COLORS.white,
  fontSize: '16px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
  display: 'inline-block',
};

const customMessageSection = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 24px',
  borderLeft: '4px solid #f59e0b',
};

const customMessageText = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: COLORS.secondary,
  margin: '0',
  fontStyle: 'italic' as const,
};

const footerSection = {
  padding: '24px 40px',
  borderTop: `1px solid ${COLORS.border}`,
};

const footerText = {
  fontSize: '13px',
  color: COLORS.muted,
  margin: '0 0 4px',
  textAlign: 'center' as const,
};

const footerLink = {
  color: COLORS.primary,
  textDecoration: 'none',
};

const hr = {
  borderColor: COLORS.border,
  margin: '24px 0',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export interface InvoiceEmailProps {
  invoice: Invoice;
  customMessage?: string;
}

export function InvoiceEmailTemplate({ invoice, customMessage }: InvoiceEmailProps) {
  const firstName = invoice.customer_name.split(' ')[0];
  const total = Number(invoice.total) || 0;
  const balanceDue = Number(invoice.balance_due) || 0;
  const depositRequired = Number(invoice.deposit_required) || 0;

  return (
    <Html>
      <Head />
      <Preview>
        Invoice #{invoice.invoice_number} from McCarty Squared - {formatCurrency(total)}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={brandName}>McCarty Squared</Text>
            <Text style={tagline}>Quality Renovations in London, ON</Text>
          </Section>

          {/* Content */}
          <Section style={contentSection}>
            <Text style={greeting}>Hi {firstName},</Text>

            <Text style={paragraph}>
              Please find attached your invoice from McCarty Squared for your renovation project.
            </Text>

            {customMessage && (
              <Section style={customMessageSection}>
                <Text style={customMessageText}>&ldquo;{customMessage}&rdquo;</Text>
              </Section>
            )}

            {/* Invoice summary card */}
            <Section style={invoiceCard}>
              <Text style={invoiceTitle}>Invoice Details</Text>

              <Row style={invoiceRow}>
                <Column>
                  <Text style={invoiceLabel}>Invoice Number</Text>
                </Column>
                <Column align="right">
                  <Text style={invoiceValue}>{invoice.invoice_number}</Text>
                </Column>
              </Row>

              <Row style={invoiceRow}>
                <Column>
                  <Text style={invoiceLabel}>Issue Date</Text>
                </Column>
                <Column align="right">
                  <Text style={invoiceValue}>{formatDate(invoice.issue_date)}</Text>
                </Column>
              </Row>

              <Row style={invoiceRow}>
                <Column>
                  <Text style={invoiceLabel}>Due Date</Text>
                </Column>
                <Column align="right">
                  <Text style={invoiceValue}>{formatDate(invoice.due_date)}</Text>
                </Column>
              </Row>

              <Row style={invoiceRow}>
                <Column>
                  <Text style={invoiceLabel}>Subtotal</Text>
                </Column>
                <Column align="right">
                  <Text style={invoiceValue}>{formatCurrency(Number(invoice.subtotal))}</Text>
                </Column>
              </Row>

              <Row style={invoiceRow}>
                <Column>
                  <Text style={invoiceLabel}>HST (13%)</Text>
                </Column>
                <Column align="right">
                  <Text style={invoiceValue}>{formatCurrency(Number(invoice.hst_amount))}</Text>
                </Column>
              </Row>

              <Row style={totalRow}>
                <Column>
                  <Text style={totalLabel}>Total</Text>
                </Column>
                <Column align="right">
                  <Text style={totalValue}>{formatCurrency(total)}</Text>
                </Column>
              </Row>

              <Text style={balanceText}>
                Balance Due: {formatCurrency(balanceDue)}
              </Text>
              {depositRequired > 0 && Number(invoice.amount_paid) === 0 && (
                <Text style={{ ...balanceText, color: COLORS.muted }}>
                  Deposit required: {formatCurrency(depositRequired)} (50%)
                </Text>
              )}
            </Section>

            {/* Payment instructions */}
            <Text style={paragraph}>
              Payment can be made via E-Transfer to <strong>payments@mccartysquared.ca</strong>.
              Cheques payable to McCarty Squared Inc.
            </Text>

            <Section style={ctaSection}>
              <Button href="mailto:info@mccartysquared.ca" style={ctaButton}>
                Questions? Contact Us
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={paragraph}>
              Please review the attached PDF for the complete line-item breakdown.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              McCarty Squared | London, ON
            </Text>
            <Text style={footerText}>
              <Link href="mailto:info@mccartysquared.ca" style={footerLink}>
                info@mccartysquared.ca
              </Link>
              {' '}&bull;{' '}
              <Link href="tel:+15193019140" style={footerLink}>
                (226) 667-8940
              </Link>
            </Text>
            <Text style={{ ...footerText, marginTop: '16px', fontSize: '11px' }}>
              This invoice was sent to {invoice.customer_email}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default InvoiceEmailTemplate;
