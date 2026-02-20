---
name: nextjs-building
description: "Next.js 16 App Router patterns and best practices for ConversionOS. Use when working with server components, client components, server actions, route handlers, pages, layouts, data fetching, or any Next.js application structure questions. This is a multi-tenant app — always use getSiteId() in server components and API routes."
---

# Next.js 16 Patterns

## Server Components (Default)

All components are Server Components by default. Only add 'use client' when necessary.

```tsx
// app/page.tsx - Server Component (default)
import { createClient } from '@/lib/db/server'
import { getSiteId } from '@/lib/db/site'

export default async function Page() {
  const supabase = await createClient()
  const siteId = getSiteId()
  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('site_id', siteId)
  return <LeadList leads={data} />
}
```

**CRITICAL:** Every server component that queries the database MUST call `getSiteId()` from `src/lib/db/site.ts` and filter by `site_id`.

## Client Components (Only When Needed)

Use 'use client' only for:
- useState, useEffect, useRef hooks
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Third-party client libraries (ElevenLabs widget, chat interfaces)

```tsx
'use client'
import { useState } from 'react'

export function IntakeForm() {
  const [step, setStep] = useState(1)
  // Interactive form logic
}
```

## Server Actions (Mutations)

Prefer Server Actions over API routes for form submissions.

```tsx
// app/actions.ts
'use server'
import { z } from 'zod'
import { createClient } from '@/lib/db/server'
import { getSiteId } from '@/lib/db/site'
import { LeadSchema } from '@/lib/schemas'

export async function createLead(formData: FormData) {
  const validated = LeadSchema.parse(Object.fromEntries(formData))
  const supabase = await createClient()
  const siteId = getSiteId()
  const { data, error } = await supabase
    .from('leads')
    .insert({ ...validated, site_id: siteId })
  if (error) throw error
  return data
}
```

## Route Handlers (API Routes)

Use for webhooks, external API integrations, voice agent endpoints.

```tsx
// app/api/webhook/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSiteId } from '@/lib/db/site'

export async function POST(req: Request) {
  const body = await req.json()
  const validated = WebhookSchema.parse(body)
  const siteId = getSiteId()
  // Process webhook scoped to tenant
  return NextResponse.json({ success: true })
}
```

## Data Fetching

- Use Server Components for data fetching (no useEffect)
- Parallel fetching with Promise.all
- Streaming with Suspense for slow data
- Always scope queries to `getSiteId()`

## Error Handling

- `error.tsx` for route-level errors
- `not-found.tsx` for 404s
- `loading.tsx` for loading states

## Layout Pattern

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <main>{children}</main>
      </body>
    </html>
  )
}
```

## ConversionOS Specific

- Multi-tenant: all pages resolve tenant via `getSiteId()` (reads `NEXT_PUBLIC_SITE_ID`)
- Branding loaded from `admin_settings` table, never hardcoded
- Voice agent widget is a client component (`src/components/receptionist/`)
- Admin routes under `/admin/` require authentication
- Public routes: `/`, `/gallery`, `/contact`, `/get-quote`
- Demo routes: `/demo/[slug]` for bespoke microsites
