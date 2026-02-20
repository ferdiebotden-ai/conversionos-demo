/**
 * Company Knowledge Base
 * Dynamic company information for all AI agent personas.
 * Reads from admin_settings at runtime via getBranding().
 *
 * For static contexts where async isn't available, use the
 * DEFAULT_COMPANY_PROFILE / DEFAULT_COMPANY_SUMMARY exports
 * which are populated from admin_settings during SSR.
 */

import { createServiceClient } from '@/lib/db/server';
import { getSiteId } from '@/lib/db/site';

export interface CompanyConfig {
  name: string;
  location: string;
  phone: string;
  email: string;
  website: string;
  principals: string;
  tagline: string;
  founded: string;
  booking: string;
  serviceArea: string;
  certifications: string[];
  socials: { platform: string; url: string }[];
}

/**
 * Fetch company config from admin_settings.
 * Falls back to minimal defaults if DB is unavailable.
 */
export async function getCompanyConfig(): Promise<CompanyConfig> {
  try {
    const supabase = createServiceClient();
    const siteId = getSiteId();

    const { data } = await supabase
      .from('admin_settings')
      .select('key, value')
      .eq('site_id', siteId)
      .in('key', ['business_info', 'branding', 'company_profile']);

    if (!data || data.length === 0) return FALLBACK_CONFIG;

    const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
    const info = (map['business_info'] ?? {}) as Record<string, unknown>;
    const profile = (map['company_profile'] ?? {}) as Record<string, unknown>;
    const brand = (map['branding'] ?? {}) as Record<string, unknown>;

    return {
      name: (info['name'] as string) || FALLBACK_CONFIG.name,
      location: `${(info['city'] as string) || 'London'}, ${(info['province'] as string) || 'ON'}, Canada`,
      phone: (info['phone'] as string) || FALLBACK_CONFIG.phone,
      email: (info['email'] as string) || FALLBACK_CONFIG.email,
      website: (info['website'] as string) || FALLBACK_CONFIG.website,
      principals: (profile['principals'] as string) || FALLBACK_CONFIG.principals,
      tagline: (brand['tagline'] as string) || (info['tagline'] as string) || FALLBACK_CONFIG.tagline,
      founded: (profile['founded'] as string) || FALLBACK_CONFIG.founded,
      booking: (profile['booking'] as string) || FALLBACK_CONFIG.booking,
      serviceArea: (profile['serviceArea'] as string) || FALLBACK_CONFIG.serviceArea,
      certifications: (profile['certifications'] as string[]) || FALLBACK_CONFIG.certifications,
      socials: (brand['socials'] as CompanyConfig['socials']) || FALLBACK_CONFIG.socials,
    };
  } catch {
    return FALLBACK_CONFIG;
  }
}

const FALLBACK_CONFIG: CompanyConfig = {
  name: 'AI Reno Demo',
  location: 'London, ON, Canada',
  phone: '(555) 000-0000',
  email: 'demo@example.com',
  website: 'ai-reno-demo.vercel.app',
  principals: 'the team',
  tagline: 'Smart Renovations',
  founded: '2024',
  booking: '',
  serviceArea: 'London, ON and surrounding communities',
  certifications: [],
  socials: [],
};

/**
 * Build the company profile prompt from config.
 */
export function buildCompanyProfile(config: CompanyConfig): string {
  let profile = `## Company Profile
- Name: ${config.name}
- Location: ${config.location}
- Phone: ${config.phone}
- Email: ${config.email}
- Website: ${config.website}
- Principals: ${config.principals}
- Tagline: ${config.tagline}
- Founded: ${config.founded}`;

  if (config.booking) {
    profile += `\n- Booking: ${config.booking}`;
  }

  profile += `\n\n## Service Area\n${config.serviceArea}`;

  profile += `\n\n## Business Hours
Monday-Friday: 9:00 AM - 5:00 PM
Saturday: Closed
Sunday: Closed`;

  if (config.certifications.length > 0) {
    profile += `\n\n## Certifications & Memberships\n${config.certifications.map(c => `- ${c}`).join('\n')}`;
  }

  if (config.socials.length > 0) {
    profile += `\n\n## Social Media\n${config.socials.map(s => `- ${s.platform}: ${s.url}`).join('\n')}`;
  }

  profile += `\n\n## Website Pages
- /services — Overview of all renovation services
- /services/kitchen — Kitchen renovation details
- /services/bathroom — Bathroom renovation details
- /services/basement — Basement finishing details
- /services/outdoor — Outdoor living and decks
- /estimate — AI-powered renovation cost estimator
- /visualizer — AI room visualization tool
- /projects — Portfolio of completed work
- /about — Our story, team, and values
- /contact — Get in touch, request a callback`;

  return profile;
}

/**
 * Build the company summary from config.
 */
export function buildCompanySummary(config: CompanyConfig): string {
  const certs = config.certifications.length > 0
    ? ` Certified: ${config.certifications.join(', ')}.`
    : '';
  const booking = config.booking ? ` Booking: ${config.booking}` : '';

  return `${config.name} is a professional renovation company in ${config.location} run by ${config.principals}, founded in ${config.founded}. Phone: ${config.phone}. Email: ${config.email}. Tagline: "${config.tagline}".${certs}${booking}`;
}

// Legacy exports for sync contexts — these use fallback values.
// Prefer getCompanyConfig() + buildCompanyProfile() for async contexts.
export const COMPANY_PROFILE = buildCompanyProfile(FALLBACK_CONFIG);
export const COMPANY_SUMMARY = buildCompanySummary(FALLBACK_CONFIG);
