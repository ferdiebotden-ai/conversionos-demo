# T-02: Link Crawl — Admin Pages

## Objective
Login via demo mode and crawl all admin pages, verifying navigation and content.

## Test File
Write tests to: `testing/tests/e2e/autonomous/t02-link-crawl-admin.spec.ts`

## What to Test (~35 tests)

### 1. Login Tests (3 tests)
- Login page loads with email/password fields
- Login with demo credentials succeeds
- Redirects to admin dashboard after login

### 2. Admin Page Load Tests (6 tests)
For each admin page (`/admin`, `/admin/leads`, `/admin/quotes`, `/admin/invoices`, `/admin/drawings`, `/admin/settings`):
- Navigate and verify loads (not redirected to login)
- Verify page heading/title

### 3. Sidebar Navigation Tests (~8 tests)
- Sidebar is visible on desktop
- All nav items present (Dashboard, Leads, Quotes, Invoices, Drawings, Settings)
- Clicking each nav item navigates correctly
- Active item is visually highlighted

### 4. Admin Content Tests (~10 tests)
- Leads page shows table or empty state
- Quotes page shows table or empty state
- Invoices page shows filter tabs
- Drawings page shows list or empty state
- Settings page shows company info section
- Dashboard shows summary cards/stats

### 5. Breadcrumb Tests (~5 tests)
- Detail pages show breadcrumbs
- Breadcrumb links work

### 6. Logout Test (~3 tests)
- Logout button/link exists
- Clicking logout returns to login page
- Admin pages redirect to login after logout

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
Use: `npx playwright test testing/tests/e2e/autonomous/t02-link-crawl-admin.spec.ts --config=testing/config/playwright.autonomous.config.ts --project=Desktop`

## Completion Signal
After tests pass, output: `SUITE_STATUS=complete`
