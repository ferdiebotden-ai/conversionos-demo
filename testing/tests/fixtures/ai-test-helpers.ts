/**
 * AI Test Helpers
 * Utilities for testing AI-powered features (chat, visualizer, receptionist)
 */

import { Page, expect } from '@playwright/test';

/** Standard timeout for AI responses */
export const AI_TIMEOUT = 90000; // 90 seconds

/** Max AI API calls per test file */
export const MAX_AI_CALLS_PER_FILE = 5;

/**
 * Check if AI features are available
 * Some environments may not have API keys configured
 */
export async function isAIAvailable(page: Page): Promise<boolean> {
  try {
    const response = await page.request.get('/api/voice/check', { timeout: 5000 });
    return response.ok();
  } catch {
    return false;
  }
}

/**
 * Send a chat message and wait for AI response with extended timeout
 */
export async function sendAIChatMessage(
  page: Page,
  message: string,
  options?: { timeout?: number }
): Promise<string> {
  const timeout = options?.timeout || AI_TIMEOUT;

  // Count existing AI messages
  const aiMessages = page.locator('[data-testid="assistant-message"]');
  const initialCount = await aiMessages.count();

  // Find and fill chat input
  const chatInput = page.getByTestId('chat-input')
    .or(page.locator('textarea').first());
  await expect(chatInput).toBeVisible({ timeout: 15000 });
  await chatInput.click();
  await chatInput.fill(message);

  // Send
  const sendButton = page.getByRole('button', { name: /send/i })
    .or(page.locator('button[aria-label="Send message"]'));
  if (await sendButton.isEnabled({ timeout: 2000 }).catch(() => false)) {
    await sendButton.click();
  } else {
    await page.keyboard.press('Enter');
  }

  // Wait for new AI response
  await expect(async () => {
    const count = await aiMessages.count();
    expect(count).toBeGreaterThan(initialCount);
  }).toPass({ timeout });

  // Get latest response text
  const latestMessage = aiMessages.last();
  const text = await latestMessage.textContent();
  return text || '';
}

/**
 * Verify AI response contains expected content
 */
export function verifyAIResponse(response: string, expectations: {
  containsAny?: string[];
  containsAll?: string[];
  minLength?: number;
  hasPrice?: boolean;
}) {
  if (expectations.minLength) {
    expect(response.length).toBeGreaterThanOrEqual(expectations.minLength);
  }

  if (expectations.containsAny) {
    const found = expectations.containsAny.some(
      keyword => response.toLowerCase().includes(keyword.toLowerCase())
    );
    expect(found).toBe(true);
  }

  if (expectations.containsAll) {
    for (const keyword of expectations.containsAll) {
      expect(response.toLowerCase()).toContain(keyword.toLowerCase());
    }
  }

  if (expectations.hasPrice) {
    // Check for dollar amounts
    expect(response).toMatch(/\$[\d,]+/);
  }
}

/**
 * Navigate visualizer wizard through all steps
 */
export async function completeVisualizerWizard(
  page: Page,
  options?: {
    roomType?: string;
    style?: string;
    skipGenerate?: boolean;
  }
): Promise<void> {
  const roomType = options?.roomType || 'Kitchen';
  const style = options?.style || 'Modern';

  // Step 1: Upload photo
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeAttached({ timeout: 10000 });
  const buffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  await fileInput.setInputFiles({
    name: 'test-room.png',
    mimeType: 'image/png',
    buffer,
  });
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Mode selection - Quick Form
  await page.getByText('Quick Form').click();

  // Step 2: Select room type
  await expect(page.getByRole('button', { name: new RegExp(roomType, 'i') })).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: new RegExp(roomType, 'i') }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Step 3: Select style
  await expect(page.getByText(style).first()).toBeVisible({ timeout: 5000 });
  await page.getByText(style).first().click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Step 4: Generate
  if (!options?.skipGenerate) {
    const generateButton = page.getByRole('button', { name: /Generate Vision/i });
    await expect(generateButton).toBeVisible({ timeout: 5000 });
  }
}

/**
 * Check receptionist widget presence
 */
export async function checkReceptionistWidget(page: Page): Promise<{
  isPresent: boolean;
  isClickable: boolean;
}> {
  const widget = page.locator('[data-testid="receptionist-widget"]')
    .or(page.locator('.receptionist-widget'))
    .or(page.locator('[aria-label*="receptionist" i]'))
    .or(page.locator('[aria-label*="chat" i]').last());

  const isPresent = await widget.isVisible({ timeout: 5000 }).catch(() => false);
  let isClickable = false;

  if (isPresent) {
    try {
      await widget.click();
      isClickable = true;
      // Close it
      const closeButton = page.locator('[aria-label="Close"]').or(page.locator('button:has-text("×")'));
      await closeButton.click().catch(() => {});
    } catch {
      isClickable = false;
    }
  }

  return { isPresent, isClickable };
}
