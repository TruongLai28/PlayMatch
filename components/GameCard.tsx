 'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ThumbsUp, Star } from 'lucide-react'

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
  onAddToList?: () => void
  onLike?: () => void
  onMoreInfo?: () => void
  isLastCard?: boolean
  isPinned?: boolean
}

export function GameCard({ 
  game, 
  onAddToList, 
  onLike, 
  onMoreInfo,
  isLastCard = false
  , isPinned = false
}: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [overlayPos, setOverlayPos] = useState<{ top: number; left: number } | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Only compute position when hovered or pinned
    if ((!isHovered && !isPinned) || !cardRef.current) {
      setOverlayPos(null)
      return
    }

    const rect = cardRef.current.getBoundingClientRect()
    const overlayWidth = 300
    const overlayHeight = 400
    const gap = 8
    // Prefer showing overlay to the right; if not enough space, show to left
    const wantRight = rect.right + gap + overlayWidth <= window.innerWidth
    let left = wantRight ? rect.right + gap : rect.left - gap - overlayWidth
    // Clamp left so overlay stays inside viewport
    left = Math.max(8, Math.min(left, window.innerWidth - overlayWidth - 8))

    // Center overlay vertically relative to card; clamp to viewport
    let top = rect.top + (rect.height - overlayHeight) / 2
    top = Math.max(8, Math.min(top, window.innerHeight - overlayHeight - 8))

    setOverlayPos({ top, left })
  }, [isHovered, isPinned])

  // Recompute overlay position on scroll/resize and when card resizes
  useEffect(() => {
    if ((!isHovered && !isPinned) || !cardRef.current) return

    const recompute = () => {
      const rect = cardRef.current!.getBoundingClientRect()
      const overlayWidth = 300
      const overlayHeight = 400
      const gap = 8
      const wantRight = rect.right + gap + overlayWidth <= window.innerWidth
      let left = wantRight ? rect.right + gap : rect.left - gap - overlayWidth
      left = Math.max(8, Math.min(left, window.innerWidth - overlayWidth - 8))
      let top = rect.top + (rect.height - overlayHeight) / 2
      top = Math.max(8, Math.min(top, window.innerHeight - overlayHeight - 8))
      setOverlayPos({ top, left })
    }

    // Run once immediately
    recompute()

    // Window listeners
    window.addEventListener('scroll', recompute, { passive: true })
    window.addEventListener('resize', recompute)

    // ResizeObserver for card element
    let ro: ResizeObserver | null = null
    try {
      ro = new ResizeObserver(recompute)
      ro.observe(cardRef.current)
    } catch (e) {
      // ResizeObserver may not be available in some environments; ignore silently
    }

    return () => {
      window.removeEventListener('scroll', recompute)
      window.removeEventListener('resize', recompute)
      if (ro) ro.disconnect()
    }
  }, [isHovered, isPinned])

  const getCoverUrl = (url?: string) => {
    if (!url) return '/placeholder-game.jpg'
    return url.replace('t_thumb', 't_cover_big')
  }

  return (
    <div className="flex-shrink-0 relative">
      {/* Basic Card - Never changes, no hover effects on the image */}
      <div
        ref={cardRef}
        className="relative w-[280px] cursor-pointer rounded-lg overflow-hidden focus:outline-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={(e) => {
          // Prevent mouse-driven focus so the card doesn't show a focus ring when clicked
          e.preventDefault()
        }}
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
  {(isHovered || isPinned) && overlayPos && typeof document !== 'undefined' && createPortal(
        <div
          className={`bg-zinc-900 rounded-lg p-4 shadow-2xl duration-200 w-[300px] h-[400px] flex flex-col z-50 transform-gpu will-change-transform`}
          style={{
            position: 'fixed',
            top: overlayPos.top + 'px',
            left: overlayPos.left + 'px',
            transitionProperty: 'transform, opacity',
            pointerEvents: 'auto',
          }}
        >
          {/* Action Buttons */}
          <div className="flex items-center space-x-2 mb-3 flex-shrink-0">
            <Button
              size="icon"
              variant="outline"
              className="card-btn-outline card-btn-icon rounded-full h-8 w-8"
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
              className="card-btn-outline card-btn-icon rounded-full h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onLike?.()
              }}
              aria-label="Like"
            >
              <ThumbsUp size={16} />
            </Button>
          </div>

          {/* Game Info - Takes up remaining space */}
          <div className="flex-1 space-y-3 overflow-hidden pointer-events-auto">
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
        </div>,
        document.body
      )}
    </div>
  )
}