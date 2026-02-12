'use client';

import { Card, CardContent } from "@/components/ui/card"
import { StaggerContainer, StaggerItem } from "@/components/motion"
import { Star } from "lucide-react"

const testimonials = [
  {
    id: 1,
    quote:
      "The team did an excellent job on the complete renovation of our bathroom. They were extremely attentive to the smallest detail and kept us informed every step of the way. The work was excellent, timely, and well-priced.",
    author: "Sarah M.",
    projectType: "Bathroom Renovation",
    rating: 5,
  },
  {
    id: 2,
    quote:
      "They transformed our unfinished basement into a beautiful living space. The workmanship, attention to detail, and suggestions were outstanding. When we needed changes to our original plans, the work continued smoothly and quickly!",
    author: "David L.",
    projectType: "Basement Finishing",
    rating: 5,
  },
  {
    id: 3,
    quote:
      "From the initial quote to the final walkthrough, the entire experience was fantastic. Thoughtful planning, efficient timeline, mindful of budget, and the quality of work exceeded our expectations. We love our new kitchen!",
    author: "Emily R.",
    projectType: "Kitchen Renovation",
    rating: 5,
  },
  {
    id: 4,
    quote:
      "Professional, reliable, and the quality speaks for itself. Would highly recommend to anyone looking for a renovation contractor.",
    author: "James K.",
    projectType: "Home Renovation",
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <StaggerContainer className="grid gap-6 md:grid-cols-2">
      {testimonials.map((testimonial) => (
        <StaggerItem key={testimonial.id}>
          <TestimonialCard testimonial={testimonial} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  )
}

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof testimonials)[number]
}) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col p-6">
        {/* Star Rating */}
        <div className="flex gap-1">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star
              key={i}
              className="size-4 fill-yellow-400 text-yellow-400"
            />
          ))}
        </div>

        {/* Quote */}
        <blockquote className="mt-4 flex-1 text-muted-foreground">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>

        {/* Author */}
        <div className="mt-4 border-t border-border pt-4">
          <p className="font-semibold text-foreground">{testimonial.author}</p>
          <p className="text-sm text-muted-foreground">
            {testimonial.projectType}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export { testimonials }
