# T-06: Contractor/Admin Journey (E2E)

## Objective
Test the complete contractor workflow: login → manage leads → create quote → invoice → draw.

## Test File
Write tests to: `testing/tests/e2e/autonomous/t06-contractor-journey.spec.ts`

## What to Test (~30 tests)

### Journey 1: Login & Dashboard (~5 tests)
- Navigate to `/admin/login`
- Login with demo credentials
- Verify dashboard loads with summary stats
- Verify sidebar navigation
- Verify recent activity or lead count

### Journey 2: Lead Management (~8 tests)
- Navigate to leads list
- Verify table headers (Name, Email, Status, etc.)
- If leads exist: click first lead, verify detail page
- Lead detail has tabs: Details, Quote, Chat, Photos
- Verify lead status badge
- Check audit log section exists
- Back navigation to leads list works

### Journey 3: Quote Creation (~8 tests)
- On lead detail, navigate to Quote tab
- If no quote: verify "Generate Quote" or empty state
- If quote exists: verify line items displayed
- Verify subtotal, HST (13%), and total calculations
- Verify PDF download button exists
- Verify send email button exists
- Check quote status display

### Journey 4: Invoice Management (~5 tests)
- Navigate to invoices page
- Verify filter tabs (All, Draft, Sent, Paid, Overdue)
- If invoices exist: verify table columns
- Click into invoice detail (if available)
- Verify payment recording section

### Journey 5: Drawings (~4 tests)
- Navigate to drawings page
- Verify list or empty state
- If drawings exist: click first, verify canvas area
- Verify Three.js canvas loads (or placeholder)

## Login Credentials
```typescript
const ADMIN_EMAIL = 'admin@airenodemo.com';
const ADMIN_PASSWORD = 'testpassword123';
```

## Imports
```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin, ensureAdminLoggedIn, ADMIN_ROUTES } from '../../fixtures/autonomous-helpers';
```

## Config
Use: `npx playwright test testing/tests/e2e/autonomous/t06-contractor-journey.spec.ts --config=testing/config/playwright.autonomous.config.ts --project=Desktop`

## Completion Signal
After tests pass, output: `SUITE_STATUS=complete`
