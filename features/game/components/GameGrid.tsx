'use client'

import { GameCard } from './GameCard'

interface Game {
  id: number
  name: string
  cover?: {
    url: string
  }
  cover_url?: string  // Add this field
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
  viewMode?: 'grid' | 'list'
  onAddToLibrary?: (gameId: number, status?: 'backlog' | 'playing' | 'completed' | 'dropped') => void
  onMoreInfo?: (gameId: number) => void
}

export function GameGrid({ 
  games, 
  title,
  viewMode = 'grid',
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
     
      {viewMode === 'grid' ? (
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
      ) : (
        <div className="space-y-3">
          {games.map((game) => (
            <div 
              key={game.id}
              className="bg-zinc-900/50 border border-zinc-700/50 rounded-lg p-4 flex gap-4 hover:bg-zinc-800/50 transition-colors"
            >
              {/* Game Cover */}
              <div className="flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24">
                {(() => {
                  // Get cover URL from either format
                  const coverUrl = game.cover?.url || game.cover_url
                  
                  if (coverUrl) {
                    // Process the cover URL to get the right size
                    let processedUrl = coverUrl
                    
                    // Handle IGDB URLs
                    if (coverUrl.startsWith('//')) {
                      processedUrl = 'https:' + coverUrl
                    }
                    
                    // Replace thumbnail size with cover_small for list view
                    processedUrl = processedUrl
                      .replace('t_thumb', 't_cover_small')
                      .replace('t_cover_big', 't_cover_small')
                    
                    return (
                      <img 
                        src={processedUrl}
                        alt={game.name}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          // Fallback to placeholder on error
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const placeholder = target.nextElementSibling as HTMLElement
                          if (placeholder) placeholder.style.display = 'flex'
                        }}
                      />
                    )
                  }
                  
                  return null
                })()}
                {/* Fallback placeholder */}
                <div className="w-full h-full bg-zinc-700 rounded flex items-center justify-center" style={{ display: !game.cover?.url && !game.cover_url ? 'flex' : 'none' }}>
                  <span className="text-zinc-400 text-xs">No Image</span>
                </div>
              </div>

              {/* Game Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm sm:text-base mb-1 truncate">
                  {game.name}
                </h3>
                
                {/* Genres */}
                {game.genres && game.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {game.genres.slice(0, 3).map((genre) => (
                      <span 
                        key={genre.id}
                        className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Rating */}
                {(game.rating || game.total_rating) && (
                  <div className="text-yellow-400 text-sm mb-2">
                    ⭐ {Math.round(((game.rating || game.total_rating || 0) / 10))}/10
                  </div>
                )}

                {/* Similarity Score */}
                {(game.similarity_score || game.scoreInfo?.similarity) && (
                  <div className="text-green-400 text-sm mb-2">
                    🎯 {Math.round((game.similarity_score || game.scoreInfo?.similarity || 0) * 100)}% match
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => onMoreInfo?.(game.id)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                >
                  Details
                </button>
                <button
                  onClick={() => onAddToLibrary?.(game.id, 'backlog')}
                  className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}