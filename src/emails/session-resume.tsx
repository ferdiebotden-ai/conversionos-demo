/**
 * Session Resume Email
 * Magic link email for resuming chat sessions
 */

import {
  Body,
  Button,
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

interface SessionResumeEmailProps {
  resumeUrl: string;
  expiresInDays?: number;
}

export function SessionResumeEmail({
  resumeUrl,
  expiresInDays = 7,
}: SessionResumeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Continue your renovation quote with McCarty Squared</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>
            <span style={{ color: '#1565C0' }}>Red</span>{' '}
            <span style={{ color: '#1a1a1a' }}>White</span>{' '}
            <span style={{ color: '#666' }}>Reno</span>
          </Heading>

          <Text style={paragraph}>
            You requested to save your renovation quote progress. Click the button below
            to pick up right where you left off.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={resumeUrl}>
              Continue My Quote
            </Button>
          </Section>

          <Text style={paragraph}>
            Or copy and paste this link into your browser:
          </Text>

          <Text style={link}>
            <Link href={resumeUrl} style={link}>
              {resumeUrl}
            </Link>
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            This link will expire in {expiresInDays} days. If you didn&apos;t request this email,
            you can safely ignore it.
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#1565C0',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const link = {
  color: '#1565C0',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
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
};

const footerLink = {
  color: '#1565C0',
  textDecoration: 'underline',
};

export default SessionResumeEmail;
