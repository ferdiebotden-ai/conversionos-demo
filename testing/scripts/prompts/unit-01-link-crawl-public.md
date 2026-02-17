# T-01: Link Crawl — Public Pages

## Objective
Crawl all 13 public pages and verify every link resolves correctly.

## Test File
Write tests to: `testing/tests/e2e/autonomous/t01-link-crawl-public.spec.ts`

## What to Test (~45 tests)

### 1. Page Load Tests (13 tests)
For each public page (`/`, `/services`, `/services/kitchen`, `/services/bathroom`, `/services/basement`, `/services/outdoor`, `/about`, `/contact`, `/projects`, `/estimate`, `/estimate/resume`, `/visualizer`, `/admin/login`):
- Navigate and verify HTTP 200
- Verify page has a title
- Verify no console errors (filter out React dev warnings)

### 2. Link Validation Tests (~20 tests)
For each public page:
- Extract all `<a href>` elements
- Verify internal links return 200 (not 404/500)
- Skip external links (just log them)
- Verify no broken internal links

### 3. CTA Verification Tests (~7 tests)
For pages that should have CTAs (Home, Services, About, Projects):
- Verify "Get a Free Estimate" or similar CTA exists
- Verify CTA links to `/estimate` or `/contact`
- Verify CTA is visible above the fold on desktop

### 4. Meta Tag Tests (~5 tests)
- Each public page has a `<title>`
- Each public page has a `<meta name="description">`
- Home page title contains brand name
- Viewport meta tag present

### 5. 404 Page Test
- Navigate to `/nonexistent-page-xyz`
- Verify 404 page renders (not blank)
- Verify "not found" message or 404 status

## Imports
```typescript
import { test, expect } from '@playwright/test';
import { navigateAndWait, PUBLIC_ROUTES } from '../../fixtures/autonomous-helpers';
import { validatePageLinks, validateCTAs, validateMetaTags } from '../../fixtures/link-validator';
```

## Config
Use: `npx playwright test testing/tests/e2e/autonomous/t01-link-crawl-public.spec.ts --config=testing/config/playwright.autonomous.config.ts --project=Desktop`

## Completion Signal
After tests pass, output: `SUITE_STATUS=complete`
