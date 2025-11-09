'use client'

import { GameCard } from './GameCard'

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

interface GameGridProps {
  games: Game[]
  title?: string
  onAddToLibrary?: (gameId: number, status?: 'backlog' | 'playing' | 'completed' | 'dropped') => void
  onMoreInfo?: (gameId: number) => void
}

export function GameGrid({ 
  games, 
  title,
  onAddToLibrary,
  onMoreInfo
}: GameGridProps) {
  if (!games || games.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-400 mb-2">No games to display</h3>
        <p className="text-gray-500">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-6 lg:px-8 xl:px-12 pb-8">
      {title && (
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white">
          {title}
        </h2>
      )}
     
      <div className="flex flex-wrap gap-4 justify-center">
        {games.map((game) => (
          <GameCard 
            key={game.id}
            game={game}
            onAddToLibrary={(status) => onAddToLibrary?.(game.id, status)}
            onMoreInfo={() => onMoreInfo?.(game.id)}
          />
        ))}
      </div>
    </div>
  )
}