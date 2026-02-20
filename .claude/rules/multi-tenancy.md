# Multi-Tenancy Rules

- All database queries MUST filter by `getSiteId()` from `src/lib/db/site.ts`
- NEVER hardcode tenant-specific branding (company name, colors, contact info) in components
- Tenant branding comes from `admin_settings` table, keyed by `site_id`
- Use `withSiteId()` helper when inserting new rows
- When adding new features, always consider multi-tenant implications
- Test with at least 2 different SITE_ID values to verify isolation
