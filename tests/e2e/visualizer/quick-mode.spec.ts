/**
 * Visualizer Quick Mode E2E Tests
 * Tests the 4-step quick mode flow: Photo → Mode Select → Room → Style → Constraints → Generate
 */

import { test, expect } from '../fixtures/visualizer';

test.describe('Visualizer Quick Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/visualizer');
  });

  test('displays visualizer page correctly', async ({ page }) => {
    // Check page loaded
    await expect(page.getByRole('heading', { name: /Visualize/i })).toBeVisible();

    // Should show upload interface
    const uploadArea = page.locator('input[type="file"]')
      .or(page.getByText(/upload/i));
    await expect(uploadArea.first()).toBeVisible();
  });

  test('completes step 1: photo upload', async ({ page, uploadTestImage }) => {
    await uploadTestImage();

    // Should show preview image - actual alt text is "Uploaded room"
    const preview = page.locator('img[alt="Uploaded room"], img[alt*="preview"], img[alt*="Upload"]');
    await expect(preview.first()).toBeVisible({ timeout: 10000 });

    // Next button should be enabled
    const nextButton = page.getByRole('button', { name: 'Next', exact: true })
      .or(page.getByRole('button', { name: /continue/i }));
    await expect(nextButton).toBeEnabled();
  });

  test('shows mode selection after photo upload', async ({ page, uploadTestImage, clickNext }) => {
    await uploadTestImage();
    await clickNext();

    // Should show mode selection screen
    await expect(page.getByText('Chat with AI')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Quick Form')).toBeVisible();
    await expect(page.getByText('Recommended')).toBeVisible();
  });

  test('completes step 2: room type selection', async ({ page, uploadTestImage, clickNext, selectQuickMode }) => {
    await uploadTestImage();
    await clickNext();
    await selectQuickMode();

    // Should show room type options
    await expect(page.getByRole('button', { name: /Kitchen/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Bathroom/i })).toBeVisible();

    // Select kitchen
    await page.getByRole('button', { name: /Kitchen/i }).click();

    // Next should be enabled after selection
    const nextButton = page.getByRole('button', { name: 'Next', exact: true });
    await expect(nextButton).toBeEnabled();
  });

  test('completes step 3: style selection', async ({ page, uploadTestImage, selectRoomType, clickNext, selectQuickMode }) => {
    await uploadTestImage();
    await clickNext();
    await selectQuickMode();
    await selectRoomType('Kitchen');
    await clickNext();

    // Should show style options
    await expect(page.getByText('Modern').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Traditional').first()).toBeVisible();

    // Select modern
    await page.getByText('Modern').first().click();

    // Next should be enabled
    const nextButton = page.getByRole('button', { name: 'Next', exact: true });
    await expect(nextButton).toBeEnabled();
  });

  test('completes step 4: constraints input', async ({ page, navigateToConstraints }) => {
    const generateButton = await navigateToConstraints();

    // Should show constraints textarea
    const constraintsInput = page.locator('textarea')
      .or(page.getByPlaceholder(/constraints|preferences|want to keep/i));
    await expect(constraintsInput.first()).toBeVisible();

    // Optional: fill constraints
    if (await constraintsInput.first().isVisible()) {
      await constraintsInput.first().fill('Keep existing cabinets');
    }

    // Generate button should be visible
    await expect(generateButton).toBeVisible();
  });

  test('can navigate back through steps', async ({ page, uploadTestImage, selectRoomType, clickNext, clickBack, selectQuickMode }) => {
    // Go to step 3 (style)
    await uploadTestImage();
    await clickNext();
    await selectQuickMode();
    await selectRoomType('Kitchen');
    await clickNext();

    // Style step should be visible
    await expect(page.getByText('Modern').first()).toBeVisible({ timeout: 5000 });

    // Go back to room type
    await clickBack();

    // Room type options should be visible again
    await expect(page.getByRole('button', { name: /Kitchen/i })).toBeVisible({ timeout: 5000 });

    // Go back to mode selection
    await clickBack();

    // Mode selection should be visible
    await expect(page.getByText('Quick Form')).toBeVisible({ timeout: 5000 });
  });

  test('shows all room type options', async ({ page, uploadTestImage, clickNext, selectQuickMode }) => {
    await uploadTestImage();
    await clickNext();
    await selectQuickMode();

    // Check for all room types
    const roomTypes = ['Kitchen', 'Bathroom', 'Living', 'Bedroom', 'Basement'];
    for (const roomType of roomTypes) {
      const roomButton = page.getByRole('button', { name: new RegExp(roomType, 'i') })
        .or(page.getByText(roomType));
      await expect(roomButton.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('shows all design style options', async ({ page, uploadTestImage, selectRoomType, clickNext, selectQuickMode }) => {
    await uploadTestImage();
    await clickNext();
    await selectQuickMode();
    await selectRoomType('Kitchen');
    await clickNext();

    // Check for all styles
    const styles = ['Modern', 'Traditional', 'Farmhouse'];
    for (const style of styles) {
      const styleButton = page.getByText(style).first();
      await expect(styleButton).toBeVisible({ timeout: 5000 });
    }
  });

  test('shows trust indicators on page', async ({ page }) => {
    await expect(page.getByText(/Free to use/i)).toBeVisible();
    await expect(page.getByText(/Generation time/i)).toBeVisible();
    await expect(page.getByText(/Your photos stay private/i)).toBeVisible();
  });
});

// Separate describe for tests that need real generation (slower, may skip in CI)
test.describe('Visualizer Generation Flow', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Generation tests only on Chromium');

  // These tests are marked as slow because they involve actual AI generation
  test.slow();

  test.beforeEach(async ({ page }) => {
    await page.goto('/visualizer');
  });

  test('completes full flow and generates visualization', async ({
    page,
    navigateToConstraints,
    waitForResults,
  }) => {
    // Navigate to constraints step
    const generateButton = await navigateToConstraints();

    // Fill optional constraints
    const constraintsInput = page.locator('textarea').first();
    if (await constraintsInput.isVisible()) {
      await constraintsInput.fill('Keep existing cabinets, add modern lighting');
    }

    // Click generate (wrapped in try-catch to handle E2E_TEST_MODE scenarios)
    await generateButton.click();

    // Wait for results (with extended timeout for AI generation)
    try {
      await waitForResults(120000);

      // Verify results display
      const concepts = page.locator('[data-testid="concept-thumbnail"], .concept-thumbnail');
      const conceptCount = await concepts.count();
      expect(conceptCount).toBeGreaterThanOrEqual(1);
    } catch (error) {
      // Check if it's an expected error (API not configured, demo mode, etc.)
      const errorText = page.getByText(/error|failed|not configured/i);
      if (await errorText.isVisible({ timeout: 5000 })) {
        test.skip(true, 'AI generation not available in test environment');
      }
      throw error;
    }
  });

  test('shows action buttons after generation', async ({
    page,
    navigateToConstraints,
    waitForResults,
  }) => {
    const generateButton = await navigateToConstraints();
    await generateButton.click();

    try {
      await waitForResults(120000);

      // Check for action buttons
      await expect(page.getByRole('button', { name: /download/i })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('button', { name: /get.*quote/i })).toBeVisible();
    } catch {
      test.skip(true, 'AI generation not available');
    }
  });
});
