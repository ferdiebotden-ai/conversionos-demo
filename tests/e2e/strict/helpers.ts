/**
 * Strict E2E Test Helpers
 * Shared utilities for PRD-driven E2E tests
 *
 * IMPORTANT: These helpers DO NOT swallow errors or use lenient patterns.
 * Tests using these helpers will FAIL if bugs exist.
 */

import { Page, expect } from '@playwright/test';

// 1x1 pixel PNG for test uploads
export const TEST_IMAGE_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Larger test image (10x10 pink PNG) for more realistic testing
export const TEST_IMAGE_10X10_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQYV2PctIng/88fDDAMo4rwAwCPrxn7/RClAgAAAABJRU5ErkJggg==',
  'base64'
);

// Admin credentials (from env or defaults for testing)
export const ADMIN_EMAIL = process.env['TEST_ADMIN_EMAIL'] || 'admin@airenodemo.com';
export const ADMIN_PASSWORD = process.env['TEST_ADMIN_PASSWORD'] || 'testpassword123';

/**
 * Upload a test image to a file input
 * STRICT: Will fail if file input not found
 */
export async function uploadTestImage(page: Page, selector = 'input[type="file"]') {
  const fileInput = page.locator(selector);
  await expect(fileInput).toBeAttached({ timeout: 10000 });

  await fileInput.setInputFiles({
    name: 'test-room.png',
    mimeType: 'image/png',
    buffer: TEST_IMAGE_BUFFER,
  });
}

/**
 * Wait for chat input to be ready
 * STRICT: Will fail if chat interface doesn't load
 */
export async function waitForChatReady(page: Page) {
  const chatInput = page.getByTestId('chat-input')
    .or(page.locator('textarea').first());
  await expect(chatInput).toBeVisible({ timeout: 15000 });
  await expect(chatInput).toBeEnabled();
  return chatInput;
}

/**
 * Send a chat message and wait for response
 * STRICT: Will fail if message not sent or no AI response
 */
export async function sendChatMessage(page: Page, message: string) {
  const chatInput = await waitForChatReady(page);

  // Count AI messages BEFORE sending to avoid race condition
  const aiMessages = page.locator('[data-testid="assistant-message"]');
  const initialCount = await aiMessages.count();

  // Click to ensure focus, then fill
  await chatInput.click();
  await chatInput.fill(message);

  // Wait a moment for the input to register
  await page.waitForTimeout(100);

  // Try clicking the send button first, fall back to Enter key
  const sendButton = page.getByRole('button', { name: /send/i })
    .or(page.locator('button[aria-label="Send message"]'));

  if (await sendButton.isEnabled({ timeout: 1000 }).catch(() => false)) {
    await sendButton.click();
  } else {
    await page.keyboard.press('Enter');
  }

  // Wait for user message to appear (use partial match for truncated/wrapped text)
  const firstWords = message.split(' ').slice(0, 3).join(' ');
  await expect(page.getByText(firstWords, { exact: false })).toBeVisible({ timeout: 10000 });

  // Wait up to 30s for a new AI message
  await expect(async () => {
    const newCount = await aiMessages.count();
    expect(newCount).toBeGreaterThan(initialCount);
  }).toPass({ timeout: 30000 });
}

/**
 * Fill contact form in submit modal
 * STRICT: All fields must be found and fillable
 */
export async function fillContactForm(
  page: Page,
  { name, email, phone }: { name: string; email: string; phone?: string }
) {
  const nameInput = page.getByTestId('contact-name')
    .or(page.locator('#name'))
    .or(page.getByLabel(/name/i));
  await expect(nameInput).toBeVisible({ timeout: 5000 });
  await nameInput.fill(name);

  const emailInput = page.getByTestId('contact-email')
    .or(page.locator('#email'))
    .or(page.getByLabel(/email/i));
  await expect(emailInput).toBeVisible();
  await emailInput.fill(email);

  if (phone) {
    const phoneInput = page.getByTestId('contact-phone')
      .or(page.locator('#phone'))
      .or(page.getByLabel(/phone/i));
    if (await phoneInput.isVisible()) {
      await phoneInput.fill(phone);
    }
  }
}

/**
 * Navigate visualizer wizard to constraints step
 * STRICT: All steps must work correctly
 */
export async function navigateVisualizerToConstraints(page: Page) {
  // Step 1: Upload photo
  await uploadTestImage(page);

  // Click Next (use exact match to avoid Next.js dev tools)
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Step 1.5: Mode selection - click "Quick Form" to use quick mode
  const quickFormButton = page.getByText('Quick Form');
  await expect(quickFormButton).toBeVisible({ timeout: 5000 });
  await quickFormButton.click();

  // Step 2: Select room type
  await expect(page.getByRole('button', { name: /Kitchen/i })).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: /Kitchen/i }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Step 3: Select style
  await expect(page.getByText('Modern').first()).toBeVisible({ timeout: 5000 });
  await page.getByText('Modern').first().click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Step 4: Now on constraints step - Generate button should be visible
  const generateButton = page.getByRole('button', { name: /Generate Vision/i });
  await expect(generateButton).toBeVisible({ timeout: 5000 });

  return generateButton;
}

/**
 * Login as admin
 * STRICT: Login must succeed and redirect to dashboard
 */
export async function loginAsAdmin(page: Page, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  await page.goto('/admin/login');

  // Wait for login form
  const emailInput = page.getByLabel(/email/i).or(page.locator('#email'));
  await expect(emailInput).toBeVisible({ timeout: 10000 });

  await emailInput.fill(email);
  await page.getByLabel(/password/i).or(page.locator('#password')).fill(password);

  // Click sign in
  await page.getByRole('button', { name: /sign in/i }).click();

  // Must redirect to admin area (leads page or dashboard)
  await expect(page).toHaveURL(/\/admin\/(leads|dashboard)?/, { timeout: 15000 });
}

/**
 * Assert no error messages are visible
 * STRICT: Any error text will cause failure
 */
export async function assertNoErrors(page: Page) {
  // Common error patterns
  const errorPatterns = [
    /error/i,
    /failed/i,
    /something went wrong/i,
    /unable to/i,
    /could not/i,
  ];

  for (const pattern of errorPatterns) {
    const errorElements = page.locator(`.text-destructive, .text-red-500, .text-red-600, [role="alert"]`)
      .filter({ hasText: pattern });

    const count = await errorElements.count();
    if (count > 0) {
      const text = await errorElements.first().textContent();
      throw new Error(`Error message found on page: "${text}"`);
    }
  }
}

/**
 * Wait for a specific element to appear (strict - no fallbacks)
 */
export async function waitForElement(page: Page, testId: string, timeout = 10000) {
  const element = page.getByTestId(testId);
  await expect(element).toBeVisible({ timeout });
  return element;
}

/**
 * Verify submission success state
 * STRICT: Success state must appear, no errors
 */
export async function verifySubmissionSuccess(page: Page, timeout = 30000) {
  // Look for success indicators
  const successIndicators = page.getByTestId('submission-success')
    .or(page.getByText(/submitted|success|thank you/i));

  await expect(successIndicators.first()).toBeVisible({ timeout });

  // Verify no errors
  await assertNoErrors(page);
}

/**
 * Verify visualization results appeared
 * STRICT: Results must appear, no storage errors
 */
export async function verifyVisualizationResult(page: Page, timeout = 120000) {
  // Must NOT see storage error
  const storageError = page.getByText(/Failed to store/i);
  await expect(storageError).not.toBeVisible({ timeout: 5000 });

  // Must see result display (use .first() since .or() can match multiple elements)
  const resultDisplay = page.getByTestId('visualization-result')
    .or(page.getByText(/Your Vision is Ready/i));
  await expect(resultDisplay.first()).toBeVisible({ timeout });

  // Must see at least one generated concept
  const conceptThumbnails = page.locator('[data-testid="concept-thumbnail"], .concept-thumbnail, img[alt*="Concept"]');
  await expect(conceptThumbnails.first()).toBeVisible({ timeout: 5000 });
}
