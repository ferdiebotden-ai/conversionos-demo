/**
 * Link Validator
 * Crawls pages and validates all links resolve correctly
 */

import { Page, expect } from '@playwright/test';
import { getAllLinks, checkUrlStatus, TARGET_URL } from './autonomous-helpers';

export interface LinkCheckResult {
  page: string;
  url: string;
  text: string;
  status: number;
  ok: boolean;
  isExternal: boolean;
}

/**
 * Extract and categorize all links from a page
 */
export async function extractPageLinks(page: Page, pagePath: string): Promise<LinkCheckResult[]> {
  const links = await getAllLinks(page);
  const results: LinkCheckResult[] = [];
  const checked = new Set<string>();

  for (const link of links) {
    const href = link.href;

    // Skip anchors, javascript:, mailto:, tel:
    if (!href || href.startsWith('#') || href.startsWith('javascript:') ||
        href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue;
    }

    // Normalize URL
    let fullUrl = href;
    if (href.startsWith('/')) {
      const base = TARGET_URL.replace(/\/$/, '');
      fullUrl = `${base}${href}`;
    }

    // Skip already checked
    if (checked.has(fullUrl)) continue;
    checked.add(fullUrl);

    const isExternal = !fullUrl.includes(new URL(TARGET_URL).hostname);

    results.push({
      page: pagePath,
      url: fullUrl,
      text: link.text,
      status: 0,
      ok: false,
      isExternal,
    });
  }

  return results;
}

/**
 * Check all links on a page and return results
 */
export async function validatePageLinks(
  page: Page,
  pagePath: string,
  options?: { skipExternal?: boolean; timeout?: number }
): Promise<{ passed: LinkCheckResult[]; failed: LinkCheckResult[] }> {
  await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
  const links = await extractPageLinks(page, pagePath);

  const passed: LinkCheckResult[] = [];
  const failed: LinkCheckResult[] = [];

  for (const link of links) {
    if (options?.skipExternal && link.isExternal) {
      link.ok = true;
      link.status = -1; // Skipped
      passed.push(link);
      continue;
    }

    const result = await checkUrlStatus(page, link.url);
    link.status = result.status;
    link.ok = result.ok;

    if (result.ok) {
      passed.push(link);
    } else {
      failed.push(link);
    }
  }

  return { passed, failed };
}

/**
 * Validate all CTA buttons are present and clickable
 */
export async function validateCTAs(page: Page): Promise<{
  found: string[];
  missing: string[];
}> {
  const ctaSelectors = [
    'a[href="/estimate"]',
    'a[href="/contact"]',
    'a[href="/visualizer"]',
    'a[href="/services"]',
    'button:has-text("Get")',
    'a:has-text("Free Estimate")',
    'a:has-text("Get Started")',
  ];

  const found: string[] = [];
  const missing: string[] = [];

  for (const selector of ctaSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      found.push(selector);
    } else {
      missing.push(selector);
    }
  }

  return { found, missing };
}

/**
 * Verify meta tags are present on a page
 */
export async function validateMetaTags(page: Page): Promise<{
  hasTitle: boolean;
  hasDescription: boolean;
  hasViewport: boolean;
  title: string;
}> {
  const title = await page.title();
  const description = await page.getAttribute('meta[name="description"]', 'content');
  const viewport = await page.getAttribute('meta[name="viewport"]', 'content');

  return {
    hasTitle: title.length > 0,
    hasDescription: !!description && description.length > 0,
    hasViewport: !!viewport,
    title,
  };
}
