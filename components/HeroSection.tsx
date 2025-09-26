'use client'

import { Info } from 'lucide-react'

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

interface HeroSectionProps {
  game: Game
}

export function HeroSection({ game }: HeroSectionProps) {
  const getCoverUrl = (url?: string) => {
    if (!url) return '/placeholder-game.jpg'
    return url.replace('t_thumb', 't_1080p')
  }

  return (
    <div className="relative w-[1200px] max-w-full mx-auto h-[60vh] md:h-[72vh] lg:h-[68vh] overflow-hidden rounded-xl border border-sidebar-border/40">
      <div className="grid grid-cols-1 md:grid-cols-2 h-full">
        {/* Left: Text content */}
        <div className="relative z-10 flex items-center p-6 md:p-10 lg:p-12">
          <div className="max-w-xl space-y-4">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white">
              {game.name}
            </h1>

            <div className="flex items-center space-x-3 text-sm md:text-base">
              {game.rating && (
                <span className="bg-yellow-500 text-black px-2 py-1 rounded font-bold">
                  {Math.round(game.rating / 10)}/10
                </span>
              )}
              {game.genres && game.genres.length > 0 && (
                <div className="flex space-x-2">
                  {game.genres.slice(0, 3).map((genre, index) => (
                    <span key={index} className="text-gray-300">
                      {genre.name}
                      {index < Math.min(game.genres!.length, 3) - 1 && ' •'}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {game.summary && (
              <p className="text-base md:text-lg text-gray-300 max-w-xl line-clamp-4">
                {game.summary}
              </p>
            )}

            <div className="flex space-x-4 pt-3">
              <button className="bg-gray-600/70 text-white px-4 py-2 rounded flex items-center space-x-2 hover:bg-gray-600 transition-colors">
                <Info size={18} />
                <span>More Info</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Cover image */}
        <div className="relative h-full w-full">
          <img
            src={getCoverUrl(game.cover?.url)}
            alt={game.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* subtle gradient to left for readability */}
          <div className="absolute inset-0 bg-gradient-to-l from-black/60 to-transparent" />
        </div>
      </div>
    </div>
  )
}