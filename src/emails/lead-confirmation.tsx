/**
 * Lead Confirmation Email
 * Sent to customer when they submit their project request
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface LeadConfirmationEmailProps {
  customerName: string;
  projectType: string;
  estimateLow?: number | undefined;
  estimateHigh?: number | undefined;
}

export function LeadConfirmationEmail({
  customerName,
  projectType,
  estimateLow,
  estimateHigh,
}: LeadConfirmationEmailProps) {
  const hasEstimate = estimateLow && estimateHigh;
  const formattedProjectType = projectType.charAt(0).toUpperCase() + projectType.slice(1);

  return (
    <Html>
      <Head />
      <Preview>Thanks for your inquiry! We&apos;ll be in touch soon.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>
            <span style={{ color: '#1565C0' }}>Red</span>{' '}
            <span style={{ color: '#1a1a1a' }}>White</span>{' '}
            <span style={{ color: '#666' }}>Reno</span>
          </Heading>

          <Text style={paragraph}>Hi {customerName},</Text>

          <Text style={paragraph}>
            Thank you for reaching out about your {formattedProjectType.toLowerCase()} renovation project!
            We&apos;ve received your information and one of our team members will be in touch
            within the next business day.
          </Text>

          {hasEstimate && (
            <Section style={estimateBox}>
              <Text style={estimateLabel}>Your Preliminary Estimate</Text>
              <Text style={estimateValue}>
                ${estimateLow.toLocaleString()} - ${estimateHigh.toLocaleString()}
              </Text>
              <Text style={estimateNote}>
                * This is a ballpark estimate based on our conversation. Final pricing
                will be determined after an in-person consultation.
              </Text>
            </Section>
          )}

          <Text style={paragraph}>
            <strong>What happens next?</strong>
          </Text>

          <Text style={listItem}>
            1. Our team will review your project details
          </Text>
          <Text style={listItem}>
            2. We&apos;ll reach out to schedule a consultation
          </Text>
          <Text style={listItem}>
            3. You&apos;ll receive a detailed quote after we assess your space
          </Text>

          <Text style={paragraph}>
            In the meantime, feel free to browse our{' '}
            <Link href="https://mccartysquared.ca/projects" style={link}>
              recent projects
            </Link>{' '}
            for inspiration!
          </Text>

          <Hr style={hr} />

          <Text style={paragraph}>
            Have questions? Reply to this email or call us at{' '}
            <Link href="tel:+15195551234" style={link}>
              (519) 555-1234
            </Link>
          </Text>

          <Text style={footer}>
            McCarty Squared - Quality Renovations in London, ON
            <br />
            <Link href="https://mccartysquared.ca" style={footerLink}>
              mccartysquared.ca
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '580px',
  borderRadius: '8px',
};

const heading = {
  fontSize: '28px',
  lineHeight: '1.3',
  fontWeight: '700',
  textAlign: 'center' as const,
  margin: '0 0 30px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#333',
  margin: '16px 0',
};

const estimateBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  borderLeft: '4px solid #1565C0',
};

const estimateLabel = {
  fontSize: '14px',
  color: '#666',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const estimateValue = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1565C0',
  margin: '0 0 12px',
};

const estimateNote = {
  fontSize: '12px',
  color: '#666',
  margin: '0',
  fontStyle: 'italic',
};

const listItem = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333',
  margin: '8px 0',
  paddingLeft: '8px',
};

const link = {
  color: '#1565C0',
  textDecoration: 'underline',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
};

const footer = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '8px 0',
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#1565C0',
  textDecoration: 'underline',
};

export default LeadConfirmationEmail;
