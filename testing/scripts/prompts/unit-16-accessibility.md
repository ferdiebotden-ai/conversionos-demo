# T-16: Accessibility (WCAG AA)

## Objective
Audit every page for WCAG AA compliance using axe-core.

## Test File
Write tests to: `testing/tests/e2e/autonomous/t16-accessibility.spec.ts`

## What to Test (~30 tests)

### 1. axe-core Audit — Public Pages (13 tests)
For each public page:
- Run axe-core with `wcag2a` and `wcag2aa` tags
- Assert no critical or serious violations
- Log warnings for moderate/minor violations

### 2. axe-core Audit — Admin Pages (6 tests)
- Login first
- For each admin page, run axe-core audit
- Assert no critical or serious violations

### 3. Keyboard Navigation (4 tests)
- Home page: Tab through all interactive elements
- All focusable elements have visible focus indicator
- `/estimate` chat: keyboard-navigable
- `/admin/leads`: table rows keyboard-accessible

### 4. Touch Targets (3 tests)
- Public pages: all interactive elements >= 44px
- Admin pages: all buttons >= 44px
- Mobile viewport: CTA buttons >= 44px

### 5. Heading Hierarchy (2 tests)
- Each page has exactly one `<h1>`
- No skipped heading levels (h1 → h3 without h2)

### 6. Image Alt Text (2 tests)
- All content images have alt text
- Decorative images have empty alt or role="presentation"

## Imports
```typescript
import { test, expect } from '@playwright/test';
import { navigateAndWait, PUBLIC_ROUTES, ADMIN_ROUTES, loginAsAdmin } from '../../fixtures/autonomous-helpers';
import { auditAccessibility, assertNoSeriousViolations, checkKeyboardNavigation, checkTouchTargets, checkHeadingHierarchy, checkImageAltText } from '../../fixtures/accessibility-helpers';
```

## Config
Use: `npx playwright test testing/tests/e2e/autonomous/t16-accessibility.spec.ts --config=testing/config/playwright.autonomous.config.ts --project=Desktop`

## Completion Signal
After tests pass, output: `SUITE_STATUS=complete`
