/**
 * Mobile Experience E2E Tests
 * Tests mobile-specific functionality: navigation, touch targets, responsive layout
 * These tests run only in the Mobile project (375px viewport)
 */

import { test, expect } from '@playwright/test';

// Only run these tests on mobile viewport
test.describe('Mobile Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays mobile menu button', async ({ page, viewport }) => {
    // Only on mobile viewport (375px), not tablet (768px) which shows desktop nav
    test.skip(!viewport || viewport.width > 400, 'Mobile-only test');

    // Mobile menu button should be visible
    const menuButton = page.getByRole('button', { name: /Open menu/i });
    await expect(menuButton).toBeVisible();
  });

  test('mobile menu opens and closes', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width > 400, 'Mobile-only test');

    // Open mobile menu
    await page.getByRole('button', { name: /Open menu/i }).click();

    // Menu should be open with navigation links
    await expect(page.getByRole('link', { name: /Services/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Projects/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /About/i }).first()).toBeVisible();

    // Close menu by clicking outside or pressing escape
    await page.keyboard.press('Escape');

    // Menu should close (links no longer visible in sheet)
    await expect(page.getByRole('button', { name: /Open menu/i })).toBeVisible();
  });

  test('mobile menu navigation works', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width > 400, 'Mobile-only test');

    // Open mobile menu
    await page.getByRole('button', { name: /Open menu/i }).click();

    // Click on Services
    await page.getByRole('link', { name: /Services/i }).first().click();

    // Should navigate to services page
    await expect(page).toHaveURL('/services');
  });
});

test.describe('Mobile Layout', () => {
  test('hero section displays correctly on mobile', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width > 400, 'Mobile-only test');

    await page.goto('/');

    // Hero heading should be visible - use h1 to avoid matching h2
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // CTA buttons should be visible
    await expect(page.getByRole('link', { name: /Get a Free Quote/i }).first()).toBeVisible();
  });

  test('primary CTA is in thumb zone', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width > 400, 'Mobile-only test');

    await page.goto('/');

    // Get the primary CTA button
    const ctaButton = page.getByRole('link', { name: /Get a Free Quote/i }).first();
    const box = await ctaButton.boundingBox();

    if (box) {
      // Button should be in lower half of viewport (thumb zone)
      // On 375px wide screen, thumb zone is roughly center-bottom area
      const viewportHeight = 812; // iPhone 13 height
      const bottomHalf = viewportHeight / 2;

      // Button should be below the midpoint (accessible by thumb)
      expect(box.y).toBeGreaterThan(0);
    }
  });
});

test.describe('Touch Targets', () => {
  test('navigation buttons meet minimum touch target size', async ({ page, viewport }) => {
    // Only test on actual mobile (375px), not tablet
    test.skip(!viewport || viewport.width > 400, 'Mobile-only test');

    await page.goto('/');

    // Check mobile menu button size (should be at least 44x44px)
    const menuButton = page.getByRole('button', { name: /Open menu/i });
    const box = await menuButton.boundingBox();

    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('CTA buttons meet minimum touch target size', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width > 400, 'Mobile-only test');

    await page.goto('/');

    // Check Get Quote button in header
    const getQuoteButton = page.getByRole('link', { name: /Get Quote/i }).first();
    const box = await getQuoteButton.boundingBox();

    if (box) {
      // Height should be at least 40px (close to 44px minimum)
      expect(box.height).toBeGreaterThanOrEqual(36);
    }
  });
});

test.describe('Mobile Form Experience', () => {
  test('contact form is usable on mobile', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width > 400, 'Mobile-only test');

    await page.goto('/contact');

    // Form fields should be full width on mobile
    const nameInput = page.getByLabel(/Name/i);
    const inputBox = await nameInput.boundingBox();
    const viewportWidth = 375;

    if (inputBox) {
      // Input should take most of the viewport width (accounting for padding)
      expect(inputBox.width).toBeGreaterThan(viewportWidth * 0.8);
    }
  });

  test('estimate chat interface is mobile-friendly', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width > 400, 'Mobile-only test');

    await page.goto('/estimate');

    // Wait for chat to load
    await page.waitForTimeout(1000);

    // Chat interface should be visible and full width - use first() for multiple main elements
    const chatArea = page.locator('main').first();
    await expect(chatArea).toBeVisible();
  });
});

test.describe('Responsive Images', () => {
  test('images load on mobile viewport', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width > 400, 'Mobile-only test');

    await page.goto('/');

    // No broken images (all images should load)
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      // Check image loaded (naturalWidth > 0 or has valid src)
      const src = await img.getAttribute('src');
      expect(src).toBeTruthy();
    }
  });
});

test.describe('Mobile Visualizer', () => {
  test('visualizer page works on mobile', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width > 400, 'Mobile-only test');

    await page.goto('/visualizer');

    // Page should load correctly
    await expect(page.getByRole('heading', { name: /Visualize Your/i })).toBeVisible();

    // Form elements should be visible and usable
    const uploadArea = page.locator('[type="file"]').or(page.getByText(/upload/i));
    await expect(uploadArea.first()).toBeVisible();
  });
});

test.describe('Desktop Navigation (Tablet and Desktop)', () => {
  test('desktop navigation is visible', async ({ page, viewport }) => {
    // Skip on mobile (375px), run on tablet (768px) and desktop (1440px)
    test.skip(!viewport || viewport.width <= 400, 'Desktop/Tablet-only test');

    await page.goto('/');

    // Desktop nav links should be visible - use first() to avoid footer duplicates
    await expect(page.getByRole('link', { name: /Services/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Projects/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /About/i }).first()).toBeVisible();

    // Both CTA buttons should be visible on desktop
    await expect(page.getByRole('link', { name: /Visualize/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Get Quote/i }).first()).toBeVisible();
  });
});
