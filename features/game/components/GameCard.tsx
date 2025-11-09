 'use client'

import { useRef, useState, useEffect } from 'react'
import { ExpandedGameCard } from './ExpandedGameCard'
import { useLibrary } from '@/hooks/use-library'

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
  // Similarity score from recommendation engine
  similarity_score?: number
  scoreInfo?: {
    similarity?: number
  }
}

interface GameCardProps {
  game: Game
  onAddToLibrary?: (status: 'backlog' | 'playing' | 'completed' | 'dropped') => void
  onMoreInfo?: () => void
  isLastCard?: boolean
}

export function GameCard({ 
  game, 
  onAddToLibrary, 
  onMoreInfo,
  isLastCard = false
}: GameCardProps) {
  const { getGameStatus } = useLibrary(false) // Don't auto-load library for each game card
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Get current library status for this game
  const currentStatus = getGameStatus(game.id)
  
  // Get similarity score from either field
  const similarityScore = game.similarity_score || game.scoreInfo?.similarity

  // Get button styling based on current status
  const getButtonStyle = () => {
    if (!currentStatus) {
      return 'bg-[#5d4af8] hover:bg-[#5d4af8]/90'
    }
    switch (currentStatus) {
      case 'backlog': return 'bg-blue-600 hover:bg-blue-700'
      case 'playing': return 'bg-green-600 hover:bg-green-700'
      case 'completed': return 'bg-purple-600 hover:bg-purple-700'
      case 'dropped': return 'bg-red-600 hover:bg-red-700'
      default: return 'bg-[#5d4af8] hover:bg-[#5d4af8]/90'
    }
  }

  // Get button icon based on current status
  const getButtonIcon = () => {
    if (!currentStatus) {
      return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    }
    switch (currentStatus) {
      case 'backlog': return 'B'
      case 'playing': return 'P'
      case 'completed': return '✓'
      case 'dropped': return '✕'
      default: return '+'
    }
  }

  // Get button label for aria-label
  const getButtonLabel = () => {
    if (!currentStatus) return 'Add to library'
    switch (currentStatus) {
      case 'backlog': return 'In backlog'
      case 'playing': return 'Currently playing'
      case 'completed': return 'Completed'
      case 'dropped': return 'Dropped'
      default: return 'Add to library'
    }
  }

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
       
        {/* Top-right badges container */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 items-end">
          {/* Similarity Score Badge - Only visible when available */}
          {similarityScore && (
            <div className="bg-gradient-to-r from-[#5d4af8] to-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span>{Math.round((similarityScore * 100))}% match</span>
            </div>
          )}
          
          {/* Status Badge - Always visible when game is in library */}
          {currentStatus && (
            <div className={`${getButtonStyle()} text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg flex items-center gap-1`}>
              <span className="text-sm">{getButtonIcon()}</span>
              <span className="capitalize">{currentStatus}</span>
            </div>
          )}
        </div>
       
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        {/* Enhanced game info overlay with summary and buttons */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
          {/* Action Buttons at top */}
          <div className="flex items-center space-x-2 self-start">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddToLibrary?.('backlog')
              }}
              className={`${getButtonStyle()} text-white rounded-full h-8 w-8 flex items-center justify-center transition-all duration-200`}
              aria-label={getButtonLabel()}
              title={getButtonLabel()}
            >
              {typeof getButtonIcon() === 'string' ? (
                <span className="text-sm">{getButtonIcon()}</span>
              ) : (
                getButtonIcon()
              )}
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
              {similarityScore && (
                <div className="flex items-center space-x-1 bg-[#5d4af8]/20 px-2 py-1 rounded-full">
                  <svg className="w-3 h-3 text-[#5d4af8]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#5d4af8] text-sm font-medium">
                    {Math.round((similarityScore * 100))}% match
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
      onAddToLibrary={onAddToLibrary}
      onPlay={() => {
        setIsExpanded(false)
        onMoreInfo?.()
      }}
    />
    </>
  )
}