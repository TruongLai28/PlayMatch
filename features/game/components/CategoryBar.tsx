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
      href: "/browse?year=2025&min_rating=90",
      description: "Trending games"
    },
    { 
      title: "Get Recs!", 
      icon: Sparkles,
      href: "/recommendations",
      description: "AI-powered game suggestions"
    },
    { 
      title: "Top Rated", 
      icon: Star,
      href: "/browse?min_rating=90",
      description: "Highest rated games"
    },
    { 
      title: "New Releases", 
      icon: Clock,
      href: "/browse?year=2025",
      description: "Latest games"
    },
    
  ]

  return (
    <nav aria-label="Game categories" className="mt-4">
      {/* center based on the Get Recs! button position */}
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 md:px-6">
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 py-2">
          {categories.map((category) => {
            const Icon = category.icon
            const isRecommendations = category.title === "Get Recs!"
            return (
              <Link key={category.title} href={category.href}>
                <Button
                  variant="secondary"
                  size="sm"
                  className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-3 py-1.5 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 text-xs sm:text-sm md:px-4 md:py-2 md:text-base group ${
                    isRecommendations 
                      ? "bg-gradient-to-r from-purple-600 via-purple-500 to-purple-700 text-white hover:from-purple-700 hover:via-purple-600 hover:to-purple-800" 
                      : "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
                  }`}
                  style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }}
                  title={category.description}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 group-hover:scale-110 transition-transform duration-200" />
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
