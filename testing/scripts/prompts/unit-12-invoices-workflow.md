# T-12: Invoices Workflow

## Objective
Test invoice management: creation, payments, PDF, email, Sage 50 export.

## Test File
Write tests to: `testing/tests/e2e/autonomous/t12-invoices-workflow.spec.ts`

## What to Test (~40 tests)

### 1. Invoice List (~8 tests)
- Navigate to `/admin/invoices`
- Table renders with columns
- Filter tabs work (All, Draft, Sent, Paid, Overdue)
- Each tab filters correctly
- Invoice count per tab
- Row click navigates to detail

### 2. Invoice Detail (~8 tests)
- Navigate to `/admin/invoices/:id`
- Shows invoice number, date, status
- Line items with descriptions and amounts
- Subtotal, HST (13%), total calculations correct
- Client info section
- Payment history section
- Status badge with color

### 3. Invoice Creation (~5 tests)
- Create invoice button on invoices page
- Create from quote functionality
- New invoice has line items
- New invoice defaults to Draft status
- Invoice number is auto-generated

### 4. Payment Recording (~8 tests)
- Record payment button on invoice detail
- Payment form: amount, date, method
- Record payment updates balance
- Partial payment: remaining balance calculated
- Full payment: status changes to Paid
- Payment appears in payment history
- Overpayment handling
- Balance = total - sum(payments)

### 5. PDF & Email (~5 tests)
- PDF download button exists
- `GET /api/invoices/:id/pdf` returns PDF
- Send invoice email button
- `POST /api/invoices/:id/send` works
- Status changes to Sent after sending

### 6. Sage 50 Export (~3 tests)
- Export button exists on invoices page
- `GET /api/invoices/export/sage` returns CSV
- CSV has correct headers

### 7. Invoice API (~3 tests)
- `GET /api/invoices` returns list
- `POST /api/invoices` creates invoice
- `DELETE /api/invoices/:id` removes invoice

## Imports
```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin, ensureAdminLoggedIn, apiRequest } from '../../fixtures/autonomous-helpers';
```

## Config
Use: `npx playwright test testing/tests/e2e/autonomous/t12-invoices-workflow.spec.ts --config=testing/config/playwright.autonomous.config.ts --project=Desktop`

## Completion Signal
After tests pass, output: `SUITE_STATUS=complete`
