# ConversionOS Demo — Bespoke Demo Factory

## What This Is
ConversionOS is an AI-powered renovation platform sold to Ontario contractors.
Each target contractor gets a bespoke demo that replaces their existing website,
showcasing AI estimates, room visualization, and voice agents (ElevenLabs).

Business: NorBot Systems Inc. | $15K setup + $497/mo per territory | 1 contractor per territory
Product: https://dashboard-rho-ten-70.vercel.app (internal pipeline dashboard)
This repo: The demo factory. `main` = base template. `bespoke/[slug]` = per-target demo.

## Stack
Next.js 16 + Tailwind v4 (OKLCH colors) + shadcn/ui + ElevenLabs Conversational AI + Gemini image gen
Deploy: Each bespoke branch → separate Vercel project

## Branch Strategy
- `main` — Base template. NEVER contains client-specific content.
- `bespoke/[slug]` — Client demo branch. One per target. Each deploys separately.
- Always branch from latest `main`. Never merge bespoke branches back.

## Bespoke Build Pipeline
Use `/bespoke-build <url>` skill. See `.claude/skills/bespoke-build/SKILL.md`.
6 stages: Scrape → Branch+Customize → Generate Images → Create Voice Agents → Build+Verify → Deploy

## Key Files That Change Per Target (~40)
See `.claude/skills/bespoke-build/file-map.md` for the complete mapping.

## ElevenLabs Voice Agents
- 3 base agents on `main`: Emma (receptionist), Marcus (quote specialist), Mia (design consultant)
- Each target gets 3 duplicated agents via `POST /v1/convai/agents/{id}/duplicate`
- Customize via `PATCH /v1/convai/agents/{id}` with target-specific prompts
- Agent IDs stored in `.env.local` per branch (env vars, zero code changes)
- Base agent IDs: ELEVENLABS_AGENT_EMMA, ELEVENLABS_AGENT_MARCUS, ELEVENLABS_AGENT_MIA

## Gemini Image Generation
- Model: `gemini-3-pro-image-preview` (configured in `src/lib/ai/gemini.ts`)
- Script: `scripts/generate-image.mjs` — reusable, takes prompt + output path
- API key: `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local`
- Every image must be stunning. These demos replace real contractor websites.

## Quality Standard
Each demo must feel hand-built for the target. NOT cookie-cutter find-and-replace.
- Match the target's brand aesthetic (colors, tone, visual style)
- Use exact quotes from their testimonials (never paraphrase)
- Reflect their actual services, certifications, and unique selling points
- AI persona prompts must reference real staff names, real services, real location
- Every AI-generated image must be photorealistic and contextually appropriate

## Auto-Memory
This project uses Claude Code auto-memory. After every build:
1. Document what worked and what didn't in `.claude/memory/build-patterns.md`
2. Document scraping challenges in `.claude/memory/scraping-patterns.md`
3. Update `.claude/memory/quality-checklist.md` with new quality criteria discovered
4. Keep `.claude/memory/MEMORY.md` under 200 lines (it's auto-loaded every session)

## Research
When unsure about AI tool capabilities, always use `/last30days` skill first.
Research files: `~/.config/last30days/memory/` (anthropic, elevenlabs, gemini ecosystems)

## Gotchas
- Write tool creates CRLF on macOS — fix shell scripts: `perl -pi -e 's/\r\n/\n/g'`
- Vercel env vars: use API (curl), NOT `echo | vercel env add` (adds newline)
- Primary color uses OKLCH: `--primary: oklch(...)` in `globals.css`
- Admin header: uses User icon, not initials. Don't re-introduce hardcoded initials.
