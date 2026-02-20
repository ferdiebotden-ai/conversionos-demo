---
name: playwright-testing
description: "Playwright E2E and Vitest unit testing patterns. Use when writing tests, setting up test automation, verifying UI components, checking mobile breakpoints, or validating multi-tenant data isolation."
---

# Testing Patterns

## Unit Tests (Vitest)

### Test Structure

```typescript
// tests/unit/lib/pricing.test.ts
import { describe, it, expect, vi } from 'vitest'
import { calculateEstimate } from '@/lib/pricing'

describe('calculateEstimate', () => {
  it('returns correct estimate for kitchen renovation', () => {
    const result = calculateEstimate({
      projectType: 'kitchen',
      squareFeet: 200,
      finishLevel: 'standard',
    })
    expect(result.total).toBe(45000)
  })
})
```

### Mocking Supabase

```typescript
// tests/unit/helpers/mock-supabase.ts
import { vi } from 'vitest'

export function mockSupabase(overrides = {}) {
  return {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    ...overrides,
  }
}
```

### Testing Multi-Tenant Isolation

```typescript
describe('multi-tenant data isolation', () => {
  it('only returns data for the current site_id', async () => {
    // Mock getSiteId to return 'site-a'
    vi.mock('@/lib/db/site', () => ({
      getSiteId: () => 'site-a',
      withSiteId: (data: any) => ({ ...data, site_id: 'site-a' }),
    }))

    const result = await getLeads()

    // Verify .eq was called with correct site_id
    expect(mockSupabase.eq).toHaveBeenCalledWith('site_id', 'site-a')
  })
})
```

## E2E Tests (Playwright)

### Test Structure

```typescript
// tests/e2e/intake-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Lead Intake Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('completes intake form successfully', async ({ page }) => {
    await page.fill('[data-testid="name"]', 'John Doe')
    await page.fill('[data-testid="email"]', 'john@example.com')
    await page.fill('[data-testid="phone"]', '+14165551234')
    await page.selectOption('[data-testid="project-type"]', 'kitchen')

    await page.click('[data-testid="submit"]')

    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('shows validation errors for invalid input', async ({ page }) => {
    await page.click('[data-testid="submit"]')
    await expect(page.locator('[data-testid="error-name"]')).toBeVisible()
  })
})
```

### Visual Regression Testing

```typescript
// tests/e2e/visual-regression.spec.ts
import { test, expect } from '@playwright/test'

test('intake form matches reference', async ({ page }) => {
  await page.goto('/get-quote')
  await page.waitForLoadState('networkidle')

  await expect(page).toHaveScreenshot('intake-form.png', {
    maxDiffPixels: 100,
    mask: [
      page.locator('[data-testid="timestamp"]'),
    ]
  })
})
```

### Breakpoints

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  projects: [
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'], viewport: { width: 375, height: 667 } }
    },
    {
      name: 'tablet',
      use: { viewport: { width: 768, height: 1024 } }
    },
    {
      name: 'desktop',
      use: { viewport: { width: 1440, height: 900 } }
    }
  ]
})
```

### Multi-Tenant E2E Tests

```typescript
test.describe('tenant isolation', () => {
  test('site A does not see site B data', async ({ page }) => {
    // Navigate with site A context
    await page.goto('/?siteId=site-a')
    const leadsA = await page.locator('[data-testid="lead-card"]').count()

    // Navigate with site B context
    await page.goto('/?siteId=site-b')
    const leadsB = await page.locator('[data-testid="lead-card"]').count()

    // Different data sets
    expect(leadsA).not.toBe(leadsB)
  })
})
```

## Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Specific unit test
npx vitest run tests/unit/path

# Specific E2E test
npx playwright test tests/e2e/path

# Mobile only
npx playwright test --project=mobile

# Update visual baselines
npx playwright test --update-snapshots

# With UI
npx playwright test --ui
```

## CI Integration

```yaml
# .github/workflows/test.yml
- name: Unit Tests
  run: npm run test
- name: Playwright Tests
  run: npx playwright test
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report
    path: playwright-report/
```
