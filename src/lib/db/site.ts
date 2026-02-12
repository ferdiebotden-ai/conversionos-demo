/**
 * Multi-tenancy helpers for site-based data isolation.
 * Each Vercel deployment sets NEXT_PUBLIC_SITE_ID to scope all data.
 */

export function getSiteId(): string {
  const siteId = process.env['NEXT_PUBLIC_SITE_ID']
  if (!siteId) throw new Error('NEXT_PUBLIC_SITE_ID is required')
  return siteId
}

export function withSiteId<T extends Record<string, unknown>>(data: T): T & { site_id: string } {
  return { ...data, site_id: getSiteId() }
}
