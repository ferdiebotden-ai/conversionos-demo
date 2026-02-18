# T-17: Performance (Lighthouse Metrics)

## Objective
Measure Core Web Vitals on top pages across viewports.

## Test File
Write tests to: `testing/tests/e2e/autonomous/t17-performance.spec.ts`

## What to Test (~20 tests)

### 1. Core Web Vitals — Top 5 Pages x 2 Viewports (10 tests)
Pages: `/`, `/services`, `/estimate`, `/visualizer`, `/admin/leads`
Viewports: Mobile (375px), Desktop (1440px)
For each combination:
- Measure LCP (Largest Contentful Paint) — threshold: < 4s
- Measure CLS (Cumulative Layout Shift) — threshold: < 0.25
- Record TBT (Total Blocking Time) if measurable

### 2. Image Optimization (5 tests)
- Home page: all images have width/height or aspect-ratio
- No images larger than 500KB
- Images use next/image or have loading="lazy"
- No layout shift from image loading
- WebP/AVIF format used where supported

### 3. Bundle Size Checks (3 tests)
- Page JS bundle is not excessively large (check network)
- No duplicate library loading
- CSS is not excessively large

### 4. Network Request Count (2 tests)
- Home page loads in < 50 requests
- No failed requests on page load

## Measurement Approach
Use Playwright's `page.evaluate()` with Performance API:
```javascript
const lcp = await page.evaluate(() => {
  return new Promise(resolve => {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      resolve(entries[entries.length - 1]?.startTime || 0);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    setTimeout(() => resolve(0), 10000);
  });
});
```

## Imports
```typescript
import { test, expect } from '@playwright/test';
import { navigateAndWait, PUBLIC_ROUTES } from '../../fixtures/autonomous-helpers';
```

## Config
Use: `npx playwright test testing/tests/e2e/autonomous/t17-performance.spec.ts --config=testing/config/playwright.autonomous.config.ts`

## Completion Signal
After tests pass, output: `SUITE_STATUS=complete`
