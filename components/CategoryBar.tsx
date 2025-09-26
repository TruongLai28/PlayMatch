"use client"

import React from "react"
import { Gamepad2, Music, Users, Palette, Trophy } from "lucide-react"

export function CategoryBar() {
  const categories = [
    { title: "Games", icon: Gamepad2 },
    { title: "Profile", icon: Users },
    { title: "Get Recommendations", icon: Music },
    { title: "Creative", icon: Palette },
    { title: "Ratings", icon: Trophy },
  ]

  return (
    <nav aria-label="categories" className="mt-4">
      {/* match the header island width and center beneath it */}
      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="flex flex-wrap justify-center gap-3 py-2">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <div
                key={cat.title}
                className="flex items-center gap-2 rounded-full bg-sidebar-accent px-3 py-1.5 text-sidebar-accent-foreground shadow-md hover:opacity-95 text-sm md:px-5 md:py-2 md:text-base"
                style={{ boxShadow: "0 6px 18px rgba(0,0,0,0.35)" }}
              >
                <Icon className="h-5 w-5 md:h-6 md:w-6" />
                <span className="font-medium">{cat.title}</span>
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
