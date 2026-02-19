# Quality Checklist

Run this after every bespoke build. Every item must pass.

## Content Accuracy
- [ ] Hero copy matches target's actual messaging/tagline
- [ ] Testimonials are exact quotes (compare word-for-word with source)
- [ ] All services reflected accurately (check count matches)
- [ ] Certifications are real and verified (not assumed)
- [ ] Team member names and roles are correct
- [ ] Contact info (phone, email, hours, booking URL) all correct
- [ ] Service areas list is complete and accurate

## Branding
- [ ] Brand colors applied consistently (primary in globals.css)
- [ ] OKLCH values calculated correctly from hex
- [ ] Company name appears everywhere it should
- [ ] No base template company name ("ConversionOS Demo") remains

## Technical
- [ ] `npm run build` passes with zero errors
- [ ] `grep -r "ConversionOS Demo" src/` returns zero results
- [ ] `grep -r "RW" src/components/admin/` returns zero results (User icon, not initials)
- [ ] `.env.local` has correct site ID and all agent IDs
- [ ] All 3 ElevenLabs agents are valid (GET returns 200)

## AI Personas
- [ ] Receptionist (Emma) references real staff names and services
- [ ] Quote Specialist (Marcus) knows real pricing and service categories
- [ ] Design Consultant (Mia) references target's design style and specialties
- [ ] Prompt assembler uses correct company context

## Visual
- [ ] Hero image is stunning and contextually appropriate
- [ ] "Why Choose Us" image loads correctly
- [ ] Team photos are appropriate
- [ ] All service images load
- [ ] Admin panel shows User icon, not hardcoded initials
- [ ] Process section renders with correct steps

## Pages to Check
- [ ] Homepage: hero, AI features, services, "Why Choose Us", process, testimonials, CTA
- [ ] About: team, certifications (with RenoMark details), values, service area
- [ ] Services: all categories listed
- [ ] Contact: correct info, booking link works
- [ ] Estimate: AI chat works, references correct company
- [ ] Visualizer: loads correctly
- [ ] Admin: login, dashboard, header (User icon)
