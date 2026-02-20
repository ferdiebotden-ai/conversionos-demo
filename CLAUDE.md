# ConversionOS — Multi-Tenant Demo Platform

White-label AI quoting platform for Ontario renovation contractors. Each tenant gets a fully branded instance from a single codebase.

## Stack
Next.js 16.1.6 (App Router) • React 19 • TypeScript 5 (strict) • Supabase (PostgreSQL) • Vercel AI SDK v6 • Tailwind v4 • shadcn/ui • Vitest • Playwright

## AI Stack
- **Chat/Vision:** OpenAI GPT-5.2
- **Image generation:** Google Gemini 3 Pro Image
- **Voice agents:** ElevenLabs (Emma, Marcus, Mia personas)
- **Validation:** Zod schemas on all AI outputs

## Commands
```bash
npm run dev          # localhost:3000
npm run build        # typecheck + build (run before commits)
npm run lint         # eslint
npm run test         # vitest unit tests
npm run test:e2e     # playwright E2E tests
```

## Multi-Tenancy
**Environment-driven.** `NEXT_PUBLIC_SITE_ID` env var controls which tenant is active.

- `getSiteId()` from `src/lib/db/site.ts` reads the env var (throws if missing)
- `withSiteId()` helper injects `site_id` into data objects
- All DB queries MUST filter by `site_id` — no exceptions
- `admin_settings` table stores per-tenant branding: business name, colors, logo, contact info, pricing
- Never hardcode tenant branding — always read from `admin_settings`
- Never create branches per tenant — all tenants deploy from `main`

## Key Directories
```
src/app/              — 50+ routes (public pages, admin dashboard, 30+ API endpoints)
  app/admin/          — Admin dashboard (leads, quotes, settings, analytics)
  app/api/            — API routes (ai/, admin/, quotes, contact, export, voice)
  app/visualizer/     — AI renovation visualizer
  app/estimate/       — Estimate request flow
src/components/       — React components
  components/admin/   — Admin UI (dashboard, leads, settings)
  components/chat/    — AI chat widget
  components/visualizer/ — Renovation visualizer UI
  components/voice/   — Voice agent UI
  components/ui/      — shadcn/ui primitives
src/lib/ai/           — AI integrations (personas, knowledge base, config)
src/lib/db/           — Database helpers (server.ts for queries, site.ts for multi-tenancy)
src/lib/email/        — Email templates (Resend)
src/lib/pdf/          — PDF generation (quotes, invoices)
src/lib/voice/        — ElevenLabs voice agent config
src/lib/schemas/      — Zod validation schemas
tests/                — Vitest unit + Playwright E2E
```

## Deployment
Each tenant = separate Vercel project pointing to the same GitHub repo (`conversionos-demo`) and `main` branch. Push to main → all tenants auto-deploy.

## Supabase
- **Demo project:** `ktpfyangnmpwufghgasx` — shared by all demo tenants, isolated by `site_id`
- **Production clients** get their own Supabase project (separate data, separate billing)
- Key tables: `admin_settings`, `leads`, `quotes`, `quote_items`, `contacts`, `chat_messages`

## Current Tenants
| Site ID | Domain | Purpose |
|---------|--------|---------|
| `demo` | `ai-reno-demo.vercel.app` | Base demo |
| `mccarty-squared` | `mccarty.norbotsystems.com` | McCarty Squared demo |

## Environment Variables
```
NEXT_PUBLIC_SITE_ID            — Tenant identifier (required)
NEXT_PUBLIC_SUPABASE_URL       — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  — Supabase anonymous key (client-safe)
SUPABASE_SERVICE_ROLE_KEY      — Supabase service role key (server-only)
OPENAI_API_KEY                 — OpenAI (GPT-5.2 chat/vision)
GOOGLE_GENERATIVE_AI_API_KEY   — Gemini (image generation)
ELEVENLABS_API_KEY             — ElevenLabs (voice agents)
ELEVENLABS_AGENT_EMMA          — Emma agent ID
ELEVENLABS_AGENT_MARCUS        — Marcus agent ID
ELEVENLABS_AGENT_MIA           — Mia agent ID
NEXT_PUBLIC_DEMO_MODE          — Enable demo mode features
```

## Adding a New Tenant
1. Seed `admin_settings` rows in Supabase with the tenant's branding (name, colors, logo, contact, pricing)
2. Create a new Vercel project linked to `conversionos-demo` repo
3. Set `NEXT_PUBLIC_SITE_ID=<tenant-slug>` + copy all other env vars
4. Add custom subdomain (e.g., `eagleview.norbotsystems.com`)
5. Push to `main` triggers deploy — done

## Patterns
**Server Components by default.** Client only for interactivity.

**AI outputs → Zod validation → render.** Never trust raw AI output.

**Mobile-first.** Test on 375px. Touch targets >=44px.

## Rules
- All DB queries must use `getSiteId()` for tenant isolation
- Never hardcode tenant-specific values (names, colors, logos, pricing)
- Never create per-tenant branches — single `main` branch serves all tenants
- Keep `admin_settings` as the single source of truth for branding
- Validate all AI outputs with Zod before rendering or storing

## Business Constants
HST: 13% • Deposit: 50%
