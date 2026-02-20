---
name: typescript-enforcing
description: "TypeScript 5.7+ strict mode enforcement and Zod runtime validation patterns. Use when working with types, interfaces, schemas, validating inputs, avoiding 'any' type, or ensuring type safety in the codebase."
---

# TypeScript Strict Mode

## Required tsconfig.json Settings

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Rules

### No `any` Type

```typescript
// BAD
function process(data: any) { ... }

// GOOD
function process(data: unknown) {
  const validated = Schema.parse(data)
  // Now validated has proper type
}
```

### Explicit Return Types (Public Functions)

```typescript
// BAD
export function calculateTotal(items) { ... }

// GOOD
export function calculateTotal(items: LineItem[]): number { ... }
```

### Prefer Interfaces Over Types

```typescript
// GOOD - Use interface for objects
interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  status: LeadStatus
  site_id: string  // Always include for multi-tenancy
}

// GOOD - Use type for unions/aliases
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted'
```

### Zod for Runtime Validation

Always validate external data (API responses, form inputs, AI outputs).

```typescript
import { z } from 'zod'

export const LeadSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  projectType: z.enum(['kitchen', 'bathroom', 'basement', 'addition', 'other'])
})

export type Lead = z.infer<typeof LeadSchema>

// Usage
const validated = LeadSchema.safeParse(userInput)
if (!validated.success) {
  return { error: validated.error.flatten() }
}
```

### Optional Chaining + Nullish Coalescing

```typescript
// GOOD
const name = lead?.contact?.name ?? 'Unknown'

// BAD (masking null bugs)
const name = lead!.contact!.name
```

### AI Output Validation (Critical for ConversionOS)

```typescript
const EstimateSchema = z.object({
  lowEstimate: z.number().min(0),
  highEstimate: z.number().min(0),
  confidence: z.enum(['low', 'medium', 'high']),
  breakdown: z.array(z.object({
    item: z.string(),
    cost: z.number()
  }))
})

// Validate ALL AI outputs before rendering
const aiResponse = await generateEstimate(projectDetails)
const parsed = EstimateSchema.safeParse(aiResponse)
if (!parsed.success) {
  return <FallbackEstimateUI />
}
```

### Multi-Tenant Type Safety

```typescript
// Ensure site_id is always present on insertable types
interface InsertableLead extends Omit<Lead, 'id' | 'created_at'> {
  site_id: string
}

// Use withSiteId helper for type-safe inserts
import { withSiteId } from '@/lib/db/site'
const row = withSiteId({ name, email, phone })
// row is typed with site_id included
```

## Verification

Run before every commit:
```bash
npm run build  # Includes tsc
```
