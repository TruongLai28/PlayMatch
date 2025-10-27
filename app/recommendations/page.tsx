'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { GameGrid } from '@/features/game'
import RecommendationsHeader from './components/RecommendationsHeader'
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

interface RecommendationResponse {
  seed: Game
  dbScored: Game[]
  igdbPool: Game[]
}

export default function RecommendationsPage() {
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter')
  const seedId = searchParams.get('seedId')
  
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null)
  const [categoryGames, setCategoryGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState<string>('')
  const [seedGameName, setSeedGameName] = useState<string>('')



  const fetchRecommendations = async (gameId?: number) => {
    const targetGameId = gameId || parseInt(searchInput)
    if (!targetGameId) {
      setError('Please enter a game ID to get recommendations')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/rec-engine?seedGameId=${targetGameId}`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch recommendations')
      }
      
      const data: RecommendationResponse = await response.json()
      setRecommendations(data)
      setSeedGameName(data.seed.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setRecommendations(null)
      setSeedGameName('')
    } finally {
      setLoading(false)
    }
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

  // Auto-load recommendations if seedId is provided in URL
  useEffect(() => {
    if (seedId) {
      const gameId = parseInt(seedId)
      if (!isNaN(gameId)) {
        setSearchInput(seedId)
        fetchRecommendations(gameId)
      }
    }
  }, [seedId])

  const allGames = recommendations ? [...recommendations.dbScored, ...recommendations.igdbPool] : []

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
      
      <RecommendationsHeader
        filter={filter}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        fetchRecommendations={fetchRecommendations}
        recommendations={recommendations}
        categoryGames={categoryGames}
        loading={loading}
        error={error}
        seedGameName={seedGameName}
      />

      {/* Games Grid */}
      {filter && categoryGames.length > 0 ? (
        <GameGrid games={categoryGames} />
      ) : recommendations && allGames.length > 0 ? (
        <div className="space-y-8">
          {recommendations.dbScored.length > 0 && (
            <GameGrid games={recommendations.dbScored} title="From Our Database" />
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
            Search for games with seedID. with no covers yet  (┬┬﹏┬┬) .
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
            We couldn't find any recommendations for "{seedGameName}". Try entering a different game ID!
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