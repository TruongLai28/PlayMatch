'use client'

import { useState, useRef } from 'react'
import { usePinnedCard } from '@/components/pinned-card-context'
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
  genres?: Array<{ name: string }>
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
    <div className="px-4 md:px-8 lg:px-12">
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
  const { pinnedInstanceId, setPinnedInstanceId } = usePinnedCard()
  const stableRowId = rowId ?? title.replace(/\s+/g, '-').toLowerCase()
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
    <div className="group relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-4 md:px-8 lg:px-12">
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
          className="absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-black/80 hover:bg-black/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 h-12 w-12 ml-2"
          aria-label="Scroll left"
          style={{ zIndex: 100 }}
        >
          <ChevronLeft size={24} />
        </Button>
      )}

      {canScrollRight && (
        <Button
          onClick={() => scroll('right')}
          size="icon"
          variant="ghost"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-black/80 hover:bg-black/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 h-12 w-12 mr-2"
          aria-label="Scroll right"
          style={{ zIndex: 100 }}
        >
          <ChevronRight size={24} />
        </Button>
      )}
     
      {/* Games Container */}
      <div 
        ref={containerRef}
        className="flex overflow-x-auto scrollbar-hide px-4 md:px-8 lg:px-12"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {games.map((game, index) => (
          <div 
            key={game.id}
            className={`flex-shrink-0 transform-gpu will-change-transform transition-transform duration-300 ease-out ${index === games.length - 1 ? '' : 'mr-4'}`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={(e) => {
              e.stopPropagation()
              const instanceId = `${game.id}-${stableRowId}-${index}`
              setPinnedInstanceId(pinnedInstanceId === instanceId ? null : instanceId)
            }}
            style={{
              transform: hoveredIndex !== null && index > hoveredIndex ? `translateX(${Math.min(280, (index - hoveredIndex) * 20)}px)` : undefined,
            }}
          >
            <GameCard 
              game={game} 
              isLastCard={index === games.length - 1}
              isPinned={pinnedInstanceId === `${game.id}-${stableRowId}-${index}`}
              onAddToList={() => console.log('Add to list:', game.name)}
              onLike={() => console.log('Like:', game.name)}
              onMoreInfo={() => console.log('More info:', game.name)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}