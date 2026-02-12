"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"

const quickLinks = [
  { href: "/services", label: "Our Services" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
]

const services = [
  { href: "/services/kitchen", label: "Kitchens" },
  { href: "/services/bathroom", label: "Bathrooms" },
  { href: "/services/basement", label: "Basements" },
  { href: "/services/outdoor", label: "Outdoor" },
]

export function Footer() {
  const pathname = usePathname()
  const currentYear = new Date().getFullYear()

  // Hide public footer on admin routes
  if (pathname.startsWith('/admin')) {
    return null
  }

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <span className="text-xl font-bold tracking-tight text-foreground">
              AI Reno <span className="text-primary">Demo</span>
            </span>
            <p className="text-sm text-muted-foreground">
              Professional renovation services in the Greater Ontario Area.
              AI-powered lead capture and conversion platform.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Powered by <span className="font-semibold">ConversionOS</span> &mdash; Norbot Systems, Inc.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Services
            </h3>
            <ul className="space-y-3">
              {services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>Greater Ontario Area, Canada</span>
              </li>
              <li>
                <a
                  href="tel:(555) 123-4567"
                  className="flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  <Phone className="size-4 shrink-0 text-primary" />
                  (555) 123-4567
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@airenodemo.com"
                  className="flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  <Mail className="size-4 shrink-0 text-primary" />
                  info@airenodemo.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground md:flex-row">
          <p>&copy; {currentYear} AI Reno Demo. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition-colors hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-primary">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

