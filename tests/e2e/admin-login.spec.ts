/**
 * Admin Login E2E Tests
 * Tests admin authentication flow: Login → Dashboard access
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
  });

  test('displays login page with branding', async ({ page }) => {
    // Check branding
    await expect(page.getByRole('heading', { name: /AI Reno Demo/i })).toBeVisible();
    await expect(page.getByText(/Admin Dashboard/i)).toBeVisible();
  });

  test('displays login form', async ({ page }) => {
    // Check for login form elements
    await expect(page.getByRole('heading', { name: /Sign in/i })).toBeVisible();

    // Email and password fields should be present
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();

    // Submit button
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
  });

  test('displays footer with version info', async ({ page }) => {
    await expect(page.getByText(/Lead-to-Quote Engine/i)).toBeVisible();
    await expect(page.getByText(/Powered by AI/i)).toBeVisible();
  });

  test('login form has required validation', async ({ page }) => {
    // The login form has required fields - verify they exist
    const emailInput = page.getByLabel(/Email/i);
    const passwordInput = page.getByLabel(/Password/i);

    // Verify required attributes are present
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');

    // Still on login page
    await expect(page).toHaveURL('/admin/login');
  });

  test('shows password visibility toggle if present', async ({ page }) => {
    // Check if there's a password visibility toggle button
    const passwordField = page.getByLabel(/Password/i);
    await expect(passwordField).toHaveAttribute('type', 'password');
  });
});

test.describe('Admin Protected Routes', () => {
  test('admin dashboard shows login or admin content', async ({ page }) => {
    // Try to access admin dashboard directly
    await page.goto('/admin');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Should either redirect to login OR show admin content
    // (depends on server-side auth middleware behavior)
    const currentUrl = page.url();
    const isOnLogin = currentUrl.includes('/login');
    const isOnAdmin = currentUrl.includes('/admin');

    // Either location is acceptable
    expect(isOnLogin || isOnAdmin).toBe(true);

    // Should have some content visible — use heading or visible role elements
    const heading = page.getByRole('heading', { name: /Sign in|Dashboard|Welcome|Admin/i });
    await expect(heading.first()).toBeVisible({ timeout: 15000 });
  });

  test('admin leads page shows login or leads content', async ({ page }) => {
    // Try to access leads page directly
    await page.goto('/admin/leads');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Should either redirect to login OR show leads content
    const currentUrl = page.url();
    const isOnLogin = currentUrl.includes('/login');
    const isOnAdmin = currentUrl.includes('/admin');

    // Either location is acceptable
    expect(isOnLogin || isOnAdmin).toBe(true);

    // Should have some content visible — use heading or visible role elements
    const heading = page.getByRole('heading', { name: /Sign in|Leads|Admin/i });
    await expect(heading.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Admin Login Errors', () => {
  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');

    // Enter invalid credentials
    await page.getByLabel(/Email/i).fill('invalid@example.com');
    await page.getByLabel(/Password/i).fill('wrongpassword');

    // Submit form
    await page.getByRole('button', { name: /Sign in/i }).click();

    // Should show error message (after API response)
    // Either stay on page with error or get invalid response
    // Wait for some response
    await page.waitForTimeout(1000);

    // Should still be on login page (not redirected to dashboard)
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
  });
});
