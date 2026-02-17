/**
 * Accessibility Test Helpers
 * WCAG AA compliance testing utilities using axe-core
 */

import { Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export interface A11yResult {
  violations: A11yViolation[];
  passes: number;
  incomplete: number;
}

export interface A11yViolation {
  id: string;
  impact: string;
  description: string;
  helpUrl: string;
  nodes: number;
}

/**
 * Run axe-core accessibility audit on current page
 */
export async function auditAccessibility(
  page: Page,
  options?: { tags?: string[]; exclude?: string[] }
): Promise<A11yResult> {
  let builder = new AxeBuilder({ page })
    .withTags(options?.tags || ['wcag2a', 'wcag2aa']);

  if (options?.exclude) {
    for (const selector of options.exclude) {
      builder = builder.exclude(selector);
    }
  }

  const results = await builder.analyze();

  return {
    violations: results.violations.map(v => ({
      id: v.id,
      impact: v.impact || 'unknown',
      description: v.description,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
    })),
    passes: results.passes.length,
    incomplete: results.incomplete.length,
  };
}

/**
 * Verify page has no critical/serious a11y violations
 */
export async function assertNoSeriousViolations(page: Page, pageName?: string) {
  const result = await auditAccessibility(page);
  const serious = result.violations.filter(
    v => v.impact === 'critical' || v.impact === 'serious'
  );

  if (serious.length > 0) {
    const details = serious
      .map(v => `  - [${v.impact}] ${v.id}: ${v.description} (${v.nodes} nodes)`)
      .join('\n');
    throw new Error(
      `${pageName || 'Page'} has ${serious.length} serious accessibility violation(s):\n${details}`
    );
  }
}

/**
 * Check keyboard navigation works on the page
 */
export async function checkKeyboardNavigation(page: Page): Promise<{
  focusableElements: number;
  allHaveFocusVisible: boolean;
  tabOrderCorrect: boolean;
}> {
  // Count focusable elements
  const focusableCount = await page.evaluate(() => {
    const focusable = document.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    return focusable.length;
  });

  // Check focus visibility
  let allHaveFocusVisible = true;
  const tabOrder: string[] = [];

  for (let i = 0; i < Math.min(focusableCount, 20); i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { tag: 'none', hasOutline: false };
      const styles = window.getComputedStyle(el);
      const hasOutline = styles.outlineStyle !== 'none' ||
        styles.boxShadow !== 'none' ||
        el.classList.contains('focus-visible') ||
        el.matches(':focus-visible');
      return {
        tag: el.tagName,
        hasOutline,
      };
    });

    if (focused.tag !== 'none') {
      tabOrder.push(focused.tag);
      if (!focused.hasOutline) {
        allHaveFocusVisible = false;
      }
    }
  }

  return {
    focusableElements: focusableCount,
    allHaveFocusVisible,
    tabOrderCorrect: tabOrder.length > 0,
  };
}

/**
 * Check touch target sizes (>= 44px)
 */
export async function checkTouchTargets(page: Page): Promise<{
  total: number;
  tooSmall: { selector: string; width: number; height: number }[];
}> {
  const result = await page.evaluate(() => {
    const interactive = document.querySelectorAll(
      'a[href], button, input, select, textarea, [role="button"]'
    );
    const tooSmall: { selector: string; width: number; height: number }[] = [];

    interactive.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (rect.width < 44 || rect.height < 44) {
          const tag = el.tagName.toLowerCase();
          const id = el.id ? `#${el.id}` : '';
          const cls = el.className ? `.${String(el.className).split(' ')[0]}` : '';
          tooSmall.push({
            selector: `${tag}${id}${cls}`,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      }
    });

    return { total: interactive.length, tooSmall };
  });

  return result;
}

/**
 * Check heading hierarchy (h1 -> h2 -> h3, no skips)
 */
export async function checkHeadingHierarchy(page: Page): Promise<{
  headings: { level: number; text: string }[];
  hasH1: boolean;
  hasSkippedLevel: boolean;
  multipleH1: boolean;
}> {
  const headings = await page.evaluate(() => {
    const hs = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    return Array.from(hs).map(h => ({
      level: parseInt(h.tagName[1]),
      text: h.textContent?.trim().slice(0, 50) || '',
    }));
  });

  const h1Count = headings.filter(h => h.level === 1).length;
  let hasSkippedLevel = false;

  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level > headings[i - 1].level + 1) {
      hasSkippedLevel = true;
      break;
    }
  }

  return {
    headings,
    hasH1: h1Count >= 1,
    hasSkippedLevel,
    multipleH1: h1Count > 1,
  };
}

/**
 * Check alt text on images
 */
export async function checkImageAltText(page: Page): Promise<{
  total: number;
  withAlt: number;
  withoutAlt: string[];
  decorativeCount: number;
}> {
  const result = await page.evaluate(() => {
    const images = document.querySelectorAll('img');
    const withoutAlt: string[] = [];
    let withAlt = 0;
    let decorativeCount = 0;

    images.forEach(img => {
      const alt = img.getAttribute('alt');
      const role = img.getAttribute('role');

      if (role === 'presentation' || alt === '') {
        decorativeCount++;
      } else if (alt && alt.length > 0) {
        withAlt++;
      } else {
        withoutAlt.push(img.src?.slice(0, 100) || 'unknown');
      }
    });

    return {
      total: images.length,
      withAlt,
      withoutAlt,
      decorativeCount,
    };
  });

  return result;
}
