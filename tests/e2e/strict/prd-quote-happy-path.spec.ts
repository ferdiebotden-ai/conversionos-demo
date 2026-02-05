/**
 * PRD 13.2: Quote Happy Path E2E Test
 *
 * STRICT TEST - Will FAIL if bugs exist. DO NOT make lenient.
 *
 * Scenario: Customer navigates Home -> Get Quote -> Upload -> Answer questions -> Submit
 * Expected: Lead created, email sent, success state displayed
 */

import { test, expect } from '@playwright/test';
import {
  waitForChatReady,
  sendChatMessage,
  fillContactForm,
  verifySubmissionSuccess,
  assertNoErrors,
} from './helpers';

// Extended timeout for AI API calls
test.setTimeout(90000);

test.describe('PRD 13.2: Quote Happy Path [STRICT]', () => {
  test('complete quote request flow from home to submission', async ({ page }) => {
    // Step 1: Navigate to home page
    await page.goto('/');
    await expect(page).toHaveTitle(/AI Reno Demo/i);

    // Step 2: Click "Get a Free Quote" CTA
    const ctaButton = page.getByRole('link', { name: /Get a Free Quote|Get Quote|Start/i });
    await expect(ctaButton.first()).toBeVisible({ timeout: 10000 });
    await ctaButton.first().click();

    // Step 3: Land on /estimate page
    await expect(page).toHaveURL('/estimate');

    // Step 4: Chat interface loads with welcome message
    await waitForChatReady(page);
    const welcomeMessage = page.locator('text=/Hi|Hello|Welcome|renovation assistant/i');
    await expect(welcomeMessage.first()).toBeVisible({ timeout: 15000 });

    // Step 5: Send project details
    await sendChatMessage(page, 'I want to renovate my kitchen. It is about 200 square feet.');

    // Step 6: Send more details to trigger submit button
    await sendChatMessage(page, 'I want standard finishes and can start in 1-3 months.');

    // Step 7: Submit Request button MUST appear
    const submitButton = page.getByTestId('request-quote-button')
      .or(page.getByRole('button', { name: /Submit Request for Quote/i }));
    await expect(submitButton).toBeVisible({ timeout: 30000 });

    // Step 8: Click submit button
    await submitButton.click();

    // Step 9: Modal MUST open with review step
    const modal = page.getByTestId('submit-modal')
      .or(page.locator('[role="dialog"]'));
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Step 10: Click Continue to go to contact form
    const continueButton = page.getByRole('button', { name: /Continue/i });
    await expect(continueButton).toBeVisible({ timeout: 5000 });
    await continueButton.click();

    // Step 11: Fill contact information
    await fillContactForm(page, {
      name: 'Test User',
      email: 'testuser@example.com',
      phone: '555-123-4567',
    });

    // Step 12: Click Submit Request in modal
    const submitFormButton = page.getByTestId('submit-form-button')
      .or(page.getByRole('button', { name: /Submit Request/i }));
    await expect(submitFormButton).toBeVisible();
    await submitFormButton.click();

    // Step 13: Success state MUST appear - no errors allowed
    await verifySubmissionSuccess(page);

    // Final verification: No error messages anywhere
    await assertNoErrors(page);
  });

  test('submit button appears after providing project type', async ({ page }) => {
    await page.goto('/estimate');
    await waitForChatReady(page);

    // Single message with clear project details should trigger submit button
    await sendChatMessage(page, 'Kitchen renovation, 200 sqft, standard finish, starting in 3 months');

    // Submit button MUST appear within 30 seconds
    const submitButton = page.getByTestId('request-quote-button')
      .or(page.getByRole('button', { name: /Submit Request for Quote/i }));
    await expect(submitButton).toBeVisible({ timeout: 30000 });
  });

  test('contact form validates required fields', async ({ page }) => {
    await page.goto('/estimate');
    await waitForChatReady(page);

    // Quick conversation to get to submit
    await sendChatMessage(page, 'Kitchen renovation, 150 sqft');

    const submitButton = page.getByTestId('request-quote-button')
      .or(page.getByRole('button', { name: /Submit Request for Quote/i }));
    await expect(submitButton).toBeVisible({ timeout: 30000 });
    await submitButton.click();

    // Modal opens
    const modal = page.getByTestId('submit-modal').or(page.locator('[role="dialog"]'));
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Go to contact step
    const continueButton = page.getByRole('button', { name: /Continue/i });
    await continueButton.click();

    // Try to submit without filling required fields
    const submitFormButton = page.getByRole('button', { name: /Submit Request/i });
    await submitFormButton.click();

    // Error message MUST appear
    const errorMessage = page.getByText(/Please enter|required|valid email/i);
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('can navigate to estimate from service page', async ({ page }) => {
    await page.goto('/services/kitchen');

    // Find CTA on service page
    const ctaButton = page.getByRole('link', { name: /Get a Quote|Get Quote|Start/i });
    await expect(ctaButton.first()).toBeVisible({ timeout: 10000 });
    await ctaButton.first().click();

    // Must land on estimate page
    await expect(page).toHaveURL('/estimate');

    // Chat must load
    await waitForChatReady(page);
  });
});
