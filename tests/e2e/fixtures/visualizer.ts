/**
 * Visualizer Test Fixtures
 * Reusable test utilities for visualizer E2E tests
 */

import { test as base, expect, Page, Locator } from '@playwright/test';

// Test image buffer (1x1 pixel PNG)
export const TEST_IMAGE_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// 10x10 pink PNG for more realistic testing
export const TEST_IMAGE_10X10_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQYV2PctIng/88fDDAMo4rwAwCPrxn7/RClAgAAAABJRU5ErkJggg==',
  'base64'
);

/**
 * Upload a test image to the visualizer
 */
async function uploadTestImage(page: Page) {
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeAttached({ timeout: 10000 });

  await fileInput.setInputFiles({
    name: 'test-kitchen.png',
    mimeType: 'image/png',
    buffer: TEST_IMAGE_10X10_BUFFER,
  });

  // Wait for preview to appear - actual alt text is "Uploaded room"
  const previewSelectors = [
    'img[alt="Uploaded room"]',
    'img[alt*="preview"]',
    'img[alt*="Upload"]',
    '[data-testid="image-preview"]',
  ];
  const preview = page.locator(previewSelectors.join(', '));
  await expect(preview.first()).toBeVisible({ timeout: 10000 });
}

/**
 * Select a room type in the visualizer
 */
async function selectRoomType(page: Page, roomType: string) {
  // Try both data attribute and text matching
  const roomCard = page.locator(`[data-room-type="${roomType.toLowerCase()}"]`)
    .or(page.getByRole('button', { name: new RegExp(roomType, 'i') }))
    .or(page.getByText(roomType, { exact: true }));
  await expect(roomCard.first()).toBeVisible({ timeout: 5000 });
  await roomCard.first().click();
  // Wait for selection animation
  await page.waitForTimeout(300);
}

/**
 * Select a design style in the visualizer
 */
async function selectStyle(page: Page, style: string) {
  const styleCard = page.locator(`[data-style="${style.toLowerCase()}"]`)
    .or(page.getByRole('button', { name: new RegExp(style, 'i') }))
    .or(page.getByText(style, { exact: true }));
  await expect(styleCard.first()).toBeVisible({ timeout: 5000 });
  await styleCard.first().click();
  // Wait for selection animation
  await page.waitForTimeout(300);
}

/**
 * Click the Next button in the wizard
 */
async function clickNext(page: Page) {
  const nextButton = page.getByRole('button', { name: 'Next', exact: true })
    .or(page.getByRole('button', { name: /continue/i }));
  await expect(nextButton).toBeEnabled({ timeout: 5000 });
  await nextButton.click();
  // Wait for step transition
  await page.waitForTimeout(300);
}

/**
 * Select quick mode in the mode selection screen
 */
async function selectQuickMode(page: Page) {
  const quickFormButton = page.getByText('Quick Form');
  await expect(quickFormButton).toBeVisible({ timeout: 5000 });
  await quickFormButton.click();
  await page.waitForTimeout(300);
}

/**
 * Click the Back button in the wizard
 */
async function clickBack(page: Page) {
  const backButton = page.getByRole('button', { name: /back/i })
    .or(page.getByRole('button', { name: /previous/i }));
  await backButton.click();
  await page.waitForTimeout(300);
}

/**
 * Navigate to constraints step (complete all previous steps)
 */
async function navigateToConstraints(page: Page) {
  // Step 1: Upload photo
  await uploadTestImage(page);
  await clickNext(page);

  // Step 1.5: Mode selection - select quick mode
  await selectQuickMode(page);

  // Step 2: Select room type
  await selectRoomType(page, 'Kitchen');
  await clickNext(page);

  // Step 3: Select style
  await selectStyle(page, 'Modern');
  await clickNext(page);

  // Now on constraints step
  const generateButton = page.getByRole('button', { name: /generate/i });
  await expect(generateButton).toBeVisible({ timeout: 5000 });
  return generateButton;
}

/**
 * Wait for visualization results to appear
 */
async function waitForResults(page: Page, timeout = 90000) {
  // Result display should appear
  const resultDisplay = page.getByTestId('visualization-result')
    .or(page.getByText(/Your Vision is Ready/i));
  await expect(resultDisplay.first()).toBeVisible({ timeout });

  // Concept thumbnails should appear
  const concepts = page.locator('[data-testid="concept-thumbnail"]')
    .or(page.locator('.concept-thumbnail'))
    .or(page.locator('img[alt*="Concept"]'));
  await expect(concepts.first()).toBeVisible({ timeout: 10000 });
}

/**
 * Extended test fixture with visualizer helpers
 */
export const test = base.extend<{
  uploadTestImage: () => Promise<void>;
  selectRoomType: (roomType: string) => Promise<void>;
  selectStyle: (style: string) => Promise<void>;
  clickNext: () => Promise<void>;
  clickBack: () => Promise<void>;
  selectQuickMode: () => Promise<void>;
  navigateToConstraints: () => Promise<Locator>;
  waitForResults: (timeout?: number) => Promise<void>;
}>({
  uploadTestImage: async ({ page }, use) => {
    await use(() => uploadTestImage(page));
  },
  selectRoomType: async ({ page }, use) => {
    await use((roomType: string) => selectRoomType(page, roomType));
  },
  selectStyle: async ({ page }, use) => {
    await use((style: string) => selectStyle(page, style));
  },
  clickNext: async ({ page }, use) => {
    await use(() => clickNext(page));
  },
  clickBack: async ({ page }, use) => {
    await use(() => clickBack(page));
  },
  selectQuickMode: async ({ page }, use) => {
    await use(() => selectQuickMode(page));
  },
  navigateToConstraints: async ({ page }, use) => {
    await use(() => navigateToConstraints(page));
  },
  waitForResults: async ({ page }, use) => {
    await use((timeout?: number) => waitForResults(page, timeout));
  },
});

export { expect };
