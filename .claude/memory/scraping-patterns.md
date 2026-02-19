# Scraping Patterns

## General Strategy
1. Scrape target homepage, about, services, contact, testimonials, gallery
2. Use Playwright MCP or WebFetch for scraping
3. Extract structured data into `bespoke-targets/[slug].json`
4. Verify all data before using — never assume

## Target #1: McCarty Squared (mccartysquared.ca)

### Site Structure
- Clean, well-organized site
- Testimonials found on homepage (Google reviews embedded)
- Services listed on dedicated services page with 13 categories
- Process steps found on services page, NOT homepage
- Booking URL on contact page (myonlinebooking.co), not in header
- Team bios: Garnet (co-owner/lead builder) + Carisa (co-owner/business manager)

### Testimonial Extraction
- Real authors used initials for last names: Ziad A., Megan E., Jenny K. S.
- Quotes MUST be exact — paraphrased versions were caught and rejected
- Source: Google reviews visible on homepage

### Certifications Found
- RenoMark (LHBA member)
- NetZero Home certified
- Houzz Pro
- London Chamber of Commerce
- LHBA (London Home Builders' Association)

### Brand Analysis
- Primary color: #1565C0 (blue) → oklch(0.45 0.18 250)
- Clean, professional aesthetic
- Tagline: "Dream. Plan. Build."
- Founded 2021

### Service Areas
20+ communities centered on London, ON:
London, Argyle, Arva, Belmont, Byron, Dorchester, Hyde Park, Ingersoll,
Komoka, Masonville, Mt Brydges, North London, Oakridge, Old North, OEV,
St Thomas, Strathroy, Tillsonburg, Woodfield, Wortley
