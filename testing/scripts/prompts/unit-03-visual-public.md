# T-03: Visual Baseline — Public Pages

## Objective
Screenshot all 13 public pages x 3 viewports, establish visual baselines.

## Test File
Write tests to: `testing/tests/e2e/autonomous/t03-visual-public.spec.ts`

## What to Test (~39 tests)

### 1. Screenshot Capture (13 pages x 3 viewports = 39 tests)
For each public page and each viewport (Mobile 375px, Tablet 768px, Desktop 1440px):
- Navigate to page
- Wait for content to load
- Mask dynamic content (timestamps, animations)
- Take JPEG screenshot
- Save as baseline if first run, compare if baseline exists

### 2. Broken Image Check (alongside screenshots)
- For each page, check `img` elements loaded correctly
- Report any images with naturalWidth === 0

### 3. CTA Visibility Check (per viewport)
- On mobile: verify main CTA is visible without scrolling
- On desktop: verify CTA above the fold

## Public Pages
`/`, `/services`, `/services/kitchen`, `/services/bathroom`, `/services/basement`, `/services/outdoor`, `/about`, `/contact`, `/projects`, `/estimate`, `/estimate/resume`, `/visualizer`, `/admin/login`

## Imports
```typescript
import { test, expect } from '@playwright/test';
import { navigateAndWait, PUBLIC_ROUTES, VIEWPORTS } from '../../fixtures/autonomous-helpers';
import { takePageScreenshot, captureBaseline, checkBrokenImages, hasBaseline } from '../../fixtures/visual-regression';
```

## Config
Use: `npx playwright test testing/tests/e2e/autonomous/t03-visual-public.spec.ts --config=testing/config/playwright.autonomous.config.ts`

## Completion Signal
After tests pass, output: `SUITE_STATUS=complete`
