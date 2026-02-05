"use client"

import * as React from "react"
import { ProjectCard, type Project } from "@/components/project-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const projects: Project[] = [
  {
    id: "1",
    title: "Modern Kitchen Transformation",
    type: "kitchen",
    description:
      "Complete kitchen remodel featuring custom white shaker cabinets, quartz countertops, and a large center island. The open concept design connects seamlessly to the dining area.",
    location: "Ontario, Canada",
  },
  {
    id: "2",
    title: "Spa-Inspired Master Bathroom",
    type: "bathroom",
    description:
      "Luxurious master bathroom renovation with walk-in shower, freestanding tub, heated floors, and custom double vanity. Features large format porcelain tiles throughout.",
    location: "St. Marys, ON",
  },
  {
    id: "3",
    title: "Family Entertainment Basement",
    type: "basement",
    description:
      "Full basement finishing with home theater, wet bar, and guest bedroom. Includes soundproofing, custom built-ins, and a full bathroom.",
    location: "Ontario, Canada",
  },
  {
    id: "4",
    title: "Hardwood Flooring Installation",
    type: "flooring",
    description:
      "Whole-home hardwood flooring installation. White oak throughout main floor with coordinating engineered hardwood on upper level.",
    location: "Mitchell, ON",
  },
  {
    id: "5",
    title: "Farmhouse Kitchen Renovation",
    type: "kitchen",
    description:
      "Charming farmhouse-style kitchen with two-tone cabinets, butcher block island, and apron-front sink. Exposed beam ceiling adds character.",
    location: "Listowel, ON",
  },
  {
    id: "6",
    title: "Accessible Bathroom Remodel",
    type: "bathroom",
    description:
      "Barrier-free bathroom renovation with curbless shower, grab bars, and accessible vanity. Combines safety features with modern aesthetics.",
    location: "Ontario, Canada",
  },
  {
    id: "7",
    title: "Rental Suite Basement",
    type: "basement",
    description:
      "Legal basement apartment with separate entrance, full kitchen, living area, bedroom, and bathroom. Includes egress windows and fire separation.",
    location: "Ontario, Canada",
  },
  {
    id: "8",
    title: "Luxury Vinyl Throughout",
    type: "flooring",
    description:
      "Waterproof luxury vinyl plank installation in basement and main floor bathrooms. Features realistic oak wood look with enhanced durability.",
    location: "St. Marys, ON",
  },
]

type FilterType = "all" | Project["type"]

export function ProjectGallery() {
  const [filter, setFilter] = React.useState<FilterType>("all")

  const filteredProjects =
    filter === "all"
      ? projects
      : projects.filter((project) => project.type === filter)

  return (
    <div>
      {/* Filter Tabs */}
      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as FilterType)}
        className="w-full"
      >
        <TabsList className="mb-8 flex h-auto flex-wrap justify-center gap-2 bg-transparent p-0">
          <TabsTrigger
            value="all"
            className="rounded-full border border-border bg-background px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            All Projects
          </TabsTrigger>
          <TabsTrigger
            value="kitchen"
            className="rounded-full border border-border bg-background px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Kitchen
          </TabsTrigger>
          <TabsTrigger
            value="bathroom"
            className="rounded-full border border-border bg-background px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Bathroom
          </TabsTrigger>
          <TabsTrigger
            value="basement"
            className="rounded-full border border-border bg-background px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Basement
          </TabsTrigger>
          <TabsTrigger
            value="flooring"
            className="rounded-full border border-border bg-background px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Flooring
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Project Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No projects found in this category.
          </p>
        </div>
      )}
    </div>
  )
}

export { projects }
