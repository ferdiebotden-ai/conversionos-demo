# File Map — What Changes Per Target

## Universal Tokens (Bulk Sed)
These appear across many files. Replace all at once with `sed` or similar.

| Token | Example Value | Files |
|-------|--------------|-------|
| Company name | "McCarty Squared" | All `src/**/*.{ts,tsx}` |
| Domain | "mccartysquared.ca" | layout.tsx, emails, PDFs |
| Phone | "(519) 555-0123" | contact, footer, emails, PDFs |
| Email | "info@mccartysquared.ca" | contact, footer, emails |
| City | "London" | Multiple pages, AI knowledge |
| Province | "ON" | layout metadata, AI knowledge |
| Principal name 1 | "Garnet" | personas, about, testimonials |
| Principal name 2 | "Carisa" | personas, about |
| Brand hex color | "#1565C0" | Where hex is used directly |

## Content-Specific Files (Manual Edit)

### Company Knowledge
| File | What Changes |
|------|-------------|
| `src/lib/ai/knowledge/company.ts` | Full company data: name, founded, principals, certifications, service areas, contact info |
| `src/lib/ai/knowledge/services.ts` | All service categories with descriptions, pricing ranges |
| `src/lib/ai/knowledge/ontario-renovation.ts` | Local market references |
| `src/lib/ai/knowledge/sales-techniques.ts` | Company-specific selling points |

### Pages
| File | What Changes |
|------|-------------|
| `src/app/page.tsx` | Hero headline/subtitle, trust indicators, "Why Choose Us" cards, process steps |
| `src/app/about/page.tsx` | Team members, certifications, service areas, about copy, values |
| `src/app/contact/page.tsx` | Address, phone, email, hours, booking URL, map |
| `src/app/layout.tsx` | Metadata: title, description, OG tags, site name |
| `src/app/services/page.tsx` | Service descriptions if customized |
| `src/app/services/*/page.tsx` | Individual service page details |

### Components
| File | What Changes |
|------|-------------|
| `src/components/testimonials.tsx` | Exact quotes, author names, project types |
| `src/components/header.tsx` | Logo, company name, nav items |
| `src/components/footer.tsx` | Address, phone, email, social links, hours |
| `src/components/services-grid.tsx` | Service card descriptions (if customized) |

### AI Personas
| File | What Changes |
|------|-------------|
| `src/lib/ai/personas/receptionist.ts` | Emma's system prompt, company knowledge, greeting |
| `src/lib/ai/personas/quote-specialist.ts` | Marcus's pricing knowledge, service expertise |
| `src/lib/ai/personas/design-consultant.ts` | Mia's style awareness, design specialties |
| `src/lib/ai/personas/prompt-assembler.ts` | Company context references |
| `src/lib/ai/prompts.ts` | System prompt company name/context |

### Email Templates
| File | What Changes |
|------|-------------|
| `src/emails/lead-confirmation.tsx` | Company name, branding |
| `src/emails/new-lead-notification.tsx` | Notification recipient |
| `src/emails/session-resume.tsx` | Company name |
| `src/lib/email/invoice-email.tsx` | Company details |
| `src/lib/email/quote-email.tsx` | Company details |
| `src/lib/email/resend.ts` | From address/name |

### PDF Templates
| File | What Changes |
|------|-------------|
| `src/lib/pdf/invoice-template.tsx` | Company name, address, branding |
| `src/lib/pdf/quote-template.tsx` | Company name, address, branding |

### Style
| File | What Changes |
|------|-------------|
| `src/app/globals.css` | `--primary: oklch(L C H)` |

### Config
| File | What Changes |
|------|-------------|
| `.env.local` | `NEXT_PUBLIC_SITE_ID`, `ELEVENLABS_AGENT_*` IDs |

### Images
| File | What Changes |
|------|-------------|
| `public/images/demo/hero-kitchen.png` | AI-generated hero image |
| `public/images/demo/craftsmanship-detail.png` | AI-generated craftsmanship image |
| `public/images/demo/*.png` | Service-specific images as needed |

## Approximate Count: ~40 files per target
