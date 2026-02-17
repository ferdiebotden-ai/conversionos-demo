/**
 * Visual Regression Testing
 * Screenshot capture and comparison utilities
 */

import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import visualThresholds from '../../config/visual-thresholds.json';

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../scripts/screenshots');
const BASELINES_DIR = path.join(SCREENSHOTS_DIR, 'baselines');
const CURRENT_DIR = path.join(SCREENSHOTS_DIR, 'current');

/** Get viewport name from page dimensions */
function getViewportName(page: Page): string {
  const viewport = page.viewportSize();
  if (!viewport) return 'desktop';
  if (viewport.width <= 375) return 'mobile';
  if (viewport.width <= 768) return 'tablet';
  return 'desktop';
}

/** Get threshold for a specific page path */
function getThreshold(pagePath: string): number {
  // Check AI pages (higher threshold)
  if (visualThresholds.aiPages.paths.some(p => pagePath.startsWith(p))) {
    return visualThresholds.aiPages.maxDiffPercentage;
  }
  // Check dynamic pages
  if (visualThresholds.dynamicPages.paths.some(p => pagePath.startsWith(p))) {
    return visualThresholds.dynamicPages.maxDiffPercentage;
  }
  return visualThresholds.default.maxDiffPercentage;
}

/** Sanitize path for use as filename */
function sanitizePath(pagePath: string): string {
  return pagePath.replace(/^\//, '').replace(/\//g, '-') || 'home';
}

/**
 * Mask dynamic content before screenshot
 * Hides timestamps, random IDs, animations, etc.
 */
export async function maskDynamicContent(page: Page) {
  await page.evaluate((selectors: string[]) => {
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        (el as HTMLElement).style.visibility = 'hidden';
      });
    }
  }, visualThresholds.maskSelectors);
}

/**
 * Take a screenshot for visual comparison
 * Returns the screenshot path
 */
export async function takePageScreenshot(
  page: Page,
  pagePath: string,
  options?: { fullPage?: boolean }
): Promise<string> {
  const viewportName = getViewportName(page);
  const filename = `${sanitizePath(pagePath)}.jpeg`;
  const dir = path.join(CURRENT_DIR, viewportName);

  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const screenshotPath = path.join(dir, filename);

  // Mask dynamic content
  await maskDynamicContent(page);

  // Wait for any animations to settle
  await page.waitForTimeout(500);

  await page.screenshot({
    path: screenshotPath,
    type: 'jpeg',
    quality: 80,
    fullPage: options?.fullPage ?? false,
  });

  return screenshotPath;
}

/**
 * Capture baseline screenshot
 */
export async function captureBaseline(
  page: Page,
  pagePath: string,
  options?: { fullPage?: boolean }
): Promise<string> {
  const viewportName = getViewportName(page);
  const filename = `${sanitizePath(pagePath)}.jpeg`;
  const dir = path.join(BASELINES_DIR, viewportName);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const baselinePath = path.join(dir, filename);

  await maskDynamicContent(page);
  await page.waitForTimeout(500);

  await page.screenshot({
    path: baselinePath,
    type: 'jpeg',
    quality: 80,
    fullPage: options?.fullPage ?? false,
  });

  return baselinePath;
}

/**
 * Check if baseline exists for a page
 */
export function hasBaseline(pagePath: string, viewportName: string): boolean {
  const filename = `${sanitizePath(pagePath)}.jpeg`;
  const baselinePath = path.join(BASELINES_DIR, viewportName, filename);
  return fs.existsSync(baselinePath);
}

/**
 * Visual comparison using Playwright's built-in toHaveScreenshot
 * Falls back to creating baseline on first run
 */
export async function compareScreenshot(
  page: Page,
  pagePath: string,
  options?: { fullPage?: boolean }
) {
  const viewportName = getViewportName(page);
  const threshold = getThreshold(pagePath);
  const filename = `${sanitizePath(pagePath)}-${viewportName}.jpeg`;

  await maskDynamicContent(page);
  await page.waitForTimeout(500);

  // Use Playwright's built-in visual comparison
  await expect(page).toHaveScreenshot(filename, {
    maxDiffPixelRatio: threshold / 100,
    fullPage: options?.fullPage ?? false,
    animations: 'disabled',
  });
}

/**
 * Check for broken images on the page
 */
export async function checkBrokenImages(page: Page): Promise<{
  total: number;
  broken: string[];
}> {
  const result = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const broken: string[] = [];

    for (const img of images) {
      if (!img.complete || img.naturalWidth === 0) {
        broken.push(img.src || img.getAttribute('data-src') || 'unknown');
      }
    }

    return { total: images.length, broken };
  });

  return result;
}
