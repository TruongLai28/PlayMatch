'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { GameGrid } from '@/components/GameGrid'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Sparkles, RefreshCw, Search, Gamepad2, X, TrendingUp, Star, Clock } from 'lucide-react'

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
  source?: string
}

interface SearchResult {
  query: string
  results: Game[]
  total: number
}

interface RecommendationResponse {
  seed: Game
  dbPool: Game[]
  igdbPool: Game[]
}

export default function RecommendationsPage() {
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter')
  
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null)
  const [categoryGames, setCategoryGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState<string>('')
  const [searchResults, setSearchResults] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Search for games by name
  const searchGames = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    try {
      setSearchLoading(true)
      const response = await fetch(`/api/games/search?q=${encodeURIComponent(query)}&limit=5`)
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data: SearchResult = await response.json()
      setSearchResults(data.results)
      setShowSearchResults(true)
    } catch (err) {
      console.error('Search error:', err)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput && !selectedGame) {
        searchGames(searchInput)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput, selectedGame])

  const fetchRecommendations = async (gameId?: number) => {
    const targetGameId = gameId || selectedGame?.id
    if (!targetGameId) {
      setError('Please select a game to get recommendations')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setShowSearchResults(false)
      
      const response = await fetch(`/api/rec-engine?seedGameId=${targetGameId}`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch recommendations')
      }
      
      const data: RecommendationResponse = await response.json()
      setRecommendations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setRecommendations(null)
    } finally {
      setLoading(false)
    }
  }

  const selectGame = (game: Game) => {
    setSelectedGame(game)
    setSearchInput(game.name)
    setShowSearchResults(false)
    setSearchResults([])
  }

  const clearSelection = () => {
    setSelectedGame(null)
    setSearchInput('')
    setShowSearchResults(false)
    setSearchResults([])
  }

  // Fetch games based on category filter
  const fetchCategoryGames = async (category: string) => {
    try {
      setLoading(true)
      setError(null)
      
      let endpoint = ''
      switch (category) {
        case 'popular':
          endpoint = '/api/games/popular'
          break
        case 'top-rated':
          endpoint = '/api/games/popular' // Can be same as popular for now
          break
        case 'new-releases':
          endpoint = '/api/games/new-releases'
          break
        default:
          endpoint = '/api/games/recommendations'
      }
      
      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error('Failed to fetch games')
      }
      
      const data = await response.json()
      setCategoryGames(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setCategoryGames([])
    } finally {
      setLoading(false)
    }
  }

  // Load category games on mount if filter is present
  useEffect(() => {
    if (filter) {
      fetchCategoryGames(filter)
    }
  }, [filter])



  const allGames = recommendations ? [...recommendations.dbPool, ...recommendations.igdbPool] : []

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 lg:p-12">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Finding perfect games for you...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="px-4 md:px-8 lg:px-12 pt-8 pb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {filter === 'popular' && <TrendingUp className="w-6 h-6 text-primary" />}
              {filter === 'top-rated' && <Star className="w-6 h-6 text-primary" />}
              {filter === 'new-releases' && <Clock className="w-6 h-6 text-primary" />}
              {!filter && <Sparkles className="w-6 h-6 text-primary" />}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                {filter === 'popular' && 'Popular Games'}
                {filter === 'top-rated' && 'Top Rated Games'}
                {filter === 'new-releases' && 'New Releases'}
                {!filter && 'Game Recommendations'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {filter === 'popular' && 'Discover the most trending games right now'}
                {filter === 'top-rated' && 'Explore the highest rated games of all time'}
                {filter === 'new-releases' && 'Check out the latest game releases'}
                {!filter && 'Get personalized recommendations based on games you love'}
              </p>
            </div>
          </div>
        </div>

        {/* Game Search Input - Only show for personalized recommendations */}
        {!filter && (
          <div className="mt-6 space-y-4">
            <div className="relative max-w-md">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Search for a game (e.g., The Witcher 3, GTA V, Minecraft)"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && selectedGame) {
                        fetchRecommendations()
                      }
                    }}
                    className="pr-8"
                  />
                  {selectedGame && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                      onClick={clearSelection}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <Button 
                  onClick={() => fetchRecommendations()} 
                  disabled={loading || !selectedGame}
                >
                  {searchLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Get Recommendations
                </Button>
              </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {searchResults.map((game) => (
                  <button
                    key={game.id}
                    className="w-full text-left px-4 py-3 hover:bg-muted border-b last:border-b-0 focus:bg-muted focus:outline-none"
                    onClick={() => selectGame(game)}
                  >
                    <div className="font-medium">{game.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>ID: {game.id}</span>
                      {game.source && (
                        <Badge variant="outline" className="text-xs">
                          {game.source === 'database' ? 'Database' : 'IGDB'}
                        </Badge>
                      )}
                      {game.rating && (
                        <span>Rating: {Math.round(game.rating)}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {showSearchResults && searchResults.length === 0 && !searchLoading && searchInput && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 px-4 py-3">
                <div className="text-sm text-muted-foreground">No games found for "{searchInput}"</div>
              </div>
            )}
          </div>
          
          {selectedGame && (
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-primary" />
              <span className="text-sm">
                Selected: <strong>{selectedGame.name}</strong> 
                <span className="text-muted-foreground ml-2">(ID: {selectedGame.id})</span>
              </span>
            </div>
          )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Stats */}
        {(recommendations || (filter && categoryGames.length > 0)) && (
          <div className="flex items-center gap-4 mt-6">
            <Badge variant="secondary">
              {filter ? categoryGames.length : allGames.length} games found
            </Badge>
            {!filter && recommendations && (
              <>
                <Badge variant="outline">
                  {recommendations.dbPool.length} from database
                </Badge>
                <Badge variant="outline">
                  {recommendations.igdbPool.length} from IGDB
                </Badge>
              </>
            )}
            {filter && (
              <Badge variant="outline">
                {filter.replace('-', ' ')} category
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Games Grid */}
      {filter && categoryGames.length > 0 ? (
        <GameGrid games={categoryGames} />
      ) : recommendations && allGames.length > 0 ? (
        <div className="space-y-8">
          {recommendations.dbPool.length > 0 && (
            <GameGrid games={recommendations.dbPool} title="From Our Database" />
          )}
          {recommendations.igdbPool.length > 0 && (
            <GameGrid games={recommendations.igdbPool} title="From IGDB" />
          )}
        </div>
      ) : !loading && !recommendations && !filter ? (
        <div className="flex flex-col items-center justify-center py-16">
          
          <p className="text-muted-foreground mb-4 text-center max-w-md">
            Search for a game above to get personalized recommendations based on its genres
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Search for games like: "The Witcher 3", "Grand Theft Auto V", or "Minecraft" use exactly their names and a list will appear. with no covers yet  (┬┬﹏┬┬) .
          </p>
        </div>
      ) : filter && categoryGames.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-xl font-semibold mb-2">No games found</h3>
          <p className="text-muted-foreground mb-4 text-center max-w-md">
            We couldn't find any games in the "{filter.replace('-', ' ')}" category. Try another category!
          </p>
        </div>
      ) : recommendations && allGames.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-6xl mb-4">😔</div>
          <h3 className="text-xl font-semibold mb-2">No recommendations found</h3>
          <p className="text-muted-foreground mb-4 text-center max-w-md">
            We couldn't find any recommendations for "{selectedGame?.name}". Try searching for a different game!
          </p>
        </div>
      ) : null}

      {/* Additional Info */}
      <div className="px-4 md:px-8 lg:px-12 py-8">
        <div className="bg-muted/50 rounded-lg p-6">
          <h3 className="font-semibold mb-2">How our recommendation engine works</h3>
          <p className="text-muted-foreground text-sm">
            Placeholder text: Our advanced recommendation engine analyzes the genres of your selected seed game and finds 
            similar games.
          </p>
        </div>
      </div>
    </div>
  )
}