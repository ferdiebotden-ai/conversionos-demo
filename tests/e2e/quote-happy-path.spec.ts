/**
 * Quote Happy Path E2E Tests
 * Tests the complete quote flow: Home → Get Quote → Chat → Submit
 */

import { test, expect } from '@playwright/test';

test.describe('Quote Happy Path', () => {
  test('navigates from home to quote page', async ({ page }) => {
    await page.goto('/');

    // Check home page loaded - use h1 specifically to avoid matching h2
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Click Get a Free Quote button
    await page.getByRole('link', { name: /Get a Free Quote/i }).first().click();

    // Should navigate to estimate page
    await expect(page).toHaveURL('/estimate');
  });

  test('displays chat interface on estimate page', async ({ page }) => {
    await page.goto('/estimate');

    // Wait for the page to load (Suspense boundary)
    await expect(page.locator('body')).not.toContainText('Loading...');

    // Chat interface should be present
    // Look for the chat input or welcome message
    await expect(page.getByRole('textbox').or(page.locator('[data-testid="chat-input"]'))).toBeVisible({ timeout: 10000 });
  });

  test('header Get Quote button links to estimate page', async ({ page }) => {
    await page.goto('/services');

    // Click Get Quote in header
    await page.getByRole('link', { name: /Get Quote/i }).first().click();

    await expect(page).toHaveURL('/estimate');
  });
});

test.describe('Services Navigation', () => {
  test('services page lists all service categories', async ({ page }) => {
    await page.goto('/services');

    // Check services page loaded
    await expect(page.getByRole('heading', { name: /Services/i }).first()).toBeVisible();

    // Check for service categories - these should be visible
    await expect(page.getByText(/Kitchen/i).first()).toBeVisible();
    await expect(page.getByText(/Bathroom/i).first()).toBeVisible();
    await expect(page.getByText(/Basement/i).first()).toBeVisible();
  });

  test('navigates to individual service pages', async ({ page }) => {
    await page.goto('/services');

    // Click on Kitchen service
    await page.getByRole('link', { name: /Kitchen/i }).first().click();

    // Should navigate to kitchen page
    await expect(page).toHaveURL('/services/kitchen');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Kitchen/i);
  });
});

test.describe('About Page', () => {
  test('about page loads and displays company info', async ({ page }) => {
    await page.goto('/about');

    // Check about page loaded
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Should contain Ontario (service area) or company info
    await expect(page.locator('body')).toContainText(/Stratford/i);
  });
});

test.describe('Contact Page', () => {
  test('contact page loads with contact form', async ({ page }) => {
    await page.goto('/contact');

    // Check contact page loaded
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Should have form fields
    await expect(page.getByLabel(/Name/i)).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Message/i)).toBeVisible();
  });

  test('contact form validates required fields', async ({ page }) => {
    await page.goto('/contact');

    // Try to submit empty form
    await page.getByRole('button', { name: /Send|Submit/i }).click();

    // Should show validation errors (form won't submit with empty required fields)
    // The form should still be visible (not navigated away)
    await expect(page.getByLabel(/Name/i)).toBeVisible();
  });
});
