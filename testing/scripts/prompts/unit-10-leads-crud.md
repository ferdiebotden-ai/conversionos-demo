# T-10: Leads CRUD

## Objective
Test leads management: table, detail view, tabs, API CRUD operations.

## Test File
Write tests to: `testing/tests/e2e/autonomous/t10-leads-crud.spec.ts`

## What to Test (~35 tests)

### 1. Leads Table (~10 tests)
- Login and navigate to `/admin/leads`
- Table renders with columns (Name, Email, Phone, Status, Date)
- Table has rows or shows empty state
- Sort by clicking column headers
- Filter/search functionality (if present)
- Pagination (if applicable)
- Row click navigates to lead detail

### 2. Lead Detail Page (~10 tests)
- Navigate to `/admin/leads/:id` (use first available lead)
- Header shows lead name and status
- Tabs present: Details, Quote, Chat, Photos, Drawings, Visualizations
- Details tab shows contact info
- Quote tab shows quote or empty state
- Chat tab shows conversation history or empty
- Photos tab shows uploaded images or empty
- Status badge with correct color
- Edit functionality (if available)

### 3. Lead API CRUD (~10 tests)
- `GET /api/leads` returns 200 with array
- `POST /api/leads` creates new lead (with test data)
- `GET /api/leads/:id` returns single lead
- `PUT /api/leads/:id` updates lead
- `DELETE /api/leads/:id` removes lead (clean up test data)
- API returns proper error for invalid ID
- API returns proper error for missing required fields

### 4. Audit Log (~5 tests)
- `GET /api/leads/:id/audit` returns audit entries
- Audit log shows on lead detail page
- Entries have timestamp and action description

## Login Credentials
```typescript
const ADMIN_EMAIL = 'admin@airenodemo.com';
const ADMIN_PASSWORD = 'testpassword123';
```

## Imports
```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin, ensureAdminLoggedIn, apiRequest } from '../../fixtures/autonomous-helpers';
```

## Config
Use: `npx playwright test testing/tests/e2e/autonomous/t10-leads-crud.spec.ts --config=testing/config/playwright.autonomous.config.ts --project=Desktop`

## Completion Signal
After tests pass, output: `SUITE_STATUS=complete`
