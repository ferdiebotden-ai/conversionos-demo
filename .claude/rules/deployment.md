# Deployment Rules

- Each tenant = separate Vercel project, all pointing to the same `main` branch
- NEVER create git branches for per-tenant customization
- Push to `main` auto-deploys ALL tenant projects simultaneously
- Tenant identity is controlled ONLY by the `NEXT_PUBLIC_SITE_ID` environment variable
- New tenants: create Vercel project → set env vars → seed admin_settings → add subdomain
- Production clients get their own Supabase project (not the shared demo one)
