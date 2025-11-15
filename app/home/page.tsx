'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { HeroSection } from './components/HeroSection'
import { GameRow, CategoryBar } from '@/features/game'
import { useLibrary } from '@/hooks/use-library'
import { useToast } from '@/hooks/use-toast'

interface Game {
  id: number
  name: string
  cover?: {
    url: string
  }
  summary?: string
  rating?: number
  genres?: Array<{ id: number; name: string }>
  screenshots?: Array<{ id: number | string; url: string }>
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
  const { addGameToLibrary } = useLibrary(false) // Don't auto-load library on home page
  const toast = useToast()
  
  const [featuredGame, setFeaturedGame] = useState<Game | null>(null)
  const [popularGames, setPopularGames] = useState<Game[]>([])
  const [newReleases, setNewReleases] = useState<Game[]>([])
  const [recommendations, setRecommendations] = useState<Game[]>([])
  const [personalizedRecs, setPersonalizedRecs] = useState<Game[]>([])
  const [gamerProfile, setGamerProfile] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load personalized recommendations from localStorage
  useEffect(() => {
    const savedRecs = localStorage.getItem('playMatchRecommendations')
    
    if (savedRecs) {
      try {
        const data = JSON.parse(savedRecs)
        
        // Check if recommendations are still fresh (< 7 days old)
        const isStale = Date.now() - data.timestamp > 7 * 24 * 60 * 60 * 1000
        
        if (!isStale && data.games && data.games.length > 0) {
          setPersonalizedRecs(data.games)
          setGamerProfile(data.gamerProfile)
        } else {
          // Clear stale data
          localStorage.removeItem('playMatchRecommendations')
        }
      } catch (e) {
        console.error('Error loading saved recommendations:', e)
        localStorage.removeItem('playMatchRecommendations')
      }
    }
  }, [])

  useEffect(() => {
    fetchHomePageData()
  }, [])

  const fetchHomePageData = async () => {
    try {
      setLoading(true)
      setError(null)
     
      // Fetch different categories of games
      const [popular, newGames, recommended] = await Promise.all([
        fetch('/api/db/popular').then(res => {
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

  // Handle adding game to library
  const handleAddToLibrary = async (gameId: number, status: 'backlog' | 'playing' | 'completed' | 'dropped' = 'backlog', hoursPlayed: number = 0) => {
    try {
      const allGames = [...popularGames, ...newReleases, ...recommendations, ...personalizedRecs]
      const game = allGames.find(g => g.id === gameId)
      if (!game) {
        toast.error('Game not found')
        return
      }

      await addGameToLibrary(game, status, hoursPlayed)
      toast.success(`"${game.name}" added to your library!`)
    } catch (error) {
      console.error('Error adding to library:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add game to library')
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
        <div className="space-y-16 mt-8 mb-16 relative z-10">
          <GameRow title="Recommended for You" games={[]} loading={true} />
          <GameRow title="Popular Games" games={[]} loading={true} />
          <GameRow title="New Releases" games={[]} loading={true} />
        </div>
      </div>
    )
  }

  // Create slideshow games array from different categories
  // Helper function to extract franchise/series name from game name
  const getFranchiseName = (gameName: string): string => {
    // Extract potential franchise name (before subtitle, number, or colon)
    const franchise = gameName.split(/[:\-–]/)[0]
      .replace(/\d+/g, '') // Remove numbers
      .replace(/\b(I{1,3}|IV|V|VI{0,3}|IX|X)\b/g, '') // Remove Roman numerals
      .replace(/\b(the|a|an)\b/gi, '') // Remove articles
      .trim()
      .toLowerCase()
    return franchise || gameName.toLowerCase()
  }

  const slideshowGames = [
    ...popularGames.slice(0, 5),
    ...newReleases.slice(0, 5),
    ...recommendations.slice(0, 5)
  ]
    .filter((game, index, self) => 
      // Remove duplicates based on game ID
      index === self.findIndex(g => g.id === game.id)
    )
    .reduce((uniqueGames: Game[], currentGame) => {
      // Check if we already have a game from this franchise
      const franchise = getFranchiseName(currentGame.name)
      const hasSameFranchise = uniqueGames.some(g => 
        getFranchiseName(g.name) === franchise
      )
      
      if (!hasSameFranchise) {
        uniqueGames.push(currentGame)
      }
      
      return uniqueGames
    }, [])
    .slice(0, 5) // Limit to 5 slides max

  return (
    <>
      <style jsx>{`
        .gradient-circles {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }
        .gradient-circle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, 
            rgba(93, 74, 248, 0.15) 0%, 
            rgba(124, 58, 237, 0.1) 30%, 
            rgba(93, 74, 248, 0.05) 60%, 
            transparent 100%);
          filter: blur(1px);
          animation: float 20s ease-in-out infinite;
        }
        .gradient-circle:nth-child(1) {
          width: 350px;
          height: 350px;
          top: 10%;
          left: -120px;
          animation-delay: -2s;
        }
        .gradient-circle:nth-child(2) {
          width: 280px;
          height: 280px;
          top: -80px;
          left: 30%;
          animation-delay: -7s;
        }
        .gradient-circle:nth-child(3) {
          width: 220px;
          height: 220px;
          bottom: 15%;
          right: -90px;
          animation-delay: -12s;
        }
        .gradient-circle:nth-child(4) {
          width: 320px;
          height: 320px;
          top: 35%;
          right: 15%;
          animation-delay: -4s;
        }
        .gradient-circle:nth-child(5) {
          width: 180px;
          height: 180px;
          bottom: -60px;
          left: 15%;
          animation-delay: -9s;
        }
        .gradient-triangle {
          position: absolute;
          width: 0;
          height: 0;
          filter: blur(2px);
          animation: triangleFloat 25s ease-in-out infinite;
        }
        .gradient-triangle::before {
          content: '';
          position: absolute;
          width: 200px;
          height: 200px;
          background: conic-gradient(
            from 0deg at 50% 50%,
            rgba(93, 74, 248, 0.12) 0deg,
            rgba(124, 58, 237, 0.08) 120deg,
            rgba(93, 74, 248, 0.04) 240deg,
            rgba(93, 74, 248, 0.12) 360deg
          );
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          transform: translate(-50%, -50%);
        }
        .gradient-triangle:nth-child(6) {
          top: 30%;
          left: 8%;
          animation-delay: -6s;
        }
        .gradient-triangle:nth-child(6)::before {
          width: 140px;
          height: 140px;
        }
        .gradient-triangle:nth-child(7) {
          bottom: 35%;
          left: 45%;
          animation-delay: -14s;
        }
        .gradient-triangle:nth-child(7)::before {
          width: 160px;
          height: 160px;
        }
        .gradient-triangle:nth-child(8) {
          top: 8%;
          right: 20%;
          animation-delay: -9s;
        }
        .gradient-triangle:nth-child(8)::before {
          width: 120px;
          height: 120px;
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
          }
          25% {
            transform: translateY(-20px) translateX(10px) scale(1.05);
          }
          50% {
            transform: translateY(15px) translateX(-15px) scale(0.95);
          }
          75% {
            transform: translateY(-10px) translateX(5px) scale(1.02);
          }
        }
        @keyframes triangleFloat {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          20% {
            transform: translateY(-15px) translateX(8px) rotate(5deg);
          }
          40% {
            transform: translateY(10px) translateX(-12px) rotate(-3deg);
          }
          60% {
            transform: translateY(-8px) translateX(15px) rotate(7deg);
          }
          80% {
            transform: translateY(12px) translateX(-5px) rotate(-2deg);
          }
        }
      `}</style>
      
      <div className="min-h-screen bg-black text-white">
        {/* Decorative gradient circles and triangles */}
        <div className="gradient-circles">
          <div className="gradient-circle"></div>
          <div className="gradient-circle"></div>
          <div className="gradient-circle"></div>
          <div className="gradient-circle"></div>
          <div className="gradient-circle"></div>
          <div className="gradient-triangle"></div>
          <div className="gradient-triangle"></div>
          <div className="gradient-triangle"></div>
        </div>

        {/* Hero Section */}
        {slideshowGames.length > 0 && (
          <HeroSection 
            games={slideshowGames}
          />
        )}
     
      {/* Category Bar */}
      <CategoryBar />
     
        {/* Game Rows */}
  <div className="space-y-16 mt-8 mb-16 relative z-10 overflow-visible" style={{ position: 'relative', zIndex: 10 }}>
        
        {/* Personalized Recommendations from Rec Engine */}
        {personalizedRecs.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6">
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-[#5d4af8] bg-clip-text text-transparent">
                  Your Personalized Recommendations
                </h2>
                {gamerProfile && (
                  <p className="text-[#5d4af8] text-xs sm:text-sm font-medium mt-1">
                    Based on your {gamerProfile} profile
                  </p>
                )}
              </div>
              <Button
                onClick={() => window.location.href = '/recommendations'}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-[#5d4af8] hover:from-purple-700 hover:to-[#4a3ad6] text-white rounded-full text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 self-start sm:self-auto"
              >
                <span className="hidden sm:inline">Get New Recommendations</span>
                <span className="sm:hidden">New Recs</span>
              </Button>
            </div>
            <GameRow 
              title="" 
              games={personalizedRecs}
              loading={false}
              onAddToLibrary={(gameId, status = 'backlog') => {
                handleAddToLibrary(gameId, status)
              }}
              onMoreInfo={(gameId) => console.log('More info:', gameId)}
            />
          </div>
        )}
        
        <GameRow 
          title="New Releases" 
          games={newReleases}
          loading={false}
          onAddToLibrary={(gameId, status = 'backlog') => {
            handleAddToLibrary(gameId, status)
          }}
          onMoreInfo={(gameId) => console.log('More info:', gameId)}
        />
        
        <GameRow 
          title="Popular Games" 
          games={popularGames}
          loading={false}
          onAddToLibrary={(gameId, status = 'backlog') => {
            handleAddToLibrary(gameId, status)
          }}
          onMoreInfo={(gameId) => console.log('More info:', gameId)}
        />
        
        <GameRow 
          title="Random Recommendations" 
          games={recommendations}
          loading={false}
          onAddToLibrary={(gameId, status = 'backlog') => {
            handleAddToLibrary(gameId, status)
          }}
          onMoreInfo={(gameId) => console.log('More info:', gameId)}
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
    </>
  )
}
