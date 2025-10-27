"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Sparkles, TrendingUp, Star, Clock, Search } from 'lucide-react'

interface Game {
  id: number
  name: string
}

interface RecommendationResponse {
  seed: Game
  dbScored: Game[]
  igdbPool: Game[]
}

interface Props {
  filter: string | null
  searchInput: string
  setSearchInput: (v: string) => void
  fetchRecommendations: (gameId?: number) => Promise<void>
  recommendations: RecommendationResponse | null
  categoryGames: any[]
  loading: boolean
  error: string | null
  seedGameName: string
}

export default function RecommendationsHeader({
  filter,
  searchInput,
  setSearchInput,
  fetchRecommendations,
  recommendations,
  categoryGames,
  loading,
  error,
  seedGameName,
}: Props) {
  const allGamesCount = recommendations ? (recommendations.dbScored.length + recommendations.igdbPool.length) : 0

  return (
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

      {!filter && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 max-w-md">
            <Input
              type="number"
              placeholder="Enter game ID (e.g., 1942)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => fetchRecommendations(parseInt(searchInput))} disabled={loading || !searchInput}>
              <Search className="w-4 h-4 mr-2" />
              Get Recommendations
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {(recommendations || (filter && categoryGames.length > 0)) && (
        <div className="flex items-center gap-4 mt-6">
          <Badge variant="secondary">
            {filter ? categoryGames.length : allGamesCount} games found
          </Badge>
          {!filter && recommendations && (
            <>
              <Badge variant="outline">{recommendations.dbScored.length} from database</Badge>
              <Badge variant="outline">{recommendations.igdbPool.length} from IGDB</Badge>
            </>
          )}
          {filter && <Badge variant="outline">{filter.replace('-', ' ')} category</Badge>}
        </div>
      )}
    </div>
  )
}
