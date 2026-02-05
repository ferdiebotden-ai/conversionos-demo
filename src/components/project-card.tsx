"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export interface Project {
  id: string
  title: string
  type: "kitchen" | "bathroom" | "basement" | "flooring"
  description: string
  location: string
}

interface ProjectCardProps {
  project: Project
}

const typeLabels: Record<Project["type"], string> = {
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  basement: "Basement",
  flooring: "Flooring",
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg">
          <div className="relative aspect-[4/3] bg-muted">
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              Before / After
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <Badge
                variant="secondary"
                className="bg-white/90 text-foreground"
              >
                {typeLabels[project.type]}
              </Badge>
            </div>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground group-hover:text-primary">
              {project.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {project.location}
            </p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{project.title}</DialogTitle>
          <DialogDescription>
            {typeLabels[project.type]} &bull; {project.location}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Before/After Images */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="aspect-[4/3] rounded-lg bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">Before photo</p>
            </div>
            <div className="aspect-[4/3] rounded-lg bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">After photo</p>
            </div>
          </div>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
