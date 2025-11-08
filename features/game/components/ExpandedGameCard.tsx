'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Star, Calendar, Users, Tag, Play, Plus, Heart, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
}

interface ExpandedGameCardProps {
  game: Game
  isOpen: boolean
  onClose: () => void
  onAddToLibrary?: (status: 'backlog' | 'playing' | 'completed' | 'dropped', hoursPlayed?: number) => void
  onLike?: () => void
  onPlay?: () => void
  showHoursInput?: boolean // Add prop to control hours input visibility
}

export function ExpandedGameCard({
  game,
  isOpen,
  onClose,
  onAddToLibrary,
  onLike,
  onPlay,
  showHoursInput = false
}: ExpandedGameCardProps) {
  const { getGameStatus, libraryLoaded } = useLibrary()
  const [isMounted, setIsMounted] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [hoursPlayed, setHoursPlayed] = useState(0)
  const [selectedStatus, setSelectedStatus] = useState<'backlog' | 'playing' | 'completed' | 'dropped' | null>(null)
  
  // Get current library status for this game
  const currentStatus = getGameStatus(game.id)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Reset selected status when modal opens
      setSelectedStatus(null)
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showStatusDropdown && !(event.target as Element).closest('.relative')) {
        setShowStatusDropdown(false)
      }
    }

    if (showStatusDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showStatusDropdown])

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

  const statusOptions = [
    { value: 'backlog', label: 'Add to Backlog', color: 'bg-blue-600 hover:bg-blue-700' },
    { value: 'playing', label: 'Currently Playing', color: 'bg-green-600 hover:bg-green-700' },
    { value: 'completed', label: 'Mark as Completed', color: 'bg-purple-600 hover:bg-purple-700' },
    { value: 'dropped', label: 'Mark as Dropped', color: 'bg-red-600 hover:bg-red-700' }
  ] as const

  // Get the current status option or selected status option
  const currentStatusOption = currentStatus ? statusOptions.find(option => option.value === currentStatus) : null
  const selectedStatusOption = selectedStatus ? statusOptions.find(option => option.value === selectedStatus) : null
  
  // Determine which option to display (prefer selected over current)
  const displayOption = selectedStatusOption || currentStatusOption
  
  // Get the button text based on current status
  const getButtonText = () => {
    if (selectedStatus) {
      return selectedStatusOption?.label || 'Add to Library'
    }
    if (currentStatus) {
      switch (currentStatus) {
        case 'backlog': return 'In Backlog'
        case 'playing': return 'Currently Playing'
        case 'completed': return 'Completed'
        case 'dropped': return 'Dropped'
        default: return 'Add to Library'
      }
    }
    return 'Add to Library'
  }

  if (!isOpen || !isMounted) return null

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Panel */}
      <div className="relative w-full max-w-6xl h-full max-h-[90vh] rounded-2xl border border-[#5d4af8]/30 bg-zinc-900/50 shadow-[0_0_20px_rgba(93,74,248,0.3)] hover:shadow-[0_0_30px_rgba(93,74,248,0.4)] transition-shadow duration-300 overflow-hidden flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-zinc-300 hover:bg-zinc-800 focus:outline-none transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Split Layout Container */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          
          {/* Left Side - Game Information */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="p-4 md:p-6 lg:p-8 pb-8">
              
              {/* Game Title */}
              <div className="mb-4 md:mb-6">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4">
                  {game.name}
                </h1>
                
                {/* Rating and Release Date Row */}
                <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-6">
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

            {/* Hours Played Input */}
            {showHoursInput && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Hours Played
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={hoursPlayed}
                    onChange={(e) => setHoursPlayed(parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5d4af8]/50 focus:border-[#5d4af8]"
                    placeholder="0"
                  />
                  <span className="text-zinc-400 text-sm">hours</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <div className="relative">
                <Button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className={`${displayOption?.color || 'bg-[#5d4af8] hover:bg-[#5d4af8]/90'} text-white px-8 py-3 text-lg font-medium flex items-center gap-2`}
                >
                  <Plus className="h-5 w-5" />
                  {getButtonText()}
                  <ChevronDown className="h-4 w-4" />
                </Button>
                
                {/* Status Dropdown */}
                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50">
                    <div className="py-2">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSelectedStatus(option.value)
                            onAddToLibrary?.(option.value, hoursPlayed)
                            setShowStatusDropdown(false)
                          }}
                          className="w-full text-left px-4 py-3 text-white hover:bg-zinc-700 transition-colors flex items-center gap-3"
                        >
                          <div className={`w-3 h-3 rounded-full ${option.color.split(' ')[0].replace('bg-', 'bg-')}`} />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                    return words.slice(0, 80).join(' ') + '...';
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
          </div>

          {/* Right Side - Game Cover */}
          <div className="w-full md:w-80 lg:w-96 bg-gradient-to-b from-zinc-800/50 to-zinc-900/50 flex items-center justify-center p-4 md:p-6 border-t md:border-t-0 md:border-l border-[#5d4af8]/20">
            <div className="relative w-full max-w-xs md:max-w-sm">
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