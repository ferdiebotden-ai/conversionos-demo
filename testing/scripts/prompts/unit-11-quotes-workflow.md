# T-11: Quotes Workflow

## Objective
Test quote creation, line items, calculations, PDF generation, and email sending.

## Test File
Write tests to: `testing/tests/e2e/autonomous/t11-quotes-workflow.spec.ts`

## What to Test (~35 tests)

### 1. Quote Display (~8 tests)
- Navigate to `/admin/quotes`
- Quotes table or list loads
- Navigate to a lead's quote tab
- Line items display with description, quantity, price
- Subtotal calculates correctly (sum of line items)
- HST (13%) calculates correctly
- Total = subtotal + HST
- Quote status displayed (draft, sent, accepted, etc.)

### 2. Line Item Management (~8 tests)
- Add new line item button exists
- Fill line item: description, quantity, unit price
- Line item total = quantity × unit price
- Add multiple line items
- Remove a line item
- Subtotal updates after changes
- HST updates after changes
- Real-time total updates

### 3. Quote Generation (~5 tests)
- AI generate quote button exists (if applicable)
- Generate fills in line items
- Generated items have descriptions and prices > 0
- Generated quote has reasonable total
- Regenerate replaces existing items

### 4. PDF & Email (~8 tests)
- PDF download button exists
- PDF endpoint returns 200 (`GET /api/quotes/:leadId/pdf`)
- PDF response has correct content-type
- Send email button exists
- Draft email endpoint works (`POST /api/quotes/:leadId/draft-email`)
- Send quote endpoint works (`POST /api/quotes/:leadId/send`)

### 5. Quote API (~6 tests)
- `GET /api/quotes/:leadId` returns quote data
- `PUT /api/quotes/:leadId` updates quote
- `POST /api/quotes/:leadId/regenerate` triggers regeneration
- API validates required fields
- HST rate is 13% (Ontario)

## Imports
```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin, ensureAdminLoggedIn, apiRequest } from '../../fixtures/autonomous-helpers';
```

## Config
Use: `npx playwright test testing/tests/e2e/autonomous/t11-quotes-workflow.spec.ts --config=testing/config/playwright.autonomous.config.ts --project=Desktop`

## Completion Signal
After tests pass, output: `SUITE_STATUS=complete`
