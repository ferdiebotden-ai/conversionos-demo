/**
 * PRD 13.2: Visualizer Happy Path E2E Test
 *
 * STRICT TEST - Will FAIL if bugs exist. DO NOT make lenient.
 *
 * Scenario: Customer navigates Home -> Visualize -> Upload -> Select style -> Generate
 * Expected: 4 concepts displayed, images stored successfully
 */

import { test, expect } from '@playwright/test';
import {
  uploadTestImage,
  navigateVisualizerToConstraints,
  verifyVisualizationResult,
  assertNoErrors,
} from './helpers';

// Extended timeout for AI image generation (can take 90+ seconds)
test.setTimeout(180000);

test.describe('PRD 13.2: Visualizer Happy Path [STRICT]', () => {
  test('complete visualization flow generates and displays results', async ({ page }) => {
    // Step 1: Navigate to visualizer from home
    await page.goto('/');

    const visualizeLink = page.getByRole('link', { name: /Visualize Your Space/i });
    await expect(visualizeLink.first()).toBeVisible({ timeout: 10000 });
    await visualizeLink.first().click();

    // Step 2: Land on /visualizer page
    await expect(page).toHaveURL('/visualizer');
    await expect(page.getByRole('heading', { name: /Visualize Your/i })).toBeVisible();

    // Step 3: Navigate through wizard to constraints step
    const generateButton = await navigateVisualizerToConstraints(page);

    // Step 4: Click Generate Vision
    await generateButton.click();

    // Step 5: Wait for generation (shows loading state)
    // Must see loading indicator
    const loadingIndicator = page.getByText(/generating|processing|creating/i)
      .or(page.locator('[data-testid="generation-loading"]'));
    await expect(loadingIndicator.first()).toBeVisible({ timeout: 10000 });

    // Step 6: Results MUST appear - no storage errors
    await verifyVisualizationResult(page, 120000);

    // Step 7: Verify "Get a Quote" CTA is visible
    const quoteButton = page.getByRole('button', { name: /Get a Quote|Get Quote/i });
    await expect(quoteButton).toBeVisible({ timeout: 5000 });

    // Final check: No errors anywhere
    await assertNoErrors(page);
  });

  test('visualizer wizard navigation works correctly', async ({ page }) => {
    await page.goto('/visualizer');

    // Photo step: Next button disabled without upload
    const nextButton = page.getByRole('button', { name: 'Next', exact: true });
    await expect(nextButton).toBeDisabled({ timeout: 5000 });

    // Upload photo
    await uploadTestImage(page);

    // Next button now enabled
    await expect(nextButton).toBeEnabled({ timeout: 5000 });
    await nextButton.click();

    // Mode selection step: Must see both options
    await expect(page.getByText('Chat with AI')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Quick Form')).toBeVisible();

    // Select Quick Form mode
    await page.getByText('Quick Form').click();

    // Room type step: Must see options
    await expect(page.getByRole('button', { name: /Kitchen/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Bathroom/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Basement/i })).toBeVisible();

    // Select kitchen
    await page.getByRole('button', { name: /Kitchen/i }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Style step: Must see options
    await expect(page.getByText('Modern').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Farmhouse').first()).toBeVisible();

    // Select modern
    await page.getByText('Modern').first().click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Constraints step: Generate button must be visible
    const generateButton = page.getByRole('button', { name: /Generate Vision/i });
    await expect(generateButton).toBeVisible({ timeout: 5000 });
    await expect(generateButton).toBeEnabled();
  });

  test('back navigation preserves uploaded photo', async ({ page }) => {
    await page.goto('/visualizer');

    // Upload photo
    await uploadTestImage(page);

    // Go to mode selection step
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByText('Quick Form')).toBeVisible({ timeout: 5000 });

    // Select Quick Form and go to room step
    await page.getByText('Quick Form').click();
    await expect(page.getByRole('button', { name: /Kitchen/i })).toBeVisible({ timeout: 5000 });

    // Go back to mode selection
    await page.getByRole('button', { name: /Back/i }).click();
    await expect(page.getByText('Quick Form')).toBeVisible({ timeout: 5000 });

    // Go back to photo step (use Choose Different Photo button)
    const chooseDifferentPhoto = page.getByRole('button', { name: /Choose Different Photo/i });
    await chooseDifferentPhoto.click();

    // Photo should still be there (preview shown with Remove button)
    await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('img[alt="Uploaded room"]')).toBeVisible();

    // Back button disabled on first step
    await expect(page.getByRole('button', { name: /Back/i })).toBeDisabled();
  });

  test('visualizer displays trust indicators', async ({ page }) => {
    await page.goto('/visualizer');

    // Trust indicators must be visible
    await expect(page.getByText(/Free to use/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Generation time/i)).toBeVisible();
    await expect(page.getByText(/Your photos stay private/i)).toBeVisible();
  });

  test('file input accepts image types', async ({ page }) => {
    await page.goto('/visualizer');

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached({ timeout: 10000 });

    const accept = await fileInput.getAttribute('accept');
    expect(accept).toContain('image');
  });

  test('clicking Get Quote navigates to estimate page', async ({ page }) => {
    // This test requires mocking or using a known state with existing visualization
    // For now, verify the flow from visualizer page directly
    await page.goto('/visualizer');

    // Navigate through wizard
    await navigateVisualizerToConstraints(page);

    // Click Generate
    await page.getByRole('button', { name: /Generate Vision/i }).click();

    // Wait for results (extended timeout for AI)
    await verifyVisualizationResult(page, 120000);

    // Click Get a Quote
    const quoteButton = page.getByRole('button', { name: /Get a Quote|Get Quote/i });
    await quoteButton.click();

    // Must navigate to estimate page
    await expect(page).toHaveURL(/\/estimate/);
  });
});
