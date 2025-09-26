'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { HeroSection } from '@/components/HeroSection'
import { GameRow } from '@/components/GameRow'

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

// Loading skeleton for hero section
function HeroSkeleton() {
  return (
    <div className="relative h-screen overflow-hidden bg-zinc-900">
      <Skeleton className="absolute inset-0 bg-zinc-800" />
      <div className="relative z-10 h-full flex flex-col justify-center px-4 md:px-8 lg:px-12">
        <div className="max-w-2xl space-y-4">
          <Skeleton className="h-16 md:h-24 lg:h-32 w-full max-w-2xl bg-zinc-700" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-16 bg-zinc-700" />
            <Skeleton className="h-6 w-24 bg-zinc-700" />
            <Skeleton className="h-6 w-20 bg-zinc-700" />
          </div>
          <Skeleton className="h-24 w-full max-w-xl bg-zinc-700" />
          <div className="flex space-x-4 pt-4">
            <Skeleton className="h-12 w-32 bg-zinc-700" />
            <Skeleton className="h-12 w-32 bg-zinc-700" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [featuredGame, setFeaturedGame] = useState<Game | null>(null)
  const [popularGames, setPopularGames] = useState<Game[]>([])
  const [newReleases, setNewReleases] = useState<Game[]>([])
  const [recommendations, setRecommendations] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHomePageData()
  }, [])

  const fetchHomePageData = async () => {
    try {
      setLoading(true)
      setError(null)
     
      // Fetch different categories of games
      const [popular, newGames, recommended] = await Promise.all([
        fetch('/api/games/popular').then(res => {
          if (!res.ok) throw new Error('Failed to fetch popular games')
          return res.json()
        }),
        fetch('/api/games/new-releases').then(res => {
          if (!res.ok) throw new Error('Failed to fetch new releases')
          return res.json()
        }),
        fetch('/api/games/recommendations').then(res => {
          if (!res.ok) throw new Error('Failed to fetch recommendations')
          return res.json()
        }),
      ])

      setPopularGames(popular || [])
      setNewReleases(newGames || [])
      setRecommendations(recommended || [])
     
      // Set featured game as the first popular game
      if (popular && popular.length > 0) {
        setFeaturedGame(popular[0])
      }
    } catch (error) {
      console.error('Error fetching homepage data:', error)
      setError('Failed to load games. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Alert className="max-w-md bg-zinc-900 border-zinc-700">
          <AlertDescription className="text-center text-zinc-300">
            {error}
            <Button 
              className="mt-4 w-full" 
              onClick={fetchHomePageData}
              variant="outline"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <HeroSkeleton />
        <div className="space-y-8 mt-8 relative z-10">
          <GameRow title="Recommended for You" games={[]} loading={true} />
          <GameRow title="Popular Games" games={[]} loading={true} />
          <GameRow title="New Releases" games={[]} loading={true} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      {featuredGame && (
        <HeroSection 
          game={featuredGame}
        />
      )}
     
      {/* Game Rows */}
  <div className="space-y-8 mt-8 relative z-10 overflow-visible">
        <GameRow 
          title="Recommended for You" 
          games={recommendations}
          loading={false}
          showCount={true}
        />
       
        <GameRow 
          title="Popular Games" 
          games={popularGames}
          loading={false}
          showCount={true}
        />
       
        <GameRow 
          title="New Releases" 
          games={newReleases}
          loading={false}
          showCount={true}
        />

        {/* Empty State */}
        {!recommendations.length && !popularGames.length && !newReleases.length && (
          <div className="text-center py-20">
            <h3 className="text-xl text-gray-400 mb-4">No games found</h3>
            <Button onClick={fetchHomePageData} variant="outline">
              Refresh
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
