# T-05: Homeowner Journey (E2E)

## Objective
Test the complete homeowner user journey: browse → estimate → visualize → submit.

## Test File
Write tests to: `testing/tests/e2e/autonomous/t05-homeowner-journey.spec.ts`

## What to Test (~25 tests)

### Journey 1: Browse & Discover (~8 tests)
- Land on homepage, verify hero section
- Navigate to services page from nav/CTA
- Click into Kitchen service detail page
- Verify service info, gallery, pricing hints
- Navigate to Projects page, verify project cards
- Navigate to About page, verify team/company info
- Verify footer links across pages
- Cross-page navigation maintains consistent layout

### Journey 2: Get AI Estimate (~10 tests)
- Navigate to `/estimate`
- Verify chat interface loads
- Send initial greeting message
- AI responds with welcome
- Describe a kitchen renovation project
- AI asks clarifying questions
- Provide dimensions (200 sqft)
- AI provides estimate with price range
- Verify estimate contains dollar amounts
- Verify estimate breakdown (materials, labor, HST)

### Journey 3: Visualize Renovation (~5 tests)
- Navigate to `/visualizer`
- Upload test image
- Select room type (Kitchen)
- Select style (Modern)
- Verify Generate button appears
- (Skip actual generation — covered in T-08)

### Journey 4: Contact & Submit (~2 tests)
- Navigate to `/contact`
- Verify contact form present
- Fill form fields (name, email, phone, message)

## AI Testing Rules
- Use `test.skip()` if AI is unavailable (check `/api/voice/check` first)
- Maximum 5 AI API calls total
- 90s timeout for AI responses
- Verify response contains renovation keywords

## Imports
```typescript
import { test, expect } from '@playwright/test';
import { navigateAndWait, fillContactForm } from '../../fixtures/autonomous-helpers';
import { sendAIChatMessage, verifyAIResponse, isAIAvailable, AI_TIMEOUT } from '../../fixtures/ai-test-helpers';
```

## Config
Use: `npx playwright test testing/tests/e2e/autonomous/t05-homeowner-journey.spec.ts --config=testing/config/playwright.autonomous.config.ts --project=Desktop`

## Completion Signal
After tests pass, output: `SUITE_STATUS=complete`
