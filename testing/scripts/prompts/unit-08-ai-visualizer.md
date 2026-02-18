# T-08: AI Visualizer

## Objective
Test the `/visualizer` AI-powered room visualization wizard.

## Test File
Write tests to: `testing/tests/e2e/autonomous/t08-ai-visualizer.spec.ts`

## What to Test (~25 tests)

### 1. Wizard Navigation (~8 tests)
- Page loads with Step 1 (Upload)
- File input accepts images
- Upload test image → Next button enabled
- Step 2: Mode selection visible (Quick Form / Chat)
- Select Quick Form
- Step 3: Room type selector visible (Kitchen, Bathroom, Basement, etc.)
- Select Kitchen → Next
- Step 4: Style selector visible (Modern, Traditional, etc.)
- Select Modern → Next
- Step 5: Constraints/Generate step reached

### 2. Generation Flow (~5 tests)
- Generate Vision button is visible
- Click Generate (with real AI if available)
- Loading state appears
- Result page shows (or timeout after 90s)
- "Your Vision is Ready" or result thumbnails appear

### 3. Result Display (~5 tests)
- Before/after slider or comparison view
- At least one concept thumbnail
- Share link button exists
- Download/save option exists
- No storage errors displayed

### 4. Error Handling (~4 tests)
- Invalid file type rejected (try .txt upload)
- Missing photo → Next button disabled
- Cancel/back navigation works at each step
- Browser back button doesn't break wizard state

### 5. Mobile Experience (~3 tests)
- Wizard steps are accessible on mobile (375px)
- Upload button has adequate touch target
- Style/room cards are tappable

## AI Testing Rules
- Maximum 2 actual generations
- `test.skip()` if AI unavailable
- 90s timeout for generation
- Structural tests (wizard navigation) don't need AI

## Imports
```typescript
import { test, expect } from '@playwright/test';
import { completeVisualizerWizard, isAIAvailable, AI_TIMEOUT } from '../../fixtures/ai-test-helpers';
import { navigateAndWait, uploadTestImage } from '../../fixtures/autonomous-helpers';
```

## Config
Use: `npx playwright test testing/tests/e2e/autonomous/t08-ai-visualizer.spec.ts --config=testing/config/playwright.autonomous.config.ts`

## Completion Signal
After tests pass, output: `SUITE_STATUS=complete`
