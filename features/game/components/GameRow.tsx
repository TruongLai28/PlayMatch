'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { GameCard } from './GameCard'

interface Game {
  id: number
  name: string
  cover?: {
    url: string
  }
  summary?: string
  rating?: number
  total_rating?: number
  genres?: Array<{ id: number; name: string }>
  companies?: Array<{ company?: { id: number; name: string }; id?: number; name?: string }>
  platforms?: Array<{ id: number; name: string }>
  keywords?: Array<{ id: number; name: string }>
  themes?: Array<{ id: number; name: string }>
  first_release_date?: number
  release_dates?: Array<{ date: number }>
}

interface GameRowProps {
  title: string
  games: Game[]
  loading?: boolean
  showCount?: boolean
  rowId?: string
}

// Loading skeleton for game row
function GameRowSkeleton() {
  return (
    <div className="px-6 max-w-[1800px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-48 bg-zinc-700" />
        <Skeleton className="h-6 w-16 bg-zinc-700" />
      </div>
      <div className="flex space-x-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 min-w-[280px]">
            <Skeleton className="w-full h-[400px] bg-zinc-700 rounded-lg" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-3/4 bg-zinc-700" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-12 bg-zinc-700" />
                <Skeleton className="h-3 w-16 bg-zinc-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function GameRow({ title, games, loading = false, showCount = true, rowId }: GameRowProps) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current
    if (!container) return
    
    const cardWidth = 300 // Approximate card width + margin
    const scrollAmount = cardWidth * 4 // Scroll 4 cards at a time
    
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
      setScrollPosition(Math.max(0, scrollPosition - scrollAmount))
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      setScrollPosition(scrollPosition + scrollAmount)
    }
  }

  const canScrollLeft = scrollPosition > 0
  const canScrollRight = scrollPosition < (games.length - 4) * 300

  if (loading) {
    return <GameRowSkeleton />
  }

  if (!games || games.length === 0) {
    return null
  }

  return (
    <div className="group relative pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-6 max-w-[1800px] mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          {title}
        </h2>
        {showCount && (
          <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
            {games.length} games
          </Badge>
        )}
      </div>

      {/* Navigation Buttons */}
      {canScrollLeft && (
        <Button
          onClick={() => scroll('left')}
          size="icon"
          variant="ghost"
          className="absolute top-1/2 -translate-y-1/2 z-50 bg-black/80 hover:bg-black/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 h-12 w-12"
          aria-label="Scroll left"
          style={{ 
            zIndex: 100,
            left: 'max(8px, calc((100vw - 1800px) / 2 + 8px))'
          }}
        >
          <ChevronLeft size={24} />
        </Button>
      )}

      {canScrollRight && (
        <Button
          onClick={() => scroll('right')}
          size="icon"
          variant="ghost"
          className="absolute top-1/2 -translate-y-1/2 z-50 bg-black/80 hover:bg-black/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 h-12 w-12"
          aria-label="Scroll right"
          style={{ 
            zIndex: 100,
            right: 'max(8px, calc((100vw - 1800px) / 2 + 8px))'
          }}
        >
          <ChevronRight size={24} />
        </Button>
      )}
     
      {/* Games Container */}
      <div 
        ref={containerRef}
        className="flex overflow-x-auto scrollbar-hide px-6 max-w-[1800px] mx-auto"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none'
        }}
      >
        {games.map((game, index) => (
          <div 
            key={game.id}
            className={`flex-shrink-0 transform-gpu will-change-transform transition-transform duration-300 ease-out ${index === games.length - 1 ? '' : 'mr-4'}`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}

            style={{
              transform: hoveredIndex !== null && index > hoveredIndex ? `translateX(${Math.min(280, (index - hoveredIndex) * 20)}px)` : undefined,
            }}
          >
            <GameCard 
              game={game} 
              isLastCard={index === games.length - 1}
            />
          </div>
        ))}
      </div>
    </div>
  )
}