---
name: security-hardening
description: "Security patterns and OWASP compliance for the ConversionOS multi-tenant platform. Use when implementing authentication, authorization, input validation, AI output validation, RLS policies, secrets management, or reviewing code for security vulnerabilities."
---

# Security Compliance

## OWASP Top 10 Checklist

### 1. Injection Prevention

```typescript
// GOOD - Parameterized queries via Supabase SDK
const { data } = await supabase
  .from('leads')
  .select('*')
  .eq('id', leadId)
  .eq('site_id', getSiteId())

// BAD - String interpolation
// const query = `SELECT * FROM leads WHERE id = '${leadId}'`
```

### 2. Input Validation (Always Required)

```typescript
import { z } from 'zod'

const InputSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  projectType: z.enum(['kitchen', 'bathroom', 'basement', 'addition', 'other'])
})

const result = InputSchema.safeParse(userInput)
if (!result.success) {
  return { error: 'Invalid input' }
}
```

### 3. AI Output Validation (Critical)

```typescript
// ALWAYS validate AI outputs before rendering
const EstimateSchema = z.object({
  lowEstimate: z.number().min(0).max(1000000),
  highEstimate: z.number().min(0).max(1000000),
  confidence: z.enum(['low', 'medium', 'high'])
})

const aiResponse = await generateEstimate(input)
const validated = EstimateSchema.safeParse(aiResponse)
if (!validated.success) {
  return <FallbackUI />
}
```

### 4. Authentication

- Use Supabase Auth (never roll your own)
- Enforce MFA for admin accounts
- Session timeout: 24 hours max
- Secure cookie flags

### 5. Authorization (RLS + Multi-Tenancy)

```sql
-- Enable RLS on all tables with tenant data
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Scope all policies to site_id
CREATE POLICY "Tenant isolation"
ON leads FOR SELECT
USING (
  site_id = current_setting('app.site_id')
  AND auth.jwt() ->> 'role' = 'admin'
);
```

**Multi-tenant authorization is double-layered:**
1. Application layer: `getSiteId()` filters all queries
2. Database layer: RLS policies enforce site_id isolation

### 6. Secrets Management

- NEVER commit secrets to repo
- Use environment variables via Vercel
- ElevenLabs agent IDs are per-tenant env vars
- Rotate keys if exposed
- `.env` files are gitignored

### 7. Error Handling

```typescript
// GOOD - Generic user-facing errors
catch (error) {
  console.error('Internal:', error)
  return { error: 'Something went wrong' }
}

// BAD - Exposing stack traces
catch (error) {
  return { error: error.message, stack: error.stack }
}
```

### 8. XSS Prevention

```typescript
// React escapes by default, but watch for:
// BAD
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// GOOD - Use React's default escaping
<div>{userContent}</div>

// If HTML needed, sanitize first
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
```

### 9. Admin Route Protection

```typescript
// middleware.ts — protect /admin routes
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }
  return NextResponse.next()
}
```

## Security Checklist (Pre-Commit)

- [ ] No secrets in code or logs
- [ ] All inputs validated with Zod
- [ ] All AI outputs validated before render
- [ ] Parameterized queries only
- [ ] Auth on all protected routes
- [ ] RLS enabled on all tables
- [ ] Error messages don't leak internals
- [ ] All queries include site_id filter
- [ ] Dependencies up to date (`npm audit`)

## OWASP Top 10 for LLMs

### LLM01: Prompt Injection
- Never interpolate user input directly into prompts
- Sanitize and validate before AI calls

### LLM02: Insecure Output
- Validate ALL AI responses with Zod schemas
- Use fallback UI if validation fails

### LLM06: Excessive Agency
- No destructive file operations
- No unlimited API spending
- Human approval for anything irreversible

### LLM07: Sensitive Data
- No PII in logs
- No secrets in code
- No stack traces to users

## ConversionOS Specific

- Lead intake is public (no auth required)
- Admin dashboard requires auth + admin role
- Voice agent endpoints require signed URLs (no direct API key exposure)
- Each tenant's admin_settings are isolated by site_id
- Gallery uploads sanitized and size-limited
