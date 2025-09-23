'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Plus, ThumbsUp, ChevronDown, Star } from 'lucide-react'

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

interface GameCardProps {
  game: Game
  onPlayClick?: () => void
  onAddToList?: () => void
  onLike?: () => void
  onMoreInfo?: () => void
  isLastCard?: boolean
}

export function GameCard({ 
  game, 
  onPlayClick, 
  onAddToList, 
  onLike, 
  onMoreInfo,
  isLastCard = false
}: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getCoverUrl = (url?: string) => {
    if (!url) return '/placeholder-game.jpg'
    return url.replace('t_thumb', 't_cover_big')
  }

  return (
    <div className="flex-shrink-0 relative">
      {/* Basic Card - Never changes, no hover effects on the image */}
      <div
        className="relative w-[280px] cursor-pointer rounded-lg overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={getCoverUrl(game.cover?.url)}
          alt={game.name}
          className="w-full h-[400px] object-cover"
        />
       
        {/* Subtle hover overlay only */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/20" />
        )}
      </div>

      {/* Description Panel - Last card on left, others on right */}
      {isHovered && (
        <div className={`absolute top-0 bg-zinc-900 rounded-lg p-4 shadow-2xl animate-in duration-200 w-[300px] h-[400px] flex flex-col z-50 ${
          isLastCard 
            ? 'right-full mr-2 slide-in-from-right-2' 
            : 'left-full ml-2 slide-in-from-left-2'
        }`}>
          {/* Action Buttons */}
          <div className="flex items-center space-x-2 mb-3 flex-shrink-0">
            <Button
              size="icon"
              className="bg-white text-black hover:bg-gray-200 rounded-full h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onPlayClick?.()
              }}
              aria-label="Play game"
            >
              <Play size={16} fill="currentColor" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="border-gray-600 text-white hover:border-white rounded-full h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onAddToList?.()
              }}
              aria-label="Add to list"
            >
              <Plus size={16} />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="border-gray-600 text-white hover:border-white rounded-full h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onLike?.()
              }}
              aria-label="Like"
            >
              <ThumbsUp size={16} />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="border-gray-600 text-white hover:border-white rounded-full h-8 w-8 ml-auto"
              onClick={(e) => {
                e.stopPropagation()
                onMoreInfo?.()
              }}
              aria-label="More info"
            >
              <ChevronDown size={16} />
            </Button>
          </div>

          {/* Game Info - Takes up remaining space */}
          <div className="flex-1 space-y-3 overflow-hidden">
            <h3 className="font-bold text-white text-lg">{game.name}</h3>
           
            {/* Rating and Genres */}
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              {game.rating && (
                <Badge className="bg-green-600 text-white hover:bg-green-700 text-sm font-bold">
                  <Star className="w-3 h-3 mr-1" fill="currentColor" />
                  {Math.round(game.rating / 10)}/10
                </Badge>
              )}
              {game.genres && game.genres.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {game.genres.slice(0, 3).map((genre) => (
                    <Badge 
                      key={genre.name}
                      variant="outline" 
                      className="border-gray-600 text-gray-400 text-sm"
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Summary - More space for text */}
            {game.summary && (
              <div className="flex-1 overflow-auto">
                <p className="text-gray-300 text-sm leading-relaxed break-words">
                  {game.summary}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}