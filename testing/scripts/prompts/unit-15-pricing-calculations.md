# T-15: Pricing Calculations

## Objective
Unit test all pricing engine calculations: project types, finish levels, edge cases, HST/deposit math.

## Test File
Write tests to: `testing/tests/unit/autonomous/t15-pricing-calculations.test.ts`

**NOTE**: This is a Vitest UNIT test, not a Playwright E2E test.

## What to Test (~40 tests)

### 1. All Project Types x Finish Levels (12 tests)
For each project type (kitchen, bathroom, basement, flooring) x each finish level (economy, standard, premium):
- `calculateEstimate()` returns valid result
- `low < midpoint < high`
- `perSqft` matches constants

### 2. Default Size Fallbacks (4 tests)
- Kitchen defaults to 150 sqft
- Bathroom defaults to 50 sqft
- Basement defaults to 800 sqft
- Flooring defaults to 200 sqft

### 3. Breakdown Math (6 tests)
- `materials + labor === subtotal`
- `contingency === subtotal * 0.10`
- `hst === (subtotal + contingency) * 0.13`
- `total === subtotal + contingency + hst`
- `depositRequired === total * 0.50`
- Material split matches per-type constant

### 4. Variance (3 tests)
- `low === baseLow * 0.85` (±15%)
- `high === baseHigh * 1.15`
- Variance is symmetric

### 5. Edge Cases (8 tests)
- `areaSqft = 0` → uses default size
- `areaSqft = 1` → minimal valid estimate
- `areaSqft = 10000` → large but valid
- Very small area (5 sqft) → result > 0
- Negative area → graceful handling
- Missing finishLevel → defaults to standard
- Unknown project type → throws error
- Float precision: no fractional cents in final results

### 6. Confidence Score (3 tests)
- No area provided → 0.5
- Area provided → 0.7
- Area + non-standard finish → 0.8

### 7. Budget Validation (4 tests)
- Matching budget → isRealistic: true
- Too-low budget → isRealistic: false with message
- Budget exceeds estimate → positive message
- "not_sure" → always realistic

## Run Command
`npx vitest run testing/tests/unit/autonomous/t15-pricing-calculations.test.ts`

## Imports
```typescript
import { describe, it, expect } from 'vitest';
import { calculateEstimate, formatEstimateRange, validateBudgetForScope } from '@/lib/pricing/engine';
import { PRICING_GUIDELINES, DEFAULT_SIZES, BUSINESS_CONSTANTS, MATERIAL_SPLIT } from '@/lib/pricing/constants';
```

## Completion Signal
After tests pass, output: `SUITE_STATUS=complete`
