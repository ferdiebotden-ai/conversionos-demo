---
name: multi-tenancy
description: "Multi-tenant architecture patterns for ConversionOS. Use when adding new features, creating new tables, onboarding tenants, understanding data isolation, or working with per-tenant branding and configuration."
---

# Multi-Tenancy Architecture

ConversionOS is a multi-tenant platform where a single codebase serves multiple renovation contractor clients. Each tenant gets their own Vercel deployment, but all deployments share the same `main` branch.

## Core Architecture

```
┌─────────────────────────────────────────────────┐
│                  Git: main branch                │
│               (single codebase)                  │
└──────────┬──────────┬──────────┬────────────────┘
           │          │          │
    ┌──────▼──┐ ┌─────▼───┐ ┌───▼───────┐
    │ Vercel  │ │ Vercel  │ │ Vercel    │
    │ Project │ │ Project │ │ Project   │
    │ Tenant A│ │ Tenant B│ │ Tenant C  │
    └────┬────┘ └────┬────┘ └────┬──────┘
         │           │           │
    SITE_ID=a   SITE_ID=b   SITE_ID=c
         │           │           │
    ┌────▼───────────▼───────────▼──────┐
    │         Supabase Database          │
    │  (all tables have site_id column)  │
    └────────────────────────────────────┘
```

## How Tenant Identity Works

### Environment Variable

Each Vercel project sets `NEXT_PUBLIC_SITE_ID` to a unique identifier (e.g., `mccarty-squared`, `red-white-reno`).

### getSiteId() Helper

```typescript
// src/lib/db/site.ts
export function getSiteId(): string {
  const siteId = process.env.NEXT_PUBLIC_SITE_ID
  if (!siteId) throw new Error('NEXT_PUBLIC_SITE_ID is not set')
  return siteId
}

export function withSiteId<T extends Record<string, unknown>>(data: T): T & { site_id: string } {
  return { ...data, site_id: getSiteId() }
}
```

**Every server component, server action, and API route** that touches the database must call `getSiteId()` and use it to filter queries.

## admin_settings Table

Per-tenant branding and configuration is stored as key/value pairs.

### Schema

```sql
CREATE TABLE admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, key)
);
```

### Standard Keys

| Key | Description | Example |
|-----|-------------|---------|
| `company_name` | Display name | "McCarty Squared Inc." |
| `tagline` | Company tagline | "Building Dreams, Squared" |
| `primary_color` | Brand primary color | "#1B365D" |
| `secondary_color` | Brand accent color | "#C5A572" |
| `logo_url` | Logo image URL | "https://..." |
| `phone` | Contact phone | "+15195551234" |
| `email` | Contact email | "info@mccarty.ca" |
| `address` | Physical address | "123 Main St, London, ON" |
| `service_area` | Service region | "London & Southwestern Ontario" |
| `google_rating` | Google review rating | "4.8" |
| `google_review_count` | Number of reviews | "127" |

### Reading Branding in Components

```typescript
// Server component
import { createClient } from '@/lib/db/server'
import { getSiteId } from '@/lib/db/site'

export async function BrandedHeader() {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('admin_settings')
    .select('key, value')
    .eq('site_id', getSiteId())

  const branding = Object.fromEntries(
    (settings ?? []).map(s => [s.key, s.value])
  )

  return (
    <header style={{ backgroundColor: branding.primary_color }}>
      <img src={branding.logo_url} alt={branding.company_name} />
      <h1>{branding.company_name}</h1>
    </header>
  )
}
```

**NEVER hardcode tenant-specific values** (company names, colors, phone numbers) in components. Always read from `admin_settings`.

## Data Isolation

### All Tables Must Have site_id

Every table that contains tenant data MUST include a `site_id TEXT NOT NULL` column.

```sql
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id TEXT NOT NULL,  -- REQUIRED
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  project_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast tenant-scoped queries
CREATE INDEX idx_leads_site_id ON leads(site_id);
```

### All Queries Must Filter by site_id

```typescript
// CORRECT
const { data } = await supabase
  .from('leads')
  .select('*')
  .eq('site_id', getSiteId())

// WRONG — returns data from ALL tenants
const { data } = await supabase
  .from('leads')
  .select('*')
```

### Insert with withSiteId

```typescript
import { withSiteId } from '@/lib/db/site'

const { data } = await supabase
  .from('leads')
  .insert(withSiteId({
    name: 'John Doe',
    email: 'john@example.com',
    project_type: 'kitchen',
  }))
```

## How to Add a New Tenant

### 1. Seed admin_settings

```sql
INSERT INTO admin_settings (site_id, key, value) VALUES
  ('new-tenant', 'company_name', 'New Tenant Co.'),
  ('new-tenant', 'tagline', 'Quality Renovations'),
  ('new-tenant', 'primary_color', '#2563EB'),
  ('new-tenant', 'secondary_color', '#F59E0B'),
  ('new-tenant', 'logo_url', 'https://...'),
  ('new-tenant', 'phone', '+15195551234'),
  ('new-tenant', 'email', 'info@newtenant.ca'),
  ('new-tenant', 'address', '456 Oak St, London, ON'),
  ('new-tenant', 'service_area', 'London, ON');
```

### 2. Create Vercel Project

```bash
# Create project pointing to same repo, dashboard/ subdirectory
vercel project create new-tenant-site
```

### 3. Set Environment Variables

```bash
# Set NEXT_PUBLIC_SITE_ID — this is the tenant identity
NEXT_PUBLIC_SITE_ID=new-tenant

# Supabase credentials (shared or dedicated)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# AI provider keys
OPENAI_API_KEY=...
ELEVENLABS_API_KEY=...

# Tenant-specific voice agent IDs
ELEVENLABS_AGENT_EMMA=...
ELEVENLABS_AGENT_MARCUS=...
ELEVENLABS_AGENT_MIA=...
```

### 4. Add Subdomain (Optional)

Configure custom domain in Vercel project settings or use the `.vercel.app` URL.

### 5. Deploy

Push to `main` — all tenant projects auto-deploy simultaneously.

## Deployment Model

- **One codebase, one branch:** All tenants run the same code from `main`
- **NEVER create per-tenant branches:** Customization is data-driven via `admin_settings`
- **Push to main = deploy all:** Every push auto-deploys every tenant project
- **Production clients:** Get their own Supabase project (separate database) for full isolation
- **Demo/dev tenants:** Share the demo Supabase project

## Adding New Features

When building any new feature, always:

1. Include `site_id` column on any new tables
2. Filter by `getSiteId()` in all queries
3. Read tenant-specific config from `admin_settings` instead of hardcoding
4. Test with at least 2 different `NEXT_PUBLIC_SITE_ID` values
5. Consider: "If I deploy this to 10 tenants, does it still work?"

## Related Skills

- `supabase-patterns` — Database queries and RLS
- `nextjs-patterns` — Server components and data fetching
- `security-compliance` — RLS policies and auth
