"use client"

import * as React from "react"
import Image from "next/image"
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
  image?: string
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
            {project.image ? (
              <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                Before / After
              </div>
            )}
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
          {project.image && (
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
              <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 700px"
              />
            </div>
          )}
          <p className="text-muted-foreground">{project.description}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
