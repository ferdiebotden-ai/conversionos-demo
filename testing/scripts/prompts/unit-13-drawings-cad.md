# T-13: Drawings & CAD

## Objective
Test the Three.js-based drawing/CAD tool.

## Test File
Write tests to: `testing/tests/e2e/autonomous/t13-drawings-cad.spec.ts`

## What to Test (~30 tests)

### 1. Drawings List (~5 tests)
- Navigate to `/admin/drawings`
- Table or card grid renders
- Shows drawing title, status, date
- Create new drawing button exists
- Empty state renders correctly

### 2. Drawing Detail (~8 tests)
- Navigate to `/admin/drawings/:id`
- Three.js canvas element exists
- Canvas has non-zero dimensions
- Toolbar is visible
- Status selector present (Draft, In Progress, Complete)
- Title/header displays drawing name
- Back navigation works

### 3. Canvas & Tools (~10 tests)
- Canvas renders without WebGL errors
- Toolbar has expected tools (draw, select, zoom, pan, etc.)
- Tool buttons are clickable
- Layers panel exists (if applicable)
- Properties panel exists (if applicable)
- Zoom in/out controls work
- Pan/scroll behavior
- Canvas responds to clicks

### 4. Drawing CRUD API (~5 tests)
- `GET /api/drawings` returns list
- `POST /api/drawings` creates new drawing
- `GET /api/drawings/:id` returns drawing data
- `PUT /api/drawings/:id` updates drawing
- `DELETE /api/drawings/:id` removes drawing

### 5. Export (~2 tests)
- Export button exists
- Export produces downloadable file

## Imports
```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin, ensureAdminLoggedIn, apiRequest } from '../../fixtures/autonomous-helpers';
```

## Config
Use: `npx playwright test testing/tests/e2e/autonomous/t13-drawings-cad.spec.ts --config=testing/config/playwright.autonomous.config.ts --project=Desktop`

## Completion Signal
After tests pass, output: `SUITE_STATUS=complete`
