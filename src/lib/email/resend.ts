/**
 * Resend Email Service
 * Handles sending transactional emails for the platform
 */

import { Resend } from 'resend';

// Lazy initialization of Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env['RESEND_API_KEY']);
  }
  return resendClient;
}

// Email configuration
const FROM_EMAIL = process.env['FROM_EMAIL'] || 'ConversionOS <noreply@conversionos.com>';
const OWNER_EMAIL = process.env['OWNER_EMAIL'] || 'admin@conversionos.com';

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, react, replyTo }: SendEmailParams) {
  if (!process.env['RESEND_API_KEY']) {
    console.warn('RESEND_API_KEY not set, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const resend = getResendClient();
    const emailOptions: Parameters<typeof resend.emails.send>[0] = {
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
    };

    if (replyTo) {
      emailOptions.replyTo = replyTo;
    }

    const result = await resend.emails.send(emailOptions);

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Get owner email for notifications
 */
export function getOwnerEmail() {
  return OWNER_EMAIL;
}

/**
 * Get Resend client for advanced usage
 */
export function getResend() {
  return getResendClient();
}
