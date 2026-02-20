---
name: supabase-querying
description: "Supabase database patterns including server/client setup, Row Level Security (RLS), migrations, auth, and storage. Use when working with database queries, creating tables, setting up authentication, or managing file uploads. All queries MUST filter by site_id for multi-tenancy."
---

# Supabase Patterns

## Client Setup

### Server-Side (Server Components, Server Actions)

```typescript
// lib/db/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        }
      }
    }
  )
}
```

### Client-Side (Client Components)

```typescript
// lib/db/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Site ID Helper

```typescript
// lib/db/site.ts
export function getSiteId(): string {
  const siteId = process.env.NEXT_PUBLIC_SITE_ID
  if (!siteId) throw new Error('NEXT_PUBLIC_SITE_ID is not set')
  return siteId
}

export function withSiteId<T extends Record<string, unknown>>(data: T): T & { site_id: string } {
  return { ...data, site_id: getSiteId() }
}
```

## Multi-Tenant Query Patterns

**CRITICAL:** Every query MUST include `.eq('site_id', getSiteId())`.

```typescript
import { getSiteId, withSiteId } from '@/lib/db/site'

// Select — always filter by site_id
const { data, error } = await supabase
  .from('leads')
  .select('id, name, email, status, created_at')
  .eq('site_id', getSiteId())
  .eq('status', 'new')
  .order('created_at', { ascending: false })
  .limit(10)

// Insert — always include site_id
const { data, error } = await supabase
  .from('leads')
  .insert(withSiteId({ name, email, phone, project_type }))
  .select()
  .single()

// Update — always scope to site_id
const { error } = await supabase
  .from('leads')
  .update({ status: 'contacted' })
  .eq('id', leadId)
  .eq('site_id', getSiteId())
```

## admin_settings Table

Per-tenant configuration stored as key/value pairs.

```typescript
// Read a branding setting
const { data } = await supabase
  .from('admin_settings')
  .select('value')
  .eq('site_id', getSiteId())
  .eq('key', 'company_name')
  .single()

// Read all branding settings for current tenant
const { data: settings } = await supabase
  .from('admin_settings')
  .select('key, value')
  .eq('site_id', getSiteId())

// Convert to a key-value map
const branding = Object.fromEntries(
  (settings ?? []).map(s => [s.key, s.value])
)
```

## Row Level Security (RLS)

**Always enable RLS on tables with tenant data.**

```sql
-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Public can insert leads (intake form) but only for their site
CREATE POLICY "Anyone can submit leads for their site"
ON leads FOR INSERT
WITH CHECK (site_id = current_setting('app.site_id'));

-- Admin can view leads for their site only
CREATE POLICY "Admin can view site leads"
ON leads FOR SELECT
USING (
  site_id = current_setting('app.site_id')
  AND auth.jwt() ->> 'role' = 'admin'
);
```

## Migrations

```bash
# Create migration
npx supabase migration new add_leads_table

# Apply locally
npx supabase db push

# Deploy to production
npx supabase db push --linked
```

## Safe Migration Checklist

- [ ] All new tables include `site_id` column
- [ ] RLS policies scope to `site_id`
- [ ] Backup before destructive changes
- [ ] Test migration locally first
- [ ] Rollback script prepared
- [ ] No data loss operations without explicit approval

## TypeScript Types

Generate types from schema:
```bash
npx supabase gen types typescript --local > types/supabase.ts
```

## Storage (For Project Photos)

```typescript
// Upload image scoped to tenant
const siteId = getSiteId()
const { data, error } = await supabase.storage
  .from('project-photos')
  .upload(`${siteId}/leads/${leadId}/${filename}`, file, {
    cacheControl: '3600',
    upsert: false
  })

// Get public URL
const { data } = supabase.storage
  .from('project-photos')
  .getPublicUrl(`${siteId}/leads/${leadId}/${filename}`)
```

## ConversionOS Tables

- `leads` - Lead intake submissions (scoped by site_id)
- `admin_settings` - Per-tenant branding and configuration (keyed by site_id + key)
- `gallery_items` - Portfolio/gallery images (scoped by site_id)
- `quotes` - Generated quotes (scoped by site_id)
- `voice_interactions` - Voice agent conversation logs (scoped by site_id)
