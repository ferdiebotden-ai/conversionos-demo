# T-14: Admin Settings

## Objective
Test the admin settings page: company info, business constants.

## Test File
Write tests to: `testing/tests/e2e/autonomous/t14-admin-settings.spec.ts`

## What to Test (~15 tests)

### 1. Settings Page Load (~4 tests)
- Login and navigate to `/admin/settings`
- Page loads without errors
- Company info section visible
- Form fields are editable

### 2. Company Info (~5 tests)
- Company name field exists
- Phone number field exists
- Email field exists
- Address fields exist
- Logo upload area exists

### 3. Business Constants (~3 tests)
- HST rate field shows 13%
- Deposit rate field
- Contingency rate field

### 4. Settings API (~3 tests)
- `GET /api/admin/settings` returns current settings
- `PUT /api/admin/settings` updates settings
- API validates field types

## Imports
```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin, apiRequest } from '../../fixtures/autonomous-helpers';
```

## Config
Use: `npx playwright test testing/tests/e2e/autonomous/t14-admin-settings.spec.ts --config=testing/config/playwright.autonomous.config.ts --project=Desktop`

## Completion Signal
After tests pass, output: `SUITE_STATUS=complete`
