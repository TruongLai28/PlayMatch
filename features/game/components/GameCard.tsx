 'use client'

import { useRef, useState } from 'react'
import { ExpandedGameCard } from './ExpandedGameCard'

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

interface GameCardProps {
  game: Game
  onAddToLibrary?: () => void
  onAddToList?: () => void
  onMoreInfo?: () => void
  isLastCard?: boolean
}

export function GameCard({ 
  game, 
  onAddToLibrary, 
  onAddToList, 
  onMoreInfo,
  isLastCard = false
}: GameCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const getCoverUrl = (url?: string) => {
    if (!url) {
      // Return a better placeholder that exists
      return 'https://placehold.co/400x600/1f1f2b/5d4af8?text=No+Cover'
    }
    
    // IGDB URLs come in different formats, let's handle them properly
    if (url.startsWith('//')) {
      url = 'https:' + url
    }
    
    // Replace thumbnail size with bigger cover size for IGDB images
    return url.replace('t_thumb', 't_cover_big')
  }

  return (
    <>
    <div className="flex-shrink-0 relative">
      {/* Basic Card - Never changes, no hover effects on the image */}
      <div
        ref={cardRef}
        className="relative w-[280px] cursor-pointer rounded-lg overflow-hidden focus:outline-none group/card"
        onClick={() => setIsExpanded(true)}
        onMouseDown={(e) => {
          // Prevent mouse-driven focus so the card doesn't show a focus ring when clicked
          e.preventDefault()
        }}
      >
        <img
          src={getCoverUrl(game.cover?.url || (game as any).cover_url)}
          alt={game.name}
          className="w-full h-[400px] object-cover"
        />
       
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        {/* Enhanced game info overlay with summary and buttons */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
          {/* Action Buttons at top */}
          <div className="flex items-center space-x-2 self-start">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddToLibrary?.()
              }}
              className="bg-[#5d4af8] hover:bg-[#5d4af8]/90 text-white rounded-full h-8 w-8 flex items-center justify-center transition-all duration-200"
              aria-label="Add to list"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddToList?.()
              }}
              className="bg-[#5d4af8] hover:bg-[#5d4af8]/90 text-white rounded-full h-8 w-8 flex items-center justify-center transition-all duration-200"
              aria-label="Like"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>

          {/* Game info at bottom */}
          <div className="space-y-3">
            <h3 className="text-white font-bold text-lg leading-tight">
              {game.name}
            </h3>
            
            {/* Rating and Genres */}
            <div className="flex items-center space-x-3 flex-wrap">
              {game.rating && (
                <div className="flex items-center space-x-1 bg-green-600/20 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-400 text-sm font-medium">
                    {Math.round(game.rating / 10)}/10
                  </span>
                </div>
              )}
              {game.genres && game.genres.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {game.genres.slice(0, 2).map((genre) => (
                    <span 
                      key={genre.name}
                      className="bg-gray-600/30 text-gray-300 text-xs px-2 py-1 rounded-full"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            {game.summary && (
              <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                {game.summary.length > 150 
                  ? game.summary.substring(0, 150) + '...' 
                  : game.summary
                }
              </p>
            )}

            {/* More Info Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(true)
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm"
            >
              More Info
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Expanded Game Card Modal */}
    <ExpandedGameCard
      game={game}
      isOpen={isExpanded}
      onClose={() => setIsExpanded(false)}
      onAddToLibriary={onAddToLibrary}
      onAddToList={onAddToList}
      onPlay={() => {
        setIsExpanded(false)
        onMoreInfo?.()
      }}
    />
    </>
  )
}