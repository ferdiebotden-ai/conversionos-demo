# T-04: Visual Baseline — Admin Pages

## Objective
Screenshot all admin pages x 3 viewports, verify layout structure.

## Test File
Write tests to: `testing/tests/e2e/autonomous/t04-visual-admin.spec.ts`

## What to Test (~30 tests)

### 1. Admin Page Screenshots (6 pages x 3 viewports = 18 tests)
For each admin page and each viewport:
- Login first (use storageState for efficiency)
- Navigate to page
- Wait for content to load
- Mask dynamic content
- Take JPEG screenshot

### 2. Layout Verification (~12 tests)
- Sidebar visible on desktop/tablet, hidden/hamburger on mobile
- Table columns visible and properly aligned on desktop
- Tables have horizontal scroll on mobile
- Empty states render correctly
- Form layouts are responsive

## Admin Pages
`/admin`, `/admin/leads`, `/admin/quotes`, `/admin/invoices`, `/admin/drawings`, `/admin/settings`

## Login Strategy
Use `test.beforeAll` to login and save `storageState` so each test reuses the session.

## Imports
```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin, ADMIN_ROUTES, VIEWPORTS } from '../../fixtures/autonomous-helpers';
import { takePageScreenshot, captureBaseline, hasBaseline } from '../../fixtures/visual-regression';
```

## Config
Use: `npx playwright test testing/tests/e2e/autonomous/t04-visual-admin.spec.ts --config=testing/config/playwright.autonomous.config.ts`

## Completion Signal
After tests pass, output: `SUITE_STATUS=complete`
