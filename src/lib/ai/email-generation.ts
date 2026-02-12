/**
 * AI Email Generation Service
 * Generates personalized quote emails using AI
 * [DEV-072]
 */

import { generateObject } from 'ai';
import { openai } from './providers';
import {
  AIEmailSchema,
  EmailGenerationInputSchema,
  type AIEmail,
  type EmailGenerationInput,
  type FormattedEmail,
} from '../schemas/ai-email';

/**
 * System prompt for email generation
 */
const EMAIL_GENERATION_SYSTEM_PROMPT = `You are a professional email writer for AI Reno Demo, a home renovation company in Greater Ontario Area, Canada.

Your task is to generate personalized, professional emails to accompany renovation quotes.

## Brand Voice
- Professional but warm and approachable
- Confident without being pushy
- Helpful and informative
- Local Ontario business feel
- Focus on quality work and customer satisfaction

## Email Guidelines
1. Subject lines should be clear and professional (e.g., "Your Kitchen Renovation Quote - AI Reno Demo")
2. Greeting should use the customer's first name
3. Body should:
   - Thank them for their interest
   - Reference their specific project
   - Highlight key quote details (total, deposit)
   - Explain next steps
   - Offer to answer questions
4. Call to action should be clear (e.g., schedule a call, reply with questions)
5. Closing should be warm but professional

## Tone Examples
GOOD: "Thank you for considering AI Reno Demo for your basement renovation."
BAD: "Thanks for reaching out!" (too casual)

GOOD: "Please don't hesitate to reach out if you have any questions."
BAD: "Hit me up if you need anything!" (too informal)

## Do NOT include:
- Excessive exclamation marks
- Overly salesy language
- Pressure tactics
- Generic filler content`;

/**
 * Build user prompt from input data
 */
function buildUserPrompt(input: EmailGenerationInput): string {
  const parts: string[] = [];

  parts.push(`## Email Context`);
  parts.push(`- Customer Name: ${input.customerName}`);
  parts.push(`- Project Type: ${input.projectType}`);
  parts.push(`- Quote Total: $${input.quoteTotal.toLocaleString()}`);
  parts.push(`- Deposit Required: $${input.depositRequired.toLocaleString()} (50%)`);
  parts.push(`- Line Items: ${input.lineItemCount} items`);

  if (input.isResend) {
    parts.push(`- Note: This is a resend of a previous quote`);
  }

  if (input.goalsText) {
    parts.push(`\n## Customer's Goals`);
    parts.push(input.goalsText);
  }

  if (input.specialNotes) {
    parts.push(`\n## Special Notes from Quote`);
    parts.push(input.specialNotes);
  }

  parts.push(`\n## Instructions`);
  parts.push(`Generate a professional email to accompany this quote.`);
  parts.push(`The quote PDF will be attached to the email.`);

  return parts.join('\n');
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generate an AI email for a quote
 */
export async function generateAIEmail(
  input: EmailGenerationInput
): Promise<AIEmail> {
  // Validate input
  const validatedInput = EmailGenerationInputSchema.parse(input);

  // Generate the email
  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: AIEmailSchema,
    system: EMAIL_GENERATION_SYSTEM_PROMPT,
    prompt: buildUserPrompt(validatedInput),
    temperature: 0.5,
    maxOutputTokens: 1024,
  });

  return object;
}

/**
 * Convert AI email to formatted HTML and text versions
 */
export function formatAIEmail(
  aiEmail: AIEmail,
  quoteTotal: number,
  depositRequired: number
): FormattedEmail {
  // Build HTML body
  const htmlParagraphs = aiEmail.bodyParagraphs
    .map((p) => `<p style="margin-bottom: 16px; color: #333;">${p}</p>`)
    .join('\n');

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="border-bottom: 3px solid #D32F2F; padding-bottom: 20px; margin-bottom: 20px;">
    <h1 style="color: #D32F2F; margin: 0; font-size: 24px;">AI Reno Demo</h1>
    <p style="color: #666; margin: 4px 0 0 0; font-size: 14px;">Quality Renovations in Greater Ontario Area</p>
  </div>

  <p style="font-size: 16px; color: #333; margin-bottom: 16px;">${aiEmail.greeting}</p>

  ${htmlParagraphs}

  <div style="background-color: #f8f8f8; padding: 16px; border-radius: 8px; margin: 24px 0;">
    <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Quote Summary</strong></p>
    <p style="margin: 4px 0; color: #666;">Total: <strong style="color: #333;">${formatCurrency(quoteTotal)}</strong></p>
    <p style="margin: 4px 0; color: #666;">Deposit Required: <strong style="color: #D32F2F;">${formatCurrency(depositRequired)}</strong></p>
  </div>

  <p style="margin-bottom: 16px; color: #333;">${aiEmail.callToAction}</p>

  <p style="color: #333;">${aiEmail.closing}</p>

  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666;">
    <p style="margin: 0;"><strong style="color: #D32F2F;">AI Reno Demo</strong></p>
    <p style="margin: 4px 0;">123 Innovation Drive, Greater Ontario Area N0N 0N0</p>
    <p style="margin: 4px 0;">Tel: (555) 123-4567</p>
    <p style="margin: 4px 0;"><a href="https://www.airenodemo.com" style="color: #D32F2F;">www.airenodemo.com</a></p>
  </div>
</body>
</html>
  `.trim();

  // Build text body
  const textParagraphs = aiEmail.bodyParagraphs.join('\n\n');
  const textBody = `
${aiEmail.greeting}

${textParagraphs}

---
Quote Summary
Total: ${formatCurrency(quoteTotal)}
Deposit Required: ${formatCurrency(depositRequired)}
---

${aiEmail.callToAction}

${aiEmail.closing}

--
AI Reno Demo
123 Innovation Drive, Greater Ontario Area N0N 0N0
Tel: (555) 123-4567
www.airenodemo.com
  `.trim();

  return {
    subject: aiEmail.subject,
    htmlBody,
    textBody,
  };
}

/**
 * Generate a default email (non-AI) as fallback
 */
export function generateDefaultEmail(
  customerName: string,
  projectType: string,
  quoteTotal: number,
  depositRequired: number
): FormattedEmail {
  const firstName = customerName.split(' ')[0];

  const subject = `Your ${projectType.charAt(0).toUpperCase() + projectType.slice(1)} Renovation Quote - AI Reno Demo`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="border-bottom: 3px solid #D32F2F; padding-bottom: 20px; margin-bottom: 20px;">
    <h1 style="color: #D32F2F; margin: 0; font-size: 24px;">AI Reno Demo</h1>
    <p style="color: #666; margin: 4px 0 0 0; font-size: 14px;">Quality Renovations in Greater Ontario Area</p>
  </div>

  <p style="font-size: 16px; color: #333; margin-bottom: 16px;">Hi ${firstName},</p>

  <p style="margin-bottom: 16px; color: #333;">Thank you for considering AI Reno Demo for your ${projectType} renovation project. Please find your detailed quote attached to this email.</p>

  <p style="margin-bottom: 16px; color: #333;">We've carefully reviewed your requirements and prepared an estimate that reflects our commitment to quality workmanship and fair pricing.</p>

  <div style="background-color: #f8f8f8; padding: 16px; border-radius: 8px; margin: 24px 0;">
    <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Quote Summary</strong></p>
    <p style="margin: 4px 0; color: #666;">Total: <strong style="color: #333;">${formatCurrency(quoteTotal)}</strong></p>
    <p style="margin: 4px 0; color: #666;">Deposit Required: <strong style="color: #D32F2F;">${formatCurrency(depositRequired)}</strong></p>
  </div>

  <p style="margin-bottom: 16px; color: #333;">If you have any questions about the quote or would like to discuss your project further, please don't hesitate to reach out. We're happy to schedule a call or site visit at your convenience.</p>

  <p style="color: #333;">We look forward to working with you.</p>
  <p style="color: #333; margin-top: 16px;">Best regards,<br>The AI Reno Demo Team</p>

  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666;">
    <p style="margin: 0;"><strong style="color: #D32F2F;">AI Reno Demo</strong></p>
    <p style="margin: 4px 0;">123 Innovation Drive, Greater Ontario Area N0N 0N0</p>
    <p style="margin: 4px 0;">Tel: (555) 123-4567</p>
    <p style="margin: 4px 0;"><a href="https://www.airenodemo.com" style="color: #D32F2F;">www.airenodemo.com</a></p>
  </div>
</body>
</html>
  `.trim();

  const textBody = `
Hi ${firstName},

Thank you for considering AI Reno Demo for your ${projectType} renovation project. Please find your detailed quote attached to this email.

We've carefully reviewed your requirements and prepared an estimate that reflects our commitment to quality workmanship and fair pricing.

---
Quote Summary
Total: ${formatCurrency(quoteTotal)}
Deposit Required: ${formatCurrency(depositRequired)}
---

If you have any questions about the quote or would like to discuss your project further, please don't hesitate to reach out. We're happy to schedule a call or site visit at your convenience.

We look forward to working with you.

Best regards,
The AI Reno Demo Team

--
AI Reno Demo
123 Innovation Drive, Greater Ontario Area N0N 0N0
Tel: (555) 123-4567
www.airenodemo.com
  `.trim();

  return {
    subject,
    htmlBody,
    textBody,
  };
}
