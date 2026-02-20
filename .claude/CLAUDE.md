# ConversionOS Demo — Multi-Tenant Platform

## What This Is
ConversionOS is an AI-powered renovation platform sold to Ontario contractors.
Single codebase, environment-driven tenancy. Each Vercel deployment = one tenant.

Business: NorBot Systems Inc. | $15K setup + $497/mo per territory | 1 contractor per territory
Product: https://dashboard-rho-ten-70.vercel.app (internal pipeline dashboard)
This repo: The platform. One `main` branch serves ALL tenants via `NEXT_PUBLIC_SITE_ID`.

## Architecture
- **Single codebase, single branch** (`main`). NO branches per tenant.
- Tenant identity: `NEXT_PUBLIC_SITE_ID` env var → `getSiteId()` → all queries filter by `site_id`
- Branding: `admin_settings` table stores per-tenant config (name, colors, contact, pricing)
- UI: `BrandingProvider` context feeds branding to client components
- Server: `getBranding()` / `getCompanyConfig()` for SSR + AI prompts
- Deploy: Each tenant = separate Vercel project, same repo, same branch

## Adding a New Tenant (Bespoke Demo)
1. Seed `admin_settings` rows in Supabase with tenant branding
2. Create new Vercel project linked to `ferdiebotden-ai/conversionos-demo`
3. Set `NEXT_PUBLIC_SITE_ID=<slug>` + copy env vars from existing project
4. Add subdomain (e.g., `eagleview.norbotsystems.com`)
5. Optionally duplicate ElevenLabs voice agents for custom voice personas
6. Push to `main` → all tenant projects auto-deploy

## ElevenLabs Voice Agents
- 3 personas: Emma (receptionist), Marcus (quote specialist), Mia (design consultant)
- Each tenant can have duplicated agents via `POST /v1/convai/agents/{id}/duplicate`
- Customize via `PATCH /v1/convai/agents/{id}` with tenant-specific prompts
- Agent IDs stored in env vars per Vercel project (zero code changes)

## Gemini Image Generation
- Model: `gemini-3-pro-image-preview` (configured in `src/lib/ai/gemini.ts`)
- Script: `scripts/generate-image.mjs` — reusable, takes prompt + output path
- Every image must be stunning. These demos replace real contractor websites.

## Quality Standard
Each demo must feel hand-built for the target. NOT cookie-cutter.
- Match the target's brand aesthetic (colors, tone, visual style)
- Use exact quotes from their testimonials (never paraphrase)
- Reflect their actual services, certifications, and unique selling points
- AI persona prompts must reference real staff names, real services, real location

## Gotchas
- Write tool creates CRLF on macOS — fix shell scripts: `perl -pi -e 's/\r\n/\n/g'`
- Vercel env vars: use API (curl), NOT `echo | vercel env add` (adds newline)
- Primary color uses OKLCH: `--primary: oklch(...)` in `globals.css`
- Admin header: uses User icon, not initials
