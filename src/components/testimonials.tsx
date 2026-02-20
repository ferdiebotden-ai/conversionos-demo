'use client';

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { StaggerContainer, StaggerItem } from "@/components/motion"
import { Star } from "lucide-react"

const testimonials = [
  {
    id: 1,
    quote:
      "McCarty Squared did a fantastic job renovating our house. Garnet and Carisa fully understood our vision, ensuring everything \u2014 kitchen, bathrooms and bedrooms \u2014 was perfect. We won\u2019t hesitate to call them for future projects. Highly recommend them!",
    author: "Ziad A.",
    projectType: "Whole Home Renovation",
    rating: 5,
    image: "/images/demo/kitchen-modern.png",
  },
  {
    id: 2,
    quote:
      "Garnet and Carisa helped with my apartment overhaul in a 112-year-old house. They combined what I had hoped with new ideas I had never considered and provided exceptional workmanship to complete the project. They made me feel like family and my house is now truly a home.",
    author: "Megan E.",
    projectType: "Heritage Apartment Overhaul",
    rating: 5,
    image: "/images/demo/bathroom-spa.png",
  },
  {
    id: 3,
    quote:
      "Garnet\u2019s professionalism, knowledge, and expertise are among the best in London. I\u2019ve worked with six other contractors in the past nine years, and Garnet was by far my favorite. His precise assessment and detailed education on technical aspects were invaluable.",
    author: "Jenny K. S.",
    projectType: "Home Renovation",
    rating: 5,
    image: "/images/demo/basement-entertainment.png",
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
    <Card className="h-full overflow-hidden">
      <div className="relative h-32">
        <Image
          src={testimonial.image}
          alt={testimonial.projectType}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50" />
        <div className="absolute bottom-3 left-4 flex gap-1">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star
              key={i}
              className="size-4 fill-yellow-400 text-yellow-400 drop-shadow"
            />
          ))}
        </div>
      </div>
      <CardContent className="flex h-full flex-col p-6">
        {/* Quote */}
        <blockquote className="flex-1 text-muted-foreground">
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
