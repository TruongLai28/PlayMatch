"use client"

import { useState, useEffect } from 'react'
import { Info, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { ExpandedGameCard } from '@/features/game/components/ExpandedGameCard'

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

interface HeroSectionProps {
  games: Game[]
}

export function HeroSection({ games }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showExpandedCard, setShowExpandedCard] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying || games.length <= 1) return

    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % games.length)
        setIsTransitioning(false)
      }, 150)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, games.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (games.length <= 1) return
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          goToPrevious()
          break
        case 'ArrowRight':
          event.preventDefault()
          goToNext()
          break
        case ' ':
        case 'Spacebar':
          event.preventDefault()
          toggleAutoPlay()
          break
        case 'Escape':
          event.preventDefault()
          setIsAutoPlaying(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [games.length])

  const goToSlide = (index: number) => {
    if (index === currentSlide || isTransitioning) return
    
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentSlide(index)
      setIsTransitioning(false)
    }, 150)
  }

  const goToPrevious = () => {
    if (isTransitioning) return
    
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + games.length) % games.length)
      setIsTransitioning(false)
    }, 150)
  }

  const goToNext = () => {
    if (isTransitioning) return
    
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % games.length)
      setIsTransitioning(false)
    }, 150)
  }

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying)
  }

  const handleMoreInfo = (game: Game) => {
    setSelectedGame(game)
    setShowExpandedCard(true)
  }

  if (!games || games.length === 0) return null

  const currentGame = games[currentSlide]
  const getCoverUrl = (url?: string) => {
    if (!url) {
      return 'https://placehold.co/800x600/1f1f2b/5d4af8?text=No+Cover'
    }
    
    // IGDB URLs come in different formats
    if (url.startsWith('//')) {
      url = 'https:' + url
    }
    
    // Replace thumbnail size with bigger cover size for IGDB images
    return url.replace('t_thumb', 't_1080p')
  }

  return (
    <div className="w-full px-2 sm:px-4 md:px-6">
      <div className="relative max-w-[1600px] mx-auto h-[45vh] sm:h-[50vh] md:h-[60vh] lg:h-[68vh] overflow-hidden rounded-lg sm:rounded-xl border-2 border-sidebar-border shadow-lg shadow-[hsl(var(--sidebar-border))] bg-gradient-to-r from-transparent to-sidebar-accent/10">
        <div className={`grid grid-cols-1 md:grid-cols-2 h-full transition-opacity duration-300 ${
          isTransitioning ? 'opacity-50' : 'opacity-100'
        }`}>
        {/* Left: Text content */}
        <div className="relative z-10 flex items-center p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12">
          <div className="max-w-xl space-y-2 sm:space-y-3 md:space-y-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
              {currentGame.name}
            </h1>

            <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm md:text-base">
              {currentGame.rating && (
                <span className="bg-yellow-500 text-black px-2 py-1 rounded font-bold text-xs sm:text-sm">
                  {Math.round(currentGame.rating / 10)}/10
                </span>
              )}
              {currentGame.genres && currentGame.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {currentGame.genres.slice(0, 2).map((genre, index) => (
                    <span key={genre.id || index} className="text-gray-300 text-xs sm:text-sm">
                      {genre.name}
                      {index < Math.min(currentGame.genres!.length, 2) - 1 && ' •'}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {currentGame.summary && (
              <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-xl line-clamp-3 md:line-clamp-4 leading-relaxed">
                {currentGame.summary}
              </p>
            )}

            <div className="flex space-x-2 sm:space-x-4 pt-2 sm:pt-3">
              <button 
                onClick={() => handleMoreInfo(currentGame)}
                className="bg-gray-600/70 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded flex items-center space-x-1 sm:space-x-2 hover:bg-gray-600 transition-colors text-sm sm:text-base"
              >
                <Info size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>More Info</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Cover image */}
        <div className="relative h-full w-full">
          <img
            src={getCoverUrl(currentGame.cover?.url)}
            alt={currentGame.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300"
          />
          {/* subtle gradient to left for readability */}
          <div className="absolute inset-0 bg-gradient-to-l from-black/60 to-transparent" />
        </div>
      </div>

      {/* Navigation Controls */}
      {games.length > 1 && (
        <>
          {/* Previous/Next Buttons */}
          <button
            onClick={goToPrevious}
            disabled={isTransitioning}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-colors disabled:opacity-50"
          >
            <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
          </button>
          
          <button
            onClick={goToNext}
            disabled={isTransitioning}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-colors disabled:opacity-50"
          >
            <ChevronRight size={20} className="sm:w-6 sm:h-6" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-1.5 sm:space-x-2">
            {games.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                  index === currentSlide
                    ? 'bg-white scale-110'
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={toggleAutoPlay}
            className="absolute top-2 sm:top-4 right-2 sm:right-4 z-20 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-colors"
          >
            {isAutoPlaying ? <Pause size={16} className="sm:w-5 sm:h-5" /> : <Play size={16} className="sm:w-5 sm:h-5" />}
          </button>

          {/* Progress Bar */}
          {isAutoPlaying && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-black/30">
              <div 
                className="h-full bg-purple-700 animate-pulse"
                style={{ 
                  width: '100%',
                  animation: isTransitioning 
                    ? 'none' 
                    : 'slideProgress 5s linear infinite'
                }}
              />
            </div>
          )}
        </>
      )}

      <style jsx>{`
        @keyframes slideProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        .slideshow-progress {
          animation: slideProgress 5s linear infinite;
        }
      `}</style>
      </div>

      {/* Expanded Game Card Modal */}
      {selectedGame && (
        <ExpandedGameCard
          game={selectedGame}
          isOpen={showExpandedCard}
          onClose={() => {
            setShowExpandedCard(false)
            setSelectedGame(null)
          }}
          onAddToLibrary={(status) => {
            console.log(`Adding game ${selectedGame.id} to library with status: ${status}`)
            // You can implement actual library functionality here
          }}
        />
      )}
    </div>
  )
}
