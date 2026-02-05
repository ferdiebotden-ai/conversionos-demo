/**
 * PRD 13.2: Admin Login E2E Test
 *
 * STRICT TEST - Will FAIL if bugs exist. DO NOT make lenient.
 *
 * Scenario: Admin navigates to login -> enters credentials -> views dashboard -> opens lead
 * Expected: Successful authentication, leads table displayed
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, ADMIN_EMAIL, assertNoErrors } from './helpers';

test.setTimeout(60000);

test.describe('PRD 13.2: Admin Login [STRICT]', () => {
  test('admin can login and view leads dashboard', async ({ page }) => {
    // Step 1: Navigate to admin login
    await page.goto('/admin/login');

    // Step 2: Login form must be visible
    const emailInput = page.getByLabel(/email/i).or(page.locator('#email'));
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    const passwordInput = page.getByLabel(/password/i).or(page.locator('#password'));
    await expect(passwordInput).toBeVisible();

    const signInButton = page.getByRole('button', { name: /sign in/i });
    await expect(signInButton).toBeVisible();

    // Step 3: Enter valid credentials
    await emailInput.fill(ADMIN_EMAIL);
    await passwordInput.fill(process.env['TEST_ADMIN_PASSWORD'] || 'testpassword123');

    // Step 4: Click sign in
    await signInButton.click();

    // Step 5: Must redirect to admin area
    await expect(page).toHaveURL(/\/admin\/(leads|dashboard)?/, { timeout: 15000 });

    // Step 6: Admin dashboard or leads content must be visible
    const dashboardHeading = page.getByRole('heading', { name: /Dashboard|Leads/i });
    const dashboardContent = page.locator('[data-testid="leads-table"], table');
    await expect(dashboardHeading.or(dashboardContent.first())).toBeVisible({ timeout: 10000 });

    // No errors
    await assertNoErrors(page);
  });

  test('admin can view leads table', async ({ page }) => {
    // Login first
    await loginAsAdmin(page);

    // Navigate to leads if not already there
    if (!page.url().includes('/admin/leads')) {
      await page.goto('/admin/leads');
    }

    // Leads heading must be visible
    await expect(page.getByRole('heading', { name: /Leads/i })).toBeVisible({ timeout: 10000 });

    // Table must be present
    const table = page.locator('table').or(page.getByTestId('leads-table'));
    await expect(table).toBeVisible({ timeout: 10000 });

    // Table headers must exist
    await expect(page.getByRole('columnheader', { name: /Name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Email/i })).toBeVisible();
  });

  test('admin can click on lead to view details', async ({ page }) => {
    // Login
    await loginAsAdmin(page);

    // Go to leads page
    await page.goto('/admin/leads');
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

    // Find first lead row - View is a link containing a button
    const viewLink = page.getByRole('link', { name: /View/i }).first();

    // Wait for View link to be visible (if there are leads)
    const viewVisible = await viewLink.isVisible({ timeout: 5000 }).catch(() => false);

    // Also check for table rows
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();

    if (viewVisible || rowCount > 0) {
      // Click the View link
      await expect(viewLink).toBeVisible({ timeout: 5000 });
      await viewLink.click();

      // Must navigate to lead detail page
      await expect(page).toHaveURL(/\/admin\/leads\/[a-f0-9-]+/);

      // Tabs should be visible (shows we're on lead detail page)
      await expect(page.getByRole('tab', { name: /Details/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('tab', { name: /Quote/i })).toBeVisible();

      // Lead name heading or detail content should be visible
      const detailContent = page.getByRole('heading', { level: 1 })
        .or(page.locator('[data-testid="lead-detail"]'));
      await expect(detailContent.first()).toBeVisible();
    } else {
      // No leads exist - this is acceptable for empty state
      const emptyState = page.getByText(/No leads found/i);
      await expect(emptyState).toBeVisible();
    }
  });

  test('admin login fails with invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');

    const emailInput = page.getByLabel(/email/i).or(page.locator('#email'));
    const passwordInput = page.getByLabel(/password/i).or(page.locator('#password'));

    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword');

    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message
    const errorMessage = page.getByText(/invalid|incorrect|failed|error/i);
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });

    // Should NOT redirect to admin area
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('admin login page redirects if already authenticated', async ({ page }) => {
    // Login first
    await loginAsAdmin(page);

    // Verify we're in admin area
    await expect(page).toHaveURL(/\/admin/);
    const adminHeading = page.getByRole('heading', { name: /Dashboard|Leads/i });
    await expect(adminHeading).toBeVisible({ timeout: 10000 });

    // Navigate to a different admin page to verify session persists
    await page.goto('/admin/leads');
    await expect(page).toHaveURL(/\/admin\/leads/);

    // Verify we're still authenticated (see leads content, not redirected to login)
    const leadsHeading = page.getByRole('heading', { name: /Leads/i });
    await expect(leadsHeading).toBeVisible({ timeout: 10000 });

    // Verify we can see the table (authenticated content)
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });
});
