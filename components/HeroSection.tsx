'use client'

import { Play, Info } from 'lucide-react'

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
    <div className="relative h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={getCoverUrl(game.cover?.url)}
          alt={game.name}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-4 md:px-8 lg:px-12">
        <div className="max-w-2xl space-y-4">
          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white">
            {game.name}
          </h1>

          {/* Rating and Genres */}
          <div className="flex items-center space-x-4 text-sm md:text-base">
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

          {/* Description */}
          {game.summary && (
            <p className="text-lg md:text-xl text-gray-300 max-w-xl line-clamp-3">
              {game.summary}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button className="bg-white text-black px-6 py-3 rounded flex items-center space-x-2 hover:bg-gray-200 transition-colors">
              <Play size={20} fill="currentColor" />
              <span className="font-semibold">Play Now</span>
            </button>
            <button className="bg-gray-600/70 text-white px-6 py-3 rounded flex items-center space-x-2 hover:bg-gray-600 transition-colors">
              <Info size={20} />
              <span>More Info</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}