# T-07: AI Chat Assistant

## Objective
Test the `/estimate` AI chat interface — the 4-phase conversational flow.

## Test File
Write tests to: `testing/tests/e2e/autonomous/t07-ai-chat.spec.ts`

## What to Test (~30 tests)

### 1. Chat Interface (~5 tests)
- Page loads with chat interface
- Chat input textarea is visible and enabled
- Send button exists
- Welcome message or prompt displayed
- Quick reply buttons visible (if applicable)

### 2. Conversation Flow (~10 tests)
- Send "I want to renovate my kitchen"
- AI responds with follow-up questions
- Response mentions kitchen/renovation
- Send "About 200 square feet, standard finishes"
- AI provides estimate with dollar amounts
- Estimate breakdown includes materials, labor
- Estimate mentions HST (13%)
- Response is reasonable length (> 50 chars)
- Conversation history persists on page

### 3. Photo Upload (~5 tests)
- File input exists for photo upload
- Upload test image succeeds
- AI acknowledges photo receipt
- No error messages after upload

### 4. Session Management (~5 tests)
- Navigate to `/estimate/resume` — shows resume option or empty state
- Session ID persists in URL or storage
- Refreshing page maintains conversation (or shows resume)

### 5. Edge Cases (~5 tests)
- Empty message send is prevented
- Very long message (500+ chars) is accepted
- Special characters in message don't break chat
- Multiple rapid messages don't crash
- Voice toggle button exists (if implemented)

## AI Testing Rules
- **Maximum 5 AI API calls** across all tests
- `test.skip()` if AI unavailable
- 90s timeout for AI responses
- Deterministic prompts: "I want to renovate my kitchen" and "About 200 sqft, standard finishes"

## Imports
```typescript
import { test, expect } from '@playwright/test';
import { sendAIChatMessage, verifyAIResponse, isAIAvailable, AI_TIMEOUT, MAX_AI_CALLS_PER_FILE } from '../../fixtures/ai-test-helpers';
import { navigateAndWait, uploadTestImage } from '../../fixtures/autonomous-helpers';
```

## Config
Use: `npx playwright test testing/tests/e2e/autonomous/t07-ai-chat.spec.ts --config=testing/config/playwright.autonomous.config.ts --project=Desktop`

## Completion Signal
After tests pass, output: `SUITE_STATUS=complete`
