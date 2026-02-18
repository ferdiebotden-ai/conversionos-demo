# T-09: AI Receptionist Widget

## Objective
Test the floating AI receptionist chat widget across all applicable pages.

## Test File
Write tests to: `testing/tests/e2e/autonomous/t09-ai-receptionist.spec.ts`

## What to Test (~20 tests)

### 1. Widget Presence (~8 tests)
For public pages (Home, Services, About, Contact, Projects):
- Floating widget button is visible
- Widget is positioned in bottom-right corner
- Widget has proper z-index (above page content)
For admin pages:
- Widget may or may not be present (test actual behavior)
For `/estimate` and `/visualizer`:
- Widget may be hidden to avoid competing with main AI interface

### 2. Widget Interaction (~5 tests)
- Click widget → chat overlay opens
- Chat overlay has input field
- Close button works
- Widget button reappears after close
- Send a test message → response appears (if AI available)

### 3. CTA Buttons (~3 tests)
- Chat overlay shows quick action buttons
- Buttons include relevant CTAs (Get Estimate, Book Consultation, etc.)
- Clicking CTA button navigates or triggers action

### 4. Accessibility (~4 tests)
- Widget has aria-label
- Chat overlay is keyboard navigable
- Focus trap works when overlay is open
- Mobile: widget in thumb zone (bottom 1/3 of screen)

## Testing Approach
This is **Tier 2 (Structural)** — verify UI exists and responds, don't validate AI content quality.

## Imports
```typescript
import { test, expect } from '@playwright/test';
import { navigateAndWait, PUBLIC_ROUTES } from '../../fixtures/autonomous-helpers';
import { checkReceptionistWidget } from '../../fixtures/ai-test-helpers';
```

## Config
Use: `npx playwright test testing/tests/e2e/autonomous/t09-ai-receptionist.spec.ts --config=testing/config/playwright.autonomous.config.ts --project=Desktop`

## Completion Signal
After tests pass, output: `SUITE_STATUS=complete`
