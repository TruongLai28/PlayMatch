'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Star, Calendar, Users, Tag, Play, Plus, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

interface ExpandedGameCardProps {
  game: Game
  isOpen: boolean
  onClose: () => void
  onAddToLibriary?: () => void
  onAddToList?: () => void
  onLike?: () => void
  onPlay?: () => void
}

export function ExpandedGameCard({
  game,
  isOpen,
  onClose,
  onAddToLibriary,
  onAddToList,
  onLike,
  onPlay
}: ExpandedGameCardProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const getCoverUrl = (url?: string) => {
    if (!url) {
      return 'https://placehold.co/400x600/1f1f2b/5d4af8?text=No+Cover'
    }
    
    if (url.startsWith('//')) {
      url = 'https:' + url
    }
    
    return url.replace('t_thumb', 't_cover_big')
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown'
    return new Date(timestamp * 1000).getFullYear().toString()
  }

  const getReleaseDate = () => {
    if (game.first_release_date) {
      return formatDate(game.first_release_date)
    }
    if (game.release_dates && game.release_dates.length > 0) {
      return formatDate(game.release_dates[0].date)
    }
    return 'Unknown'
  }

  const getCompanyNames = () => {
    if (!game.companies) return []
    return game.companies.map(comp => 
      comp.company?.name || comp.name || 'Unknown'
    ).filter(name => name !== 'Unknown').slice(0, 3)
  }

  if (!isOpen || !isMounted) return null

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Panel */}
      <div className="relative w-full max-w-6xl rounded-2xl border border-[#5d4af8]/30 bg-zinc-900/50 shadow-[0_0_20px_rgba(93,74,248,0.3)] hover:shadow-[0_0_30px_rgba(93,74,248,0.4)] transition-shadow duration-300 overflow-hidden max-h-[80vh]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-zinc-300 hover:bg-zinc-800 focus:outline-none transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Split Layout Container */}
        <div className="flex flex-col lg:flex-row min-h-[600px]">
          
          {/* Left Side - Game Information */}
          <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
            
            {/* Game Title */}
            <div className="mb-6">
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                {game.name}
              </h1>
              
              {/* Rating and Release Date Row */}
              <div className="flex items-center gap-4 mb-6">
                {(game.rating || game.total_rating) && (
                  <div className="flex items-center space-x-1 bg-green-600/20 px-3 py-2 rounded-full">
                    <Star className="h-4 w-4 text-green-400 fill-green-400" />
                    <span className="text-green-400 font-semibold text-lg">
                      {Math.round((game.rating || game.total_rating!) / 10)}/10
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">{getReleaseDate()}</span>
                </div>
                {getCompanyNames().length > 0 && (
                  <div className="flex items-center space-x-2 text-zinc-400">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{getCompanyNames()[0]}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Button
                onClick={onAddToLibriary}
                className="bg-[#5d4af8] hover:bg-[#5d4af8]/90 text-white px-8 py-3 text-lg font-medium"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add to List
              </Button>
              <Button
                onClick={onAddToList}
                variant="outline"
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 px-6 py-3"
              
              >
                <Heart className="h-4 w-4 mr-2" />
                Wishlist
              </Button>
            </div>

            {/* Game Description */}
            {game.summary && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">About</h3>
                <p className="text-zinc-300 leading-relaxed text-base">
                  {(() => {
                    const words = game.summary.split(' ');
                    if (words.length <= 130) {
                      return game.summary;
                    }
                    return words.slice(0, 110).join(' ') + '...';
                  })()}
                </p>
              </div>
            )}

            {/* Game Details Grid */}
            <div className="space-y-6">
            {/* Genres */}
            {game.genres && game.genres.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Tag className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-400 font-semibold">Genres</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {game.genres.map((genre) => (
                    <Badge 
                      key={genre.id || genre.name}
                      variant="secondary" 
                      className="bg-[#5d4af8]/20 text-[#5d4af8] border-[#5d4af8]/30"
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Platforms */}
            {game.platforms && game.platforms.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Tag className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-400 font-semibold">Platforms</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {game.platforms.slice(0, 6).map((platform) => (
                    <Badge 
                      key={platform.id || platform.name}
                      variant="outline" 
                      className="border-zinc-600 text-zinc-300"
                    >
                      {platform.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords/Themes */}
            {(game.keywords && game.keywords.length > 0) || (game.themes && game.themes.length > 0) ? (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Tag className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-400 font-semibold">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {game.keywords?.slice(0, 8).map((keyword) => (
                    <Badge 
                      key={keyword.id || keyword.name}
                      variant="secondary"
                      className="bg-zinc-800 text-zinc-300 text-xs"
                    >
                      {keyword.name}
                    </Badge>
                  ))}
                  {game.themes?.slice(0, 4).map((theme) => (
                    <Badge 
                      key={theme.id || theme.name}
                      variant="secondary"
                      className="bg-zinc-800 text-zinc-300 text-xs"
                    >
                      {theme.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Additional Companies */}
            {getCompanyNames().length > 1 && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-400 font-semibold">Companies</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getCompanyNames().map((company, index) => (
                    <Badge 
                      key={index}
                      variant="outline"
                      className="border-zinc-600 text-zinc-300"
                    >
                      {company}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            </div>
          </div>

          {/* Right Side - Game Cover */}
          <div className="w-full lg:w-96 bg-gradient-to-b from-zinc-800/50 to-zinc-900/50 flex items-center justify-center p-6 border-l border-[#5d4af8]/20">
            <div className="relative w-full max-w-sm">
              <img
                src={getCoverUrl(game.cover?.url || (game as any).cover_url)}
                alt={game.name}
                className="w-full h-auto rounded-xl shadow-[0_0_15px_rgba(93,74,248,0.2)] object-cover hover:shadow-[0_0_25px_rgba(93,74,248,0.3)] transition-shadow duration-300"
                style={{ aspectRatio: '3/4' }}
              />
              {/* Purple glow overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#5d4af8]/5 via-transparent to-transparent rounded-xl" />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}