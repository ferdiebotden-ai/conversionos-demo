/**
 * Autonomous Test Helpers
 * Shared utilities for the autonomous testing pipeline
 * Extends existing strict helpers with autonomous-specific functionality
 */

import { Page, expect, test, BrowserContext } from '@playwright/test';
import testTargets from '../../config/test-targets.json';

// Re-export existing strict helpers
export {
  TEST_IMAGE_BUFFER,
  TEST_IMAGE_10X10_BUFFER,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  uploadTestImage,
  waitForChatReady,
  sendChatMessage,
  fillContactForm,
  navigateVisualizerToConstraints,
  loginAsAdmin,
  assertNoErrors,
  waitForElement,
  verifySubmissionSuccess,
  verifyVisualizationResult,
} from '../../../tests/e2e/strict/helpers';

/** Target URL from environment */
export const TARGET_URL = process.env['TEST_TARGET_URL'] || 'http://localhost:3000';

/** All public routes from config */
export const PUBLIC_ROUTES = testTargets.public;

/** All admin routes from config */
export const ADMIN_ROUTES = testTargets.admin;

/** All admin detail routes */
export const ADMIN_DETAIL_ROUTES = testTargets.adminDetail;

/** All API routes */
export const API_ROUTES = testTargets.api;

/** Viewports for visual testing */
export const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
} as const;

/** Check if target is production (not localhost) */
export function isProductionTarget(): boolean {
  return !TARGET_URL.includes('localhost');
}

/**
 * Navigate to a page and wait for it to load
 * Handles both relative and absolute URLs
 */
export async function navigateAndWait(page: Page, path: string, options?: {
  waitForSelector?: string;
  timeout?: number;
}) {
  const url = path.startsWith('http') ? path : path;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: options?.timeout || 30000 });

  if (options?.waitForSelector) {
    await page.waitForSelector(options.waitForSelector, { timeout: options?.timeout || 10000 });
  }

  // Wait for any loading indicators to disappear
  const loaders = page.locator('.animate-pulse, .animate-spin, [data-loading="true"]');
  await expect(loaders).toHaveCount(0, { timeout: 15000 }).catch(() => {
    // Some pages may have persistent animations
  });
}

/**
 * Get all links on the current page
 */
export async function getAllLinks(page: Page): Promise<{ href: string; text: string }[]> {
  return page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    return links.map(link => ({
      href: (link as HTMLAnchorElement).href,
      text: link.textContent?.trim() || '',
    }));
  });
}

/**
 * Check if a URL returns a successful status code
 */
export async function checkUrlStatus(page: Page, url: string): Promise<{
  url: string;
  status: number;
  ok: boolean;
}> {
  try {
    const response = await page.request.get(url, { timeout: 10000 });
    return { url, status: response.status(), ok: response.ok() };
  } catch {
    return { url, status: 0, ok: false };
  }
}

/**
 * Wait for network to be idle (no pending requests)
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch {
    // Network may never fully idle on some pages with websockets/polling
  }
}

/**
 * Login as admin and return to a specific page
 * Reuses session cookie if already logged in
 */
export async function ensureAdminLoggedIn(page: Page, returnTo?: string) {
  // Check if already on admin page
  const url = page.url();
  if (url.includes('/admin') && !url.includes('/admin/login')) {
    if (returnTo) await page.goto(returnTo);
    return;
  }

  // Try navigating to admin - if redirected to login, do login
  await page.goto('/admin');
  await page.waitForURL(/\/admin/, { timeout: 5000 }).catch(() => {});

  if (page.url().includes('/admin/login')) {
    const { loginAsAdmin } = await import('../../../tests/e2e/strict/helpers');
    await loginAsAdmin(page);
  }

  if (returnTo) {
    await page.goto(returnTo);
  }
}

/**
 * Soft assert: logs failure but doesn't throw
 * Useful for collecting multiple failures in a single test
 */
export function createSoftAssert() {
  const failures: string[] = [];

  return {
    check(condition: boolean, message: string) {
      if (!condition) {
        failures.push(message);
        console.warn(`SOFT ASSERT FAIL: ${message}`);
      }
    },
    async expectVisible(page: Page, selector: string, description: string) {
      try {
        await expect(page.locator(selector).first()).toBeVisible({ timeout: 5000 });
      } catch {
        failures.push(`Expected visible: ${description} (${selector})`);
        console.warn(`SOFT ASSERT FAIL: ${description} not visible`);
      }
    },
    flush() {
      if (failures.length > 0) {
        throw new Error(`${failures.length} soft assertion(s) failed:\n${failures.map((f, i) => `  ${i + 1}. ${f}`).join('\n')}`);
      }
    },
    get failures() { return [...failures]; }
  };
}

/**
 * Generate a unique test identifier
 */
export function testId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Make an API request with proper base URL
 */
export async function apiRequest(page: Page, method: string, path: string, body?: unknown) {
  const url = path.startsWith('/') ? path : `/${path}`;
  const options: Parameters<typeof page.request.fetch>[1] = {
    method,
    timeout: 15000,
  };
  if (body) {
    options.data = body;
    options.headers = { 'Content-Type': 'application/json' };
  }
  return page.request.fetch(url, options);
}
