"use client"

import React from "react"
import Link from "next/link"
import { Gamepad2, Sparkles, TrendingUp, Star, Clock, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CategoryBar() {
  const categories = [
    { 
      title: "All Games", 
      icon: Gamepad2,
      href: "/browse",
      description: "Browse all games"
    },
    { 
      title: "Popular", 
      icon: TrendingUp,
      href: "/recommendations?filter=popular",
      description: "Trending games"
    },
    { 
      title: "Get Recommendations", 
      icon: Sparkles,
      href: "/recommendations",
      description: "AI-powered game suggestions"
    },
    { 
      title: "Top Rated", 
      icon: Star,
      href: "/recommendations?filter=top-rated",
      description: "Highest rated games"
    },
    { 
      title: "New Releases", 
      icon: Clock,
      href: "/recommendations?filter=new-releases",
      description: "Latest games"
    },
    
  ]

  return (
    <nav aria-label="Game categories" className="mt-4">
      {/* match the header island width and center beneath it */}
      <div className="mx-auto w-full max-w-4xl px-4">
        <div className="flex flex-wrap justify-center gap-2 py-2">
          {categories.map((category) => {
            const Icon = category.icon
            const isRecommendations = category.title === "Get Recommendations"
            return (
              <Link key={category.title} href={category.href}>
                <Button
                  variant="secondary"
                  size="sm"
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 text-sm md:px-4 md:py-2 md:text-base group ${
                    isRecommendations 
                      ? "bg-gradient-to-r from-purple-600 via-purple-500 to-purple-700 text-white hover:from-purple-700 hover:via-purple-600 hover:to-purple-800" 
                      : "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
                  }`}
                  style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }}
                  title={category.description}
                >
                  <Icon className="h-4 w-4 md:h-5 md:w-5 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-medium">{category.title}</span>
                </Button>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
