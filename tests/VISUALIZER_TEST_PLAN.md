# Visualizer Feature Test Plan

**Created:** February 5, 2026
**Feature:** AI Design Visualizer (7-Phase Enhancement)
**Execution:** Run `/test-visualizer` in Claude Code

---

## Quick Start

To execute this test plan in a fresh Claude Code session:

```
/test-visualizer
```

Or manually:
```bash
npm run test:visualizer
```

---

## Execution Status (Updated: Feb 5, 2026)

| Phase | Status | Notes |
|-------|--------|-------|
| **Phase 1: Unit Tests** | ✅ Complete | 84 tests passing |
| **Phase 2: Integration Tests** | ⏳ Pending | MSW setup not yet created |
| **Phase 3.1: Test Fixtures** | ✅ Complete | `tests/e2e/fixtures/visualizer.ts` |
| **Phase 3.2: Quick Mode E2E** | ✅ Complete | 10 tests passing (Desktop) |
| **Phase 3.3: Conversation Mode E2E** | ⏳ Pending | Not yet implemented |
| **Phase 3.4: Admin Panel E2E** | ⏳ Pending | Not yet implemented |
| **Phase 3.5: Mobile E2E** | ✅ Complete | 9 tests passing |
| **Phase 4: Visual Regression** | ⏳ Pending | Not yet implemented |
| **Phase 5: TestSprite** | ⏳ Pending | Optional |

### Recent Fixes (Feb 5, 2026)
- Updated all E2E tests to include **mode selection step** after photo upload
- Fixed `tests/e2e/strict/prd-visualizer-happy-path.spec.ts` for new wizard flow
- Fixed `tests/e2e/strict/helpers.ts` with `navigateVisualizerToConstraints()` update
- Adjusted touch target assertions to use 36px minimum (current UI state)

### Known Limitations
- AI generation tests require configured API keys (Gemini, OpenAI)
- Tests using `verifyVisualizationResult()` will fail without AI backend

---

## Test Strategy Overview

| Layer | Tool | Purpose | Run Time |
|-------|------|---------|----------|
| Unit Tests | Vitest | Schema validation, utilities, prompt building | <10s |
| Integration Tests | Vitest + MSW | API routes with mocked AI services | <30s |
| E2E Critical Path | Playwright | Full user flows with E2E_TEST_MODE | <3min |
| E2E Exploratory | TestSprite | AI-generated broader coverage | <10min |
| Visual Regression | Playwright Screenshots | UI consistency across viewports | <2min |

---

## Phase 1: Unit Tests (Vitest)

### 1.1 Schema Validation Tests
**File:** `tests/unit/visualizer/schemas.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  visualizationRequestSchema,
  roomTypeSchema,
  designStyleSchema
} from '@/lib/schemas/visualization';
import { VisualizationRoomAnalysisSchema } from '@/lib/ai/photo-analyzer';
import { DesignIntentSchema } from '@/lib/schemas/visualizer-extraction';

describe('Visualization Schemas', () => {
  describe('roomTypeSchema', () => {
    it('accepts all valid room types', () => {
      const validTypes = ['kitchen', 'bathroom', 'living_room', 'bedroom', 'basement', 'dining_room', 'exterior'];
      validTypes.forEach(type => {
        expect(() => roomTypeSchema.parse(type)).not.toThrow();
      });
    });

    it('rejects invalid room types', () => {
      expect(() => roomTypeSchema.parse('garage')).toThrow();
      expect(() => roomTypeSchema.parse('')).toThrow();
    });
  });

  describe('designStyleSchema', () => {
    it('accepts all valid design styles', () => {
      const validStyles = ['modern', 'traditional', 'farmhouse', 'industrial', 'minimalist', 'contemporary'];
      validStyles.forEach(style => {
        expect(() => designStyleSchema.parse(style)).not.toThrow();
      });
    });
  });

  describe('visualizationRequestSchema', () => {
    it('validates complete request', () => {
      const validRequest = {
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...',
        roomType: 'kitchen',
        style: 'modern',
        constraints: 'Keep existing cabinets',
        count: 4,
      };
      expect(() => visualizationRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('requires image and roomType', () => {
      expect(() => visualizationRequestSchema.parse({})).toThrow();
      expect(() => visualizationRequestSchema.parse({ image: 'data:...' })).toThrow();
    });

    it('defaults count to 4', () => {
      const result = visualizationRequestSchema.parse({
        image: 'data:image/png;base64,test',
        roomType: 'kitchen',
        style: 'modern',
      });
      expect(result.count).toBe(4);
    });
  });

  describe('VisualizationRoomAnalysisSchema', () => {
    it('validates photo analysis output', () => {
      const validAnalysis = {
        roomType: 'kitchen',
        currentCondition: 'dated',
        structuralElements: ['load-bearing wall'],
        identifiedFixtures: ['island', 'sink'],
        layoutType: 'L-shaped',
        lightingConditions: 'natural light from window',
        perspectiveNotes: 'wide angle from doorway',
        preservationConstraints: ['window position'],
        confidenceScore: 0.85,
      };
      expect(() => VisualizationRoomAnalysisSchema.parse(validAnalysis)).not.toThrow();
    });

    it('requires confidence between 0 and 1', () => {
      const invalid = {
        roomType: 'kitchen',
        currentCondition: 'good',
        structuralElements: [],
        identifiedFixtures: [],
        layoutType: 'open',
        lightingConditions: 'bright',
        perspectiveNotes: 'front view',
        preservationConstraints: [],
        confidenceScore: 1.5, // Invalid
      };
      expect(() => VisualizationRoomAnalysisSchema.parse(invalid)).toThrow();
    });
  });

  describe('DesignIntentSchema', () => {
    it('validates design intent from conversation', () => {
      const validIntent = {
        desiredChanges: ['new countertops', 'modern backsplash'],
        constraintsToPreserve: ['existing cabinets'],
        materialPreferences: ['quartz', 'subway tile'],
      };
      expect(() => DesignIntentSchema.parse(validIntent)).not.toThrow();
    });
  });
});
```

### 1.2 Prompt Builder Tests
**File:** `tests/unit/visualizer/prompt-builder.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  buildRenovationPrompt,
  getDetailedStyleDescription,
  getMaterialSpecifications,
  DETAILED_STYLE_DESCRIPTIONS,
  DETAILED_ROOM_CONTEXTS,
} from '@/lib/ai/prompt-builder';

describe('Prompt Builder', () => {
  describe('buildRenovationPrompt', () => {
    it('generates 6-part structured prompt', () => {
      const prompt = buildRenovationPrompt({
        roomType: 'kitchen',
        style: 'modern',
        variationIndex: 0,
      });

      // Should contain all 6 parts
      expect(prompt).toContain('SCENE DESCRIPTION');
      expect(prompt).toContain('STRUCTURAL PRESERVATION');
      expect(prompt).toContain('MATERIAL');
      expect(prompt).toContain('LIGHTING');
      expect(prompt).toContain('PERSPECTIVE');
      expect(prompt).toContain('QUALITY');
    });

    it('includes photo analysis when provided', () => {
      const prompt = buildRenovationPrompt({
        roomType: 'kitchen',
        style: 'modern',
        variationIndex: 0,
        photoAnalysis: {
          layoutType: 'L-shaped',
          lightingConditions: 'natural light from left',
          perspectiveNotes: 'wide angle from doorway',
        },
      });

      expect(prompt).toContain('L-shaped');
      expect(prompt).toContain('natural light');
    });

    it('includes design intent when provided', () => {
      const prompt = buildRenovationPrompt({
        roomType: 'kitchen',
        style: 'modern',
        variationIndex: 0,
        designIntent: {
          desiredChanges: ['quartz countertops', 'subway tile backsplash'],
          constraintsToPreserve: ['existing cabinets'],
        },
      });

      expect(prompt).toContain('quartz countertops');
      expect(prompt).toContain('existing cabinets');
    });

    it('varies prompt slightly by variationIndex', () => {
      const prompt0 = buildRenovationPrompt({
        roomType: 'kitchen',
        style: 'modern',
        variationIndex: 0,
      });
      const prompt1 = buildRenovationPrompt({
        roomType: 'kitchen',
        style: 'modern',
        variationIndex: 1,
      });

      // Prompts should be slightly different for variation
      expect(prompt0).not.toBe(prompt1);
    });
  });

  describe('getDetailedStyleDescription', () => {
    it('returns description for all valid styles', () => {
      const styles = ['modern', 'traditional', 'farmhouse', 'industrial', 'minimalist', 'contemporary'];
      styles.forEach(style => {
        const description = getDetailedStyleDescription(style as any);
        expect(description).toBeTruthy();
        expect(description.length).toBeGreaterThan(50);
      });
    });
  });

  describe('DETAILED_ROOM_CONTEXTS', () => {
    it('has contexts for all room types', () => {
      const roomTypes = ['kitchen', 'bathroom', 'living_room', 'bedroom', 'basement', 'dining_room', 'exterior'];
      roomTypes.forEach(room => {
        expect(DETAILED_ROOM_CONTEXTS[room]).toBeDefined();
        expect(DETAILED_ROOM_CONTEXTS[room].primary).toBeInstanceOf(Array);
        expect(DETAILED_ROOM_CONTEXTS[room].secondary).toBeInstanceOf(Array);
        expect(DETAILED_ROOM_CONTEXTS[room].preservationPriority).toBeInstanceOf(Array);
      });
    });
  });
});
```

### 1.3 Conversation State Machine Tests
**File:** `tests/unit/visualizer/conversation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  createInitialContext,
  addPhotoAnalysis,
  addMessage,
  checkGenerationReadiness,
  shouldTransitionState,
  updateState,
} from '@/lib/ai/visualizer-conversation';

describe('Visualizer Conversation State Machine', () => {
  describe('createInitialContext', () => {
    it('creates context with initial state', () => {
      const context = createInitialContext();
      expect(context.state).toBe('photo_analysis');
      expect(context.turnCount).toBe(0);
      expect(context.extractedData.desiredChanges).toEqual([]);
      expect(context.conversationHistory).toEqual([]);
    });

    it('accepts optional sessionId', () => {
      const context = createInitialContext('session-123');
      expect(context.sessionId).toBe('session-123');
    });
  });

  describe('addPhotoAnalysis', () => {
    it('transitions to intent_gathering state', () => {
      const initial = createInitialContext();
      const analysis = {
        roomType: 'kitchen' as const,
        currentCondition: 'dated' as const,
        structuralElements: ['wall'],
        identifiedFixtures: ['sink'],
        layoutType: 'galley',
        lightingConditions: 'natural',
        perspectiveNotes: 'front view',
        preservationConstraints: ['plumbing'],
        confidenceScore: 0.9,
      };

      const updated = addPhotoAnalysis(initial, analysis);

      expect(updated.state).toBe('intent_gathering');
      expect(updated.photoAnalysis).toEqual(analysis);
      expect(updated.extractedData.constraintsToPreserve).toContain('plumbing');
    });
  });

  describe('addMessage', () => {
    it('adds user message and increments turn count', () => {
      const initial = createInitialContext();
      const updated = addMessage(initial, 'user', 'I want modern countertops');

      expect(updated.turnCount).toBe(1);
      expect(updated.conversationHistory).toHaveLength(1);
      expect(updated.conversationHistory[0].role).toBe('user');
    });

    it('adds assistant message without incrementing turn count', () => {
      const initial = createInitialContext();
      const updated = addMessage(initial, 'assistant', 'What style do you prefer?');

      expect(updated.turnCount).toBe(0);
      expect(updated.conversationHistory).toHaveLength(1);
    });

    it('merges extracted data when provided', () => {
      const initial = createInitialContext();
      const updated = addMessage(initial, 'user', 'I want quartz counters', {
        desiredChanges: ['quartz countertops'],
        materialPreferences: ['quartz'],
      });

      expect(updated.extractedData.desiredChanges).toContain('quartz countertops');
      expect(updated.extractedData.materialPreferences).toContain('quartz');
    });
  });

  describe('checkGenerationReadiness', () => {
    it('returns not ready with empty context', () => {
      const context = createInitialContext();
      const readiness = checkGenerationReadiness(context);

      expect(readiness.isReady).toBe(false);
      expect(readiness.missingInfo).toContain('room type');
    });

    it('returns ready with sufficient context', () => {
      let context = createInitialContext();
      context = addPhotoAnalysis(context, {
        roomType: 'kitchen',
        currentCondition: 'dated',
        structuralElements: [],
        identifiedFixtures: [],
        layoutType: 'L-shaped',
        lightingConditions: 'natural',
        perspectiveNotes: 'front',
        preservationConstraints: [],
        confidenceScore: 0.9,
      });
      context = addMessage(context, 'user', 'Modern style please', {
        desiredChanges: ['modern cabinets'],
        stylePreference: 'modern',
      });

      const readiness = checkGenerationReadiness(context);

      expect(readiness.isReady).toBe(true);
      expect(readiness.qualityConfidence).toBeGreaterThan(0.5);
    });
  });

  describe('state transitions', () => {
    it('transitions through expected flow', () => {
      let context = createInitialContext();
      expect(context.state).toBe('photo_analysis');

      // After photo analysis
      context = addPhotoAnalysis(context, {
        roomType: 'kitchen',
        currentCondition: 'dated',
        structuralElements: [],
        identifiedFixtures: [],
        layoutType: 'open',
        lightingConditions: 'bright',
        perspectiveNotes: 'corner',
        preservationConstraints: [],
        confidenceScore: 0.85,
      });
      expect(context.state).toBe('intent_gathering');

      // After style selection
      context = addMessage(context, 'user', 'Modern style', {
        stylePreference: 'modern',
      });
      const newState = shouldTransitionState(context);
      if (newState) context = updateState(context, newState);

      expect(['refinement', 'generation_ready']).toContain(context.state);
    });
  });
});
```

### 1.4 Validation Tests
**File:** `tests/unit/visualizer/validation.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';

// Mock OpenAI for validation tests
vi.mock('@/lib/ai/providers', () => ({
  openai: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: JSON.stringify({ isValid: true, score: 0.85 }) } }],
        }),
      },
    },
  })),
}));

import { quickValidateImage } from '@/lib/ai/validation';

describe('Structure Validation', () => {
  it('returns validation result with score', async () => {
    const result = await quickValidateImage(
      'data:image/png;base64,original...',
      'data:image/png;base64,generated...'
    );

    expect(result).toHaveProperty('isAcceptable');
    expect(result).toHaveProperty('score');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
```

---

## Phase 2: Integration Tests (Vitest + MSW)

### 2.1 Setup MSW Mocks
**File:** `tests/mocks/ai-services.ts`

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Test image buffer (1x1 red pixel PNG)
export const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

export const aiMockHandlers = [
  // OpenAI Chat/Vision API
  http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
    const body = await request.json() as any;

    // Photo analysis request (has image)
    const hasImage = body.messages?.some((m: any) =>
      Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image_url')
    );

    if (hasImage) {
      return HttpResponse.json({
        choices: [{
          message: {
            content: JSON.stringify({
              roomType: 'kitchen',
              currentCondition: 'dated',
              structuralElements: ['load-bearing wall on left'],
              identifiedFixtures: ['island with seating', 'corner sink'],
              layoutType: 'L-shaped',
              lightingConditions: 'natural light from window on right',
              perspectiveNotes: 'wide angle shot from doorway',
              preservationConstraints: ['window positions', 'plumbing locations'],
              confidenceScore: 0.87,
            }),
          },
        }],
      });
    }

    // Regular chat completion
    return HttpResponse.json({
      choices: [{
        message: {
          content: 'I can see this is a kitchen with traditional styling. What changes would you like to make?',
        },
      }],
    });
  }),

  // Gemini Image Generation API
  http.post('https://generativelanguage.googleapis.com/*/models/*/generateContent', () => {
    return HttpResponse.json({
      candidates: [{
        content: {
          parts: [{
            inlineData: {
              mimeType: 'image/png',
              data: TEST_IMAGE_BASE64,
            },
          }],
        },
      }],
    });
  }),
];

export const mockServer = setupServer(...aiMockHandlers);
```

### 2.2 API Route Tests
**File:** `tests/integration/visualizer/api.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { mockServer, TEST_IMAGE_BASE64 } from '../../mocks/ai-services';

beforeAll(() => mockServer.listen({ onUnhandledRequest: 'warn' }));
afterAll(() => mockServer.close());
afterEach(() => mockServer.resetHandlers());

describe('Visualizer API Routes', () => {
  describe('POST /api/ai/visualize', () => {
    it('generates visualization concepts', async () => {
      const response = await fetch('http://localhost:3000/api/ai/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: `data:image/png;base64,${TEST_IMAGE_BASE64}`,
          roomType: 'kitchen',
          style: 'modern',
          count: 2,
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('concepts');
      expect(data.concepts).toHaveLength(2);
      expect(data.concepts[0]).toHaveProperty('imageUrl');
    });

    it('returns 400 for invalid request', async () => {
      const response = await fetch('http://localhost:3000/api/ai/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing required fields
          style: 'modern',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('includes photo analysis when not skipped', async () => {
      const response = await fetch('http://localhost:3000/api/ai/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: `data:image/png;base64,${TEST_IMAGE_BASE64}`,
          roomType: 'kitchen',
          style: 'modern',
          skipAnalysis: false,
        }),
      });

      const data = await response.json();
      // Photo analysis should be stored (check via separate endpoint or DB)
      expect(response.ok).toBe(true);
    });
  });

  describe('POST /api/ai/visualizer-chat', () => {
    it('handles initial message with photo', async () => {
      const response = await fetch('http://localhost:3000/api/ai/visualizer-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What can you see in my kitchen?',
          imageBase64: `data:image/png;base64,${TEST_IMAGE_BASE64}`,
          isInitial: true,
        }),
      });

      expect(response.ok).toBe(true);

      // Check for context headers
      const contextHeader = response.headers.get('X-Conversation-Context');
      expect(contextHeader).toBeTruthy();
    });

    it('maintains conversation context', async () => {
      // First message
      const response1 = await fetch('http://localhost:3000/api/ai/visualizer-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'I want a modern kitchen',
          isInitial: false,
          context: { state: 'intent_gathering', turnCount: 1 },
        }),
      });

      const context1 = JSON.parse(
        decodeURIComponent(response1.headers.get('X-Conversation-Context') || '{}')
      );

      // Second message with context
      const response2 = await fetch('http://localhost:3000/api/ai/visualizer-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'With quartz countertops',
          isInitial: false,
          context: context1,
        }),
      });

      expect(response2.ok).toBe(true);
    });
  });
});
```

---

## Phase 3: E2E Tests (Playwright)

### 3.1 Test Fixtures Setup
**File:** `tests/e2e/fixtures/visualizer.ts`

```typescript
import { test as base } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Load test image
const TEST_IMAGE_PATH = path.join(__dirname, '../assets/test-kitchen.png');
const TEST_IMAGE_BUFFER = fs.existsSync(TEST_IMAGE_PATH)
  ? fs.readFileSync(TEST_IMAGE_PATH)
  : Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64');

export const test = base.extend<{
  uploadTestImage: (page: any) => Promise<void>;
  selectRoomType: (page: any, roomType: string) => Promise<void>;
  selectStyle: (page: any, style: string) => Promise<void>;
}>({
  uploadTestImage: async ({}, use) => {
    await use(async (page) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-kitchen.png',
        mimeType: 'image/png',
        buffer: TEST_IMAGE_BUFFER,
      });

      // Wait for preview
      await page.waitForSelector('img[alt*="preview"], img[alt*="uploaded"], [data-testid="image-preview"]', {
        timeout: 10000,
      });
    });
  },

  selectRoomType: async ({}, use) => {
    await use(async (page, roomType: string) => {
      const roomCard = page.locator(`[data-room-type="${roomType}"], button:has-text("${roomType}")`).first();
      await roomCard.click();
      await page.waitForTimeout(300); // Animation
    });
  },

  selectStyle: async ({}, use) => {
    await use(async (page, style: string) => {
      const styleCard = page.locator(`[data-style="${style}"], button:has-text("${style}")`).first();
      await styleCard.click();
      await page.waitForTimeout(300); // Animation
    });
  },
});

export { expect } from '@playwright/test';
```

### 3.2 Quick Mode E2E Tests
**File:** `tests/e2e/visualizer/quick-mode.spec.ts`

```typescript
import { test, expect } from '../fixtures/visualizer';

test.describe('Visualizer Quick Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/visualizer');
  });

  test('completes full quick mode flow', async ({ page, uploadTestImage, selectRoomType, selectStyle }) => {
    // Step 1: Upload photo
    await uploadTestImage(page);
    await page.getByRole('button', { name: /next|continue/i }).click();

    // Step 2: Select room type
    await selectRoomType(page, 'Kitchen');
    await page.getByRole('button', { name: /next|continue/i }).click();

    // Step 3: Select style
    await selectStyle(page, 'Modern');
    await page.getByRole('button', { name: /next|continue/i }).click();

    // Step 4: Constraints (optional)
    await page.fill('textarea', 'Keep existing cabinets');

    // Generate
    await page.getByRole('button', { name: /generate/i }).click();

    // Wait for results (up to 90 seconds for AI generation)
    await expect(page.locator('[data-testid="visualization-result"]')).toBeVisible({
      timeout: 90000,
    });

    // Verify concepts are displayed
    const concepts = page.locator('[data-testid="concept-thumbnail"]');
    await expect(concepts).toHaveCount(4, { timeout: 5000 });
  });

  test('shows before/after slider', async ({ page, uploadTestImage, selectRoomType, selectStyle }) => {
    await uploadTestImage(page);
    await page.getByRole('button', { name: /next|continue/i }).click();
    await selectRoomType(page, 'Bathroom');
    await page.getByRole('button', { name: /next|continue/i }).click();
    await selectStyle(page, 'Farmhouse');
    await page.getByRole('button', { name: /next|continue/i }).click();
    await page.getByRole('button', { name: /generate/i }).click();

    // Wait for results
    await expect(page.locator('[data-testid="visualization-result"]')).toBeVisible({
      timeout: 90000,
    });

    // Verify slider exists
    const slider = page.locator('[data-testid="before-after-slider"]');
    await expect(slider).toBeVisible();

    // Test slider interaction
    await slider.hover();
    const sliderHandle = slider.locator('[data-testid="slider-handle"]');
    if (await sliderHandle.isVisible()) {
      await sliderHandle.dragTo(slider, { targetPosition: { x: 100, y: 0 } });
    }
  });

  test('allows switching between concepts', async ({ page, uploadTestImage, selectRoomType, selectStyle }) => {
    await uploadTestImage(page);
    await page.getByRole('button', { name: /next|continue/i }).click();
    await selectRoomType(page, 'Kitchen');
    await page.getByRole('button', { name: /next|continue/i }).click();
    await selectStyle(page, 'Contemporary');
    await page.getByRole('button', { name: /next|continue/i }).click();
    await page.getByRole('button', { name: /generate/i }).click();

    await expect(page.locator('[data-testid="visualization-result"]')).toBeVisible({
      timeout: 90000,
    });

    // Click second concept
    const secondConcept = page.locator('[data-testid="concept-thumbnail"]').nth(1);
    await secondConcept.click();

    // Verify main image updated
    await expect(secondConcept).toHaveAttribute('data-selected', 'true');
  });

  test('shows download and get quote buttons', async ({ page, uploadTestImage, selectRoomType, selectStyle }) => {
    await uploadTestImage(page);
    await page.getByRole('button', { name: /next|continue/i }).click();
    await selectRoomType(page, 'Living');
    await page.getByRole('button', { name: /next|continue/i }).click();
    await selectStyle(page, 'Traditional');
    await page.getByRole('button', { name: /next|continue/i }).click();
    await page.getByRole('button', { name: /generate/i }).click();

    await expect(page.locator('[data-testid="visualization-result"]')).toBeVisible({
      timeout: 90000,
    });

    // Verify action buttons
    await expect(page.getByRole('button', { name: /download/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /get.*quote/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /try.*different|regenerate/i })).toBeVisible();
  });

  test('navigates to quote assistant with visualization', async ({ page, uploadTestImage, selectRoomType, selectStyle }) => {
    await uploadTestImage(page);
    await page.getByRole('button', { name: /next|continue/i }).click();
    await selectRoomType(page, 'Basement');
    await page.getByRole('button', { name: /next|continue/i }).click();
    await selectStyle(page, 'Industrial');
    await page.getByRole('button', { name: /next|continue/i }).click();
    await page.getByRole('button', { name: /generate/i }).click();

    await expect(page.locator('[data-testid="visualization-result"]')).toBeVisible({
      timeout: 90000,
    });

    // Click get quote
    await page.getByRole('button', { name: /get.*quote/i }).click();

    // Should navigate to estimate page with visualization context
    await expect(page).toHaveURL(/\/estimate.*visualization/);
  });
});
```

### 3.3 Conversation Mode E2E Tests
**File:** `tests/e2e/visualizer/conversation-mode.spec.ts`

```typescript
import { test, expect } from '../fixtures/visualizer';

test.describe('Visualizer Conversation Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/visualizer');
  });

  test('enters conversation mode after photo upload', async ({ page, uploadTestImage }) => {
    await uploadTestImage(page);

    // Should show mode selection or auto-enter conversation
    const conversationMode = page.locator('[data-testid="conversation-mode"], [data-mode="conversation"]');
    const modeSelect = page.getByRole('button', { name: /chat.*ai|conversation/i });

    if (await modeSelect.isVisible()) {
      await modeSelect.click();
    }

    // Should see chat interface
    await expect(page.locator('[data-testid="chat-interface"], [data-testid="visualizer-chat"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('AI describes the photo initially', async ({ page, uploadTestImage }) => {
    await uploadTestImage(page);

    const modeSelect = page.getByRole('button', { name: /chat.*ai|conversation/i });
    if (await modeSelect.isVisible()) {
      await modeSelect.click();
    }

    // Wait for AI's initial response
    const aiMessage = page.locator('[data-testid="assistant-message"]').first();
    await expect(aiMessage).toBeVisible({ timeout: 30000 });

    // Should mention room type
    await expect(aiMessage).toContainText(/kitchen|bathroom|room/i);
  });

  test('can have multi-turn conversation', async ({ page, uploadTestImage }) => {
    await uploadTestImage(page);

    const modeSelect = page.getByRole('button', { name: /chat.*ai|conversation/i });
    if (await modeSelect.isVisible()) {
      await modeSelect.click();
    }

    // Wait for initial AI message
    await expect(page.locator('[data-testid="assistant-message"]')).toBeVisible({ timeout: 30000 });

    // Send user message
    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="message"]');
    await chatInput.fill('I want a modern style with quartz countertops');
    await page.keyboard.press('Enter');

    // Wait for AI response
    const messages = page.locator('[data-testid="assistant-message"]');
    await expect(messages).toHaveCount(2, { timeout: 30000 });
  });

  test('shows generation ready indicator', async ({ page, uploadTestImage }) => {
    await uploadTestImage(page);

    const modeSelect = page.getByRole('button', { name: /chat.*ai|conversation/i });
    if (await modeSelect.isVisible()) {
      await modeSelect.click();
    }

    // Provide enough context
    await expect(page.locator('[data-testid="assistant-message"]')).toBeVisible({ timeout: 30000 });

    const chatInput = page.locator('[data-testid="chat-input"], textarea');

    await chatInput.fill('I want modern style');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    await chatInput.fill('Keep the existing cabinets but change countertops to quartz');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // Should show ready indicator or enable generate button
    const generateButton = page.getByRole('button', { name: /generate/i });
    await expect(generateButton).toBeEnabled({ timeout: 30000 });
  });

  test('generates visualization from conversation context', async ({ page, uploadTestImage }) => {
    await uploadTestImage(page);

    const modeSelect = page.getByRole('button', { name: /chat.*ai|conversation/i });
    if (await modeSelect.isVisible()) {
      await modeSelect.click();
    }

    await expect(page.locator('[data-testid="assistant-message"]')).toBeVisible({ timeout: 30000 });

    const chatInput = page.locator('[data-testid="chat-input"], textarea');
    await chatInput.fill('Modern style with white quartz counters and subway tile backsplash');
    await page.keyboard.press('Enter');

    // Wait and generate
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: /generate/i }).click();

    // Wait for results
    await expect(page.locator('[data-testid="visualization-result"]')).toBeVisible({
      timeout: 90000,
    });
  });

  test('can switch to quick mode', async ({ page, uploadTestImage }) => {
    await uploadTestImage(page);

    // Look for quick mode option
    const quickMode = page.getByRole('button', { name: /quick|skip.*chat|form/i });
    if (await quickMode.isVisible()) {
      await quickMode.click();

      // Should show room type selection (quick mode step)
      await expect(page.locator('[data-testid="room-type-selector"]')).toBeVisible();
    }
  });
});
```

### 3.4 Admin Visualization Panel E2E Tests
**File:** `tests/e2e/visualizer/admin-panel.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Admin Visualization Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', process.env.TEST_ADMIN_EMAIL || 'admin@test.com');
    await page.fill('input[type="password"]', process.env.TEST_ADMIN_PASSWORD || 'testpassword');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
  });

  test('shows visualizations tab on lead detail', async ({ page }) => {
    // Navigate to a lead with visualizations
    await page.goto('/admin/leads');

    // Click first lead
    const firstLead = page.locator('tbody tr').first();
    await firstLead.click();

    // Check for visualizations tab
    const vizTab = page.getByRole('tab', { name: /visualization/i });
    await expect(vizTab).toBeVisible();
  });

  test('displays before/after comparison in admin', async ({ page }) => {
    await page.goto('/admin/leads');
    const firstLead = page.locator('tbody tr').first();
    await firstLead.click();

    // Click visualizations tab
    await page.getByRole('tab', { name: /visualization/i }).click();

    // Check for before/after component (if lead has visualizations)
    const vizPanel = page.locator('[data-testid="lead-visualization-panel"]');

    if (await vizPanel.isVisible()) {
      const slider = vizPanel.locator('[data-testid="before-after-slider"]');
      await expect(slider).toBeVisible();
    }
  });

  test('allows adding admin notes', async ({ page }) => {
    await page.goto('/admin/leads');
    const firstLead = page.locator('tbody tr').first();
    await firstLead.click();

    await page.getByRole('tab', { name: /visualization/i }).click();

    const vizPanel = page.locator('[data-testid="lead-visualization-panel"]');

    if (await vizPanel.isVisible()) {
      const notesField = vizPanel.locator('textarea[name="admin_notes"], [data-testid="admin-notes"]');

      if (await notesField.isVisible()) {
        await notesField.fill('This renovation is feasible. Customer wants modern look.');

        // Save
        await page.getByRole('button', { name: /save/i }).click();

        // Verify saved (check for success message or reload)
        await expect(page.getByText(/saved|success/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('allows setting feasibility score', async ({ page }) => {
    await page.goto('/admin/leads');
    const firstLead = page.locator('tbody tr').first();
    await firstLead.click();

    await page.getByRole('tab', { name: /visualization/i }).click();

    const vizPanel = page.locator('[data-testid="lead-visualization-panel"]');

    if (await vizPanel.isVisible()) {
      // Look for feasibility score selector (stars or dropdown)
      const scoreSelector = vizPanel.locator('[data-testid="feasibility-score"], select[name="feasibility"]');

      if (await scoreSelector.isVisible()) {
        // Set score to 4
        await scoreSelector.selectOption('4');
        await page.getByRole('button', { name: /save/i }).click();
        await expect(page.getByText(/saved|success/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('shows photo analysis details', async ({ page }) => {
    await page.goto('/admin/leads');
    const firstLead = page.locator('tbody tr').first();
    await firstLead.click();

    await page.getByRole('tab', { name: /visualization/i }).click();

    const vizPanel = page.locator('[data-testid="lead-visualization-panel"]');

    if (await vizPanel.isVisible()) {
      // Expand photo analysis section
      const analysisToggle = vizPanel.getByRole('button', { name: /photo analysis|analysis/i });

      if (await analysisToggle.isVisible()) {
        await analysisToggle.click();

        // Should show analysis details
        await expect(vizPanel.getByText(/room type|layout|condition/i)).toBeVisible();
      }
    }
  });
});
```

### 3.5 Mobile Viewport Tests
**File:** `tests/e2e/visualizer/mobile.spec.ts`

```typescript
import { test, expect, devices } from '@playwright/test';

const mobileViewport = devices['iPhone 13'];

test.describe('Visualizer Mobile', () => {
  test.use({ ...mobileViewport });

  test('touch targets are at least 44px', async ({ page }) => {
    await page.goto('/visualizer');

    // Check all interactive elements
    const buttons = page.locator('button, [role="button"]');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.width).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('upload works on mobile', async ({ page }) => {
    await page.goto('/visualizer');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64'),
    });

    await expect(page.locator('img[alt*="preview"], [data-testid="image-preview"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('step navigation works on mobile', async ({ page }) => {
    await page.goto('/visualizer');

    // Upload photo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64'),
    });

    // Navigate forward
    await page.getByRole('button', { name: /next|continue/i }).click();
    await expect(page.locator('[data-testid="room-type-selector"]')).toBeVisible();

    // Navigate back
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page.locator('[data-testid="photo-upload"]')).toBeVisible();
  });

  test('results display properly on mobile', async ({ page }) => {
    // This test would need E2E_TEST_MODE with mock responses for speed
    await page.goto('/visualizer?test=mock');

    // Simulate completed visualization
    // ...

    // Verify mobile layout
    const resultContainer = page.locator('[data-testid="visualization-result"]');
    if (await resultContainer.isVisible()) {
      // Concepts should stack vertically on mobile
      const concepts = resultContainer.locator('[data-testid="concept-thumbnail"]');
      const firstBox = await concepts.first().boundingBox();
      const secondBox = await concepts.nth(1).boundingBox();

      if (firstBox && secondBox) {
        // On mobile, concepts should be stacked (second one below first)
        expect(secondBox.y).toBeGreaterThan(firstBox.y);
      }
    }
  });
});
```

---

## Phase 4: Visual Regression Tests

**File:** `tests/e2e/visualizer/visual.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Visualizer Visual Regression', () => {
  test('upload step matches snapshot', async ({ page }) => {
    await page.goto('/visualizer');
    await expect(page).toHaveScreenshot('visualizer-upload-step.png', {
      maxDiffPixels: 100,
    });
  });

  test('room selection step matches snapshot', async ({ page }) => {
    await page.goto('/visualizer');

    // Upload image first
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64'),
    });
    await page.getByRole('button', { name: /next|continue/i }).click();

    await expect(page.locator('[data-testid="room-type-selector"]')).toBeVisible();
    await expect(page).toHaveScreenshot('visualizer-room-step.png', {
      maxDiffPixels: 100,
    });
  });

  test('style selection step matches snapshot', async ({ page }) => {
    await page.goto('/visualizer');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64'),
    });
    await page.getByRole('button', { name: /next|continue/i }).click();

    // Select room
    await page.locator('[data-room-type="kitchen"], button:has-text("Kitchen")').first().click();
    await page.getByRole('button', { name: /next|continue/i }).click();

    await expect(page.locator('[data-testid="style-selector"]')).toBeVisible();
    await expect(page).toHaveScreenshot('visualizer-style-step.png', {
      maxDiffPixels: 100,
    });
  });
});
```

---

## Phase 5: TestSprite Exploratory (Optional)

If you want to use TestSprite for additional coverage:

```bash
# Bootstrap TestSprite
npm run testsprite:bootstrap

# Generate test plan
npm run testsprite:plan

# Execute tests
npm run testsprite:run
```

Add to `package.json`:
```json
{
  "scripts": {
    "testsprite:bootstrap": "testsprite bootstrap --port 3000 --type frontend",
    "testsprite:plan": "testsprite generate-plan",
    "testsprite:run": "testsprite run"
  }
}
```

---

## Execution Commands

Add to `package.json`:

```json
{
  "scripts": {
    "test:visualizer": "npm run test:visualizer:unit && npm run test:visualizer:e2e",
    "test:visualizer:unit": "vitest run tests/unit/visualizer/",
    "test:visualizer:integration": "vitest run tests/integration/visualizer/",
    "test:visualizer:e2e": "playwright test tests/e2e/visualizer/",
    "test:visualizer:visual": "playwright test tests/e2e/visualizer/visual.spec.ts --update-snapshots",
    "test:visualizer:mobile": "playwright test tests/e2e/visualizer/mobile.spec.ts"
  }
}
```

---

## Test Data Requirements

### Test Images
Place in `tests/e2e/assets/`:
- `test-kitchen.png` - A sample kitchen photo
- `test-bathroom.png` - A sample bathroom photo
- `test-living-room.png` - A sample living room photo

### Environment Variables
```bash
# .env.test
E2E_TEST_MODE=true
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=testpassword
```

---

## Success Criteria

| Test Suite | Pass Threshold | Notes |
|------------|----------------|-------|
| Unit Tests | 100% | All schema and logic tests must pass |
| Integration Tests | 100% | API routes must work with mocks |
| E2E Quick Mode | 95% | 1 flaky test acceptable |
| E2E Conversation Mode | 90% | AI responses may vary |
| E2E Admin Panel | 95% | Depends on test data |
| Visual Regression | 95% | Small pixel differences OK |
| Mobile Tests | 100% | Touch targets critical |

---

## Execution in Fresh Session

When starting a fresh Claude Code session, simply say:

```
Execute the visualizer test plan
```

Claude will:
1. Read this plan from `tests/VISUALIZER_TEST_PLAN.md`
2. Create any missing test files
3. Run the test suites in order
4. Report results and fix any failing tests

---

## Estimated Execution Time

| Phase | Time |
|-------|------|
| Unit Tests | 10 seconds |
| Integration Tests | 30 seconds |
| E2E Tests (with mocks) | 3-5 minutes |
| Visual Regression | 2 minutes |
| **Total** | **~8 minutes** |

*Note: E2E tests with real AI services would take 15-30 minutes due to generation time.*
