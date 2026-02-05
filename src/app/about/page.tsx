import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Shield,
  Users,
  Heart,
  Target,
  MapPin,
} from "lucide-react"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about AI Reno Demo - Ontario's trusted renovation contractor. Quality craftsmanship for residential and commercial projects in the Greater Ontario Area.",
}

const values = [
  {
    icon: Heart,
    title: "Customer First",
    description:
      "Your satisfaction drives everything we do. We listen, communicate, and deliver on our promises.",
  },
  {
    icon: Target,
    title: "Quality Craftsmanship",
    description:
      "We take pride in our work. Every detail matters, from initial design to final walkthrough.",
  },
  {
    icon: Shield,
    title: "Integrity",
    description:
      "Honest pricing, realistic timelines, and transparent communication throughout your project.",
  },
]

const teamMembers = [
  {
    name: "Alex Thompson",
    role: "Owner/Operator",
    description: "Job site contact and lead craftsman",
  },
  {
    name: "Jordan Mitchell",
    role: "Business Manager",
    description: "General inquiries and project coordination",
  },
]

const serviceAreas = [
  "Greater Ontario Area",
  "Surrounding Communities",
]

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Breadcrumb */}
      <nav className="container mx-auto px-4 py-4">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li>/</li>
          <li className="text-foreground">About</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <section className="border-b border-border bg-muted/30 px-4 py-12 md:py-16">
        <div className="container mx-auto">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Building Trust With Quality Work
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              AI Reno Demo transforms homes across Ontario
              with quality craftsmanship and modern building techniques.
              Taking care of our clients is what we do best.
            </p>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="px-4 py-12 md:py-16">
        <div className="container mx-auto">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                What We Do
              </h2>
              <div className="mt-4 space-y-4 text-muted-foreground">
                <p>
                  Our past projects include both commercial and residential
                  spaces. We focus on quality craftsmanship as well as modern
                  building techniques. A clean, courteous, efficient worksite
                  is a must, and taking care of our clients is what we do best.
                </p>
                <p>
                  We offer an end-to-end client experience that includes
                  seamless communication, budgeting, on-site organization, and
                  solid, quality handiwork every time. From the design phase to
                  the last touch-ups, we&apos;ll be there working hard to finish on
                  time and on budget.
                </p>
                <p>
                  We have worked with homeowners and designers to produce work
                  we think you&apos;ll love. Call us today and bring our project
                  management skills and extensive construction experience to
                  your next project.
                </p>
              </div>
            </div>
            <div className="aspect-[4/3] rounded-lg bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">Project photos coming soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="border-y border-border bg-primary px-4 py-12 md:py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">
            Our Mission
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/90">
            To transform houses into dream homes through exceptional
            craftsmanship, innovative technology, and an unwavering commitment
            to customer satisfaction. We believe every homeowner deserves a
            renovation experience that&apos;s as enjoyable as the final result.
          </p>
        </div>
      </section>

      {/* Our Values */}
      <section className="px-4 py-12 md:py-16">
        <div className="container mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Our Values
            </h2>
            <p className="mt-2 text-muted-foreground">
              The principles that guide every project we undertake.
            </p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {values.map((value) => {
              const Icon = value.icon
              return (
                <div key={value.title} className="text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="border-t border-border bg-muted/30 px-4 py-12 md:py-16">
        <div className="container mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Meet the Team
            </h2>
            <p className="mt-2 text-muted-foreground">
              Experienced professionals dedicated to your project&apos;s success.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
            {teamMembers.map((member) => (
              <Card key={member.name}>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto size-24 rounded-full bg-muted flex items-center justify-center">
                    <Users className="size-10 text-muted-foreground" />
                  </div>
                  <p className="mt-4 font-semibold text-foreground">
                    {member.name}
                  </p>
                  <p className="text-sm text-primary">{member.role}</p>
                  <p className="text-xs text-muted-foreground mt-1">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Service Area */}
      <section className="px-4 py-12 md:py-16">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3">
              <MapPin className="size-6 text-primary" />
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Service Area
              </h2>
            </div>
            <p className="mt-4 text-muted-foreground">
              We proudly serve homeowners and businesses throughout the Greater Ontario Area
              and surrounding areas:
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {serviceAreas.map((area) => (
                <span
                  key={area}
                  className="rounded-full bg-muted px-3 py-1 text-sm text-foreground"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/30 px-4 py-12 md:py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Let&apos;s Build Something Together
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Ready to start your renovation journey? We&apos;d love to hear about
            your project and show you what&apos;s possible.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="h-12 w-full px-8 sm:w-auto">
              <Link href="/estimate">Get a Free Quote</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 w-full px-8 sm:w-auto"
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
