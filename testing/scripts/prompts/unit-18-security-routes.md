# T-18: Security & Route Protection

## Objective
Test admin route protection, input validation, file upload safety, and error handling.

## Test File
Write tests to: `testing/tests/e2e/autonomous/t18-security-routes.spec.ts`

## What to Test (~25 tests)

### 1. Route Protection (~8 tests)
Without logging in:
- `GET /admin` → redirects to `/admin/login` or returns 401
- `GET /admin/leads` → redirects to login
- `GET /admin/quotes` → redirects to login
- `GET /admin/invoices` → redirects to login
- `GET /admin/drawings` → redirects to login
- `GET /admin/settings` → redirects to login
- `GET /api/admin/settings` → returns 401 or 403
- `GET /api/leads` → returns 401 or array (depending on auth setup)

### 2. Input Validation (~6 tests)
- `POST /api/leads` with empty body → returns 400
- `POST /api/leads` with invalid email → returns 400
- `POST /api/leads` with XSS payload in name (`<script>alert(1)</script>`) → sanitized or rejected
- `POST /api/leads` with SQL injection in name (`'; DROP TABLE leads; --`) → handled safely
- `PUT /api/invoices/:id` with negative amount → rejected
- Very long input strings (10000 chars) → handled without crash

### 3. File Upload Validation (~4 tests)
- Upload valid image → accepted
- Upload non-image file (.exe, .sh) → rejected
- Upload oversized file (if limit exists) → rejected
- Upload with malicious filename → sanitized

### 4. Error Handling (~4 tests)
- Invalid API route → 404 JSON response
- Internal errors → no stack traces leaked
- No server-side error details exposed to client
- Error responses have consistent format

### 5. Headers & CORS (~3 tests)
- Security headers present (X-Content-Type-Options, etc.)
- No sensitive info in response headers
- CORS configured appropriately

## Imports
```typescript
import { test, expect } from '@playwright/test';
import { apiRequest, navigateAndWait } from '../../fixtures/autonomous-helpers';
```

## Config
Use: `npx playwright test testing/tests/e2e/autonomous/t18-security-routes.spec.ts --config=testing/config/playwright.autonomous.config.ts --project=Desktop`

## Completion Signal
After tests pass, output: `SUITE_STATUS=complete`
