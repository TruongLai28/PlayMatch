'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { GameGrid } from '@/features/game'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Search, X, TrendingUp, Grid3x3, List } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLibrary } from '@/hooks/use-library'
import { GamifiedQuiz } from './components/GamifiedQuiz'

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
  source?: string
  finalScore?: number
  genreScore?: number
  companyScore?: number
  keywordScore?: number
  themeScore?: number
  ratingScoreValue?: number
  platformScore?: number
}

interface RecommendationResponse {
  message: string
  count: number
  query: string
  debug: {
    total: string
    with_embeddings: string
    filters_applied: number
  }
  recommendations: Game[]
}

export default function RecommendationsPage() {
  const searchParams = useSearchParams()
  const seedId = searchParams.get('seedId')
  const toast = useToast()
  const { addGameToLibrary } = useLibrary(false)
  
  // State management
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState<string>('')
  const [selectedGames, setSelectedGames] = useState<Game[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [matchingGamesCount, setMatchingGamesCount] = useState<number | null>(null)
  const [gamerProfile, setGamerProfile] = useState<string | null>(null)
  
  // Autocomplete states
  const [searchSuggestions, setSearchSuggestions] = useState<Game[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Constants
  const genres = [
    'Point-and-click', 'Fighting', 'Shooter', 'Music', 'Platform', 'Puzzle', 'Racing', 
    'Real Time Strategy (RTS)', 'Role-playing (RPG)', 'Simulator', 'Sport', 'Strategy', 
    'Turn-based Strategy (TBS)', 'Tactical', 'Hack & slash/Beat \'em up', 'Quiz/Trivia', 
    'Pinball', 'Adventure', 'Indie', 'Arcade', 'Visual Novel', 'Card & Board Game', 'MOBA'
  ]

  const keywords = [
    'Open World', 'Multiplayer', 'Single Player', 'Co-op', 'Online', 'Offline',
    'Story Rich', 'Atmospheric', 'Pixel Graphics', '2D', '3D', 'Retro',
    'Survival', 'Crafting', 'Building', 'Exploration', 'Combat', 'Magic',
    'Sci-fi', 'Fantasy', 'Horror', 'Comedy', 'Drama', 'Historical'
  ]

  const themes = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Educational', 'Fantasy',
    'Historical', 'Horror', 'Kids', 'Mystery', 'Non-fiction', 'Open World',
    'Party', 'Romance', 'Sandbox', 'Science Fiction', 'Stealth', 'Survival',
    'Thriller', 'Warfare', 'Western'
  ]

  const platforms = [
    'PC (Windows)', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X/S', 'Xbox One',
    'Nintendo Switch', 'Nintendo 3DS', 'PlayStation Vita', 'iOS', 'Android',
    'Mac', 'Linux', 'Steam Deck', 'VR', 'Web Browser'
  ]

  const maxGames = 5
  const maxGenres = 6
  const maxKeywords = 6
  const maxThemes = 4
  const maxPlatforms = 4

  // Generate gamer profile based on selections
  const generateGamerProfile = () => {
    const profiles: Record<string, { title: string; description: string; icon: string }> = {
      'action_lover': {
        title: 'The Action Junkie',
        description: 'You live for adrenaline and fast-paced gameplay',
        icon: '⚡'
      },
      'story_seeker': {
        title: 'The Story Seeker',
        description: 'You appreciate deep narratives and character development',
        icon: '📖'
      },
      'strategy_master': {
        title: 'The Strategy Mastermind',
        description: 'You excel at planning and tactical thinking',
        icon: '🧠'
      },
      'explorer': {
        title: 'The Worldbuilder',
        description: 'You love exploring vast open worlds and creating',
        icon: '🌍'
      },
      'competitor': {
        title: 'The Competitive Champion',
        description: 'You thrive in multiplayer and competitive environments',
        icon: '🏆'
      },
      'casual_gamer': {
        title: 'The Casual Connoisseur',
        description: 'You enjoy relaxed, accessible gaming experiences',
        icon: '🎮'
      },
      'completionist': {
        title: 'The Achievement Hunter',
        description: 'You must complete everything and collect all achievements',
        icon: '💯'
      },
      'indie_enthusiast': {
        title: 'The Indie Explorer',
        description: 'You seek out unique, creative indie experiences',
        icon: '💎'
      }
    }

    const hasShooter = selectedGenres.some(g => g.includes('Shooter') || g.includes('Fighting'))
    const hasRPG = selectedGenres.some(g => g.includes('RPG') || g.includes('Adventure'))
    const hasStrategy = selectedGenres.some(g => g.includes('Strategy') || g.includes('Tactical'))
    const hasIndie = selectedGenres.includes('Indie')
    const hasMultiplayer = selectedKeywords.includes('Multiplayer') || selectedKeywords.includes('Co-op')
    const hasSinglePlayer = selectedKeywords.includes('Single Player')
    const hasOpenWorld = selectedKeywords.includes('Open World') || selectedKeywords.includes('Exploration')
    
    if (hasIndie && selectedGenres.length >= 3) return profiles['indie_enthusiast']
    if (hasShooter && hasMultiplayer) return profiles['action_lover']
    if (hasRPG && hasSinglePlayer) return profiles['story_seeker']
    if (hasStrategy) return profiles['strategy_master']
    if (hasOpenWorld) return profiles['explorer']
    if (hasMultiplayer) return profiles['competitor']
    if (selectedKeywords.length <= 2) return profiles['casual_gamer']
    
    return profiles['completionist']
  }

  // Autocomplete search
  const searchForSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      setIsSearching(true)
      const response = await fetch(`/api/new-search-game?q=${encodeURIComponent(query.trim())}`)
      if (!response.ok) throw new Error('Failed to search for games')
      
      const data = await response.json()
      if (data.results && data.results.length > 0) {
        const suggestions = data.results.slice(0, 8).map((game: any) => {
          let coverUrl = game.cover_url
          if (coverUrl && coverUrl.startsWith('//')) {
            coverUrl = `https:${coverUrl}`
          }
          
          return {
            id: game.id,
            name: game.name,
            cover: coverUrl ? { url: coverUrl } : undefined,
            summary: game.summary,
            rating: game.rating,
            genres: game.genres || []
          }
        })
        
        setSearchSuggestions(suggestions)
        setShowSuggestions(true)
      } else {
        setSearchSuggestions([])
        setShowSuggestions(false)
      }
    } catch (err) {
      console.error('Autocomplete search error:', err)
      setSearchSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchForSuggestions(searchInput)
      setSelectedSuggestionIndex(-1)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchInput])

  // Real-time feedback - estimate matching games
  useEffect(() => {
    if (selectedGames.length > 0 || selectedGenres.length > 0) {
      const baseCount = 5000
      const gameReduction = selectedGames.length * 200
      const genreReduction = selectedGenres.length * 150
      const keywordReduction = selectedKeywords.length * 100
      const themeReduction = selectedThemes.length * 80
      const platformReduction = selectedPlatforms.length * 50
      
      const estimated = Math.max(
        10,
        baseCount - gameReduction - genreReduction - keywordReduction - themeReduction - platformReduction
      )
      setMatchingGamesCount(estimated)
    } else {
      setMatchingGamesCount(null)
    }
  }, [selectedGames, selectedGenres, selectedKeywords, selectedThemes, selectedPlatforms])

  const selectGameFromSuggestion = (game: Game) => {
    if (selectedGames.length < maxGames) {
      setSelectedGames(prev => [...prev, game])
      setSearchInput('')
      setShowSuggestions(false)
      setSearchSuggestions([])
    }
  }

  const removeGame = (gameId: number) => {
    setSelectedGames(prev => prev.filter(game => game.id !== gameId))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (showSuggestions && searchSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : searchSuggestions.length - 1
        )
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < searchSuggestions.length) {
          selectGameFromSuggestion(searchSuggestions[selectedSuggestionIndex])
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
      }
    }
  }

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => {
      if (prev.includes(genre)) {
        return prev.filter(g => g !== genre)
      } else if (prev.length < maxGenres) {
        return [...prev, genre]
      }
      return prev
    })
  }

  const handleKeywordToggle = (keyword: string) => {
    setSelectedKeywords(prev => {
      if (prev.includes(keyword)) {
        return prev.filter(k => k !== keyword)
      } else if (prev.length < maxKeywords) {
        return [...prev, keyword]
      }
      return prev
    })
  }

  const handleThemeToggle = (theme: string) => {
    setSelectedThemes(prev => {
      if (prev.includes(theme)) {
        return prev.filter(t => t !== theme)
      } else if (prev.length < maxThemes) {
        return [...prev, theme]
      }
      return prev
    })
  }

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platform)) {
        return prev.filter(p => p !== platform)
      } else if (prev.length < maxPlatforms) {
        return [...prev, platform]
      }
      return prev
    })
  }

  const getRecommendations = async () => {
    if (selectedGames.length === 0) {
      const errorMsg = 'Please select at least one game to get recommendations.'
      setError(errorMsg)
      toast.error(errorMsg)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Generate gamer profile
      const profile = generateGamerProfile()
      setGamerProfile(profile.title)
      
      const requestBody = {
        gameIds: selectedGames.map(game => game.id),
        genres: selectedGenres,
        themes: selectedThemes,
        keywords: selectedKeywords,
        platforms: selectedPlatforms,
        limit: 30,
        minRating: 70
      }
      
      const response = await fetch('/api/db/ai-recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get recommendations')
      }
      
      const data: RecommendationResponse = await response.json()
      
      const processedData = {
        ...data,
        recommendations: data.recommendations?.map(game => {
          const gameAny = game as any
          return {
            ...game,
            cover: game.cover?.url ? game.cover : 
                   gameAny.cover_url ? { url: gameAny.cover_url } :
                   gameAny.coverUrl ? { url: gameAny.coverUrl } :
                   undefined
          }
        }) || []
      }
      
      setRecommendations(processedData)
      setShowResultsModal(true)
      toast.success(`Found ${processedData.count} game recommendations!`)
    } catch (err) {
      console.error('Recommendation error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to get recommendations'
      setError(errorMsg)
      toast.error(errorMsg)
      setRecommendations(null)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToLibrary = async (gameId: number, status: 'backlog' | 'playing' | 'completed' | 'dropped' = 'backlog') => {
    try {
      const game = recommendations?.recommendations?.find(g => g.id === gameId)
      if (!game) {
        toast.error('Game not found')
        return
      }

      await addGameToLibrary(game, status, 0)
      toast.success(`"${game.name}" added to your library!`)
    } catch (error) {
      console.error('Error adding to library:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add game to library')
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4 px-6 py-3 rounded-2xl border border-[#5d4af8]/30 bg-zinc-900/50 shadow-[0_0_20px_rgba(93,74,248,0.3)]">
            <Sparkles className="h-5 w-5 text-[#5d4af8] animate-pulse" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-[#5d4af8] bg-clip-text text-transparent">
              Find Your Perfect Games
            </h1>
          </div>
        </div>

        {/* Gamified Quiz - includes all 4 steps */}
        {!recommendations && (
          <GamifiedQuiz
            selectedGames={selectedGames}
            selectedGenres={selectedGenres}
            selectedKeywords={selectedKeywords}
            selectedThemes={selectedThemes}
            selectedPlatforms={selectedPlatforms}
            onGenreToggle={handleGenreToggle}
            onKeywordToggle={handleKeywordToggle}
            onThemeToggle={handleThemeToggle}
            onPlatformToggle={handlePlatformToggle}
            onGetRecommendations={getRecommendations}
            loading={loading}
            matchingGamesCount={matchingGamesCount}
            maxGames={maxGames}
            maxGenres={maxGenres}
            maxKeywords={maxKeywords}
            maxThemes={maxThemes}
            maxPlatforms={maxPlatforms}
            genres={genres}
            keywords={keywords}
            themes={themes}
            platforms={platforms}
            gamerProfile={gamerProfile}
            recommendations={recommendations}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            searchSuggestions={searchSuggestions}
            showSuggestions={showSuggestions}
            isSearching={isSearching}
            selectedSuggestionIndex={selectedSuggestionIndex}
            handleKeyPress={handleKeyPress}
            selectGameFromSuggestion={selectGameFromSuggestion}
            removeGame={removeGame}
          />
        )}

        {/* Show button to view results if they exist but modal is closed */}
        {recommendations && !showResultsModal && (
          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 rounded-3xl border border-zinc-700 p-8 backdrop-blur-sm shadow-2xl text-center">
            <Sparkles className="h-16 w-16 text-purple-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Your recommendations are ready!
            </h2>
            <p className="text-zinc-400 mb-6">
              We found {recommendations.count} perfect games for you
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setShowResultsModal(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-xl font-semibold"
              >
                View Recommendations
              </Button>
              <Button
                onClick={() => {
                  setRecommendations(null)
                  setSelectedGames([])
                  setSelectedGenres([])
                  setSelectedKeywords([])
                  setSelectedThemes([])
                  setSelectedPlatforms([])
                  setGamerProfile(null)
                }}
                variant="outline"
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 px-8 py-3 rounded-xl"
              >
                Start New Search
              </Button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-8">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Results Modal */}
        {showResultsModal && recommendations && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="bg-zinc-900/95 rounded-2xl border-2 border-[#5d4af8]/30 shadow-[0_0_20px_rgba(93,74,248,0.3)] max-w-7xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#5d4af8]/20 bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#5d4af8] rounded-full flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-[#5d4af8] bg-clip-text text-transparent">Your Game Recommendations</h2>
                    {gamerProfile && (
                      <p className="text-[#5d4af8] text-sm font-medium">Profile: {gamerProfile}</p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => setShowResultsModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full w-10 h-10 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6">
                {recommendations.recommendations.length > 0 ? (
                  <div className="space-y-8">
                    {/* Summary */}
                    <div className="bg-zinc-900/50 rounded-xl p-6 border border-[#5d4af8]/20">
                      <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-[#5d4af8]" />
                          <span className="text-zinc-300">Found <span className="text-white font-semibold">{recommendations.count}</span> matches</span>
                        </div>
                        {recommendations.debug && (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            <span className="text-zinc-300">Database: <span className="text-white font-semibold">{recommendations.debug.with_embeddings}</span> games</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Games Grid */}
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="text-center flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">Recommended Games</h3>
                          <p className="text-zinc-400 text-sm">
                            Each game is scored based on similarity to your preferences
                          </p>
                        </div>
                        
                        {/* View Toggle */}
                        <div className="flex items-center gap-2 bg-zinc-900/50 border border-[#5d4af8]/20 rounded-lg p-1">
                          <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded transition-colors ${
                              viewMode === 'grid' 
                                ? 'bg-[#5d4af8] text-white' 
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                            title="Grid view"
                          >
                            <Grid3x3 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded transition-colors ${
                              viewMode === 'list' 
                                ? 'bg-[#5d4af8] text-white' 
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                            title="List view"
                          >
                            <List className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      {viewMode === 'grid' ? (
                        <GameGrid 
                          games={recommendations.recommendations.map((game: any) => ({
                            ...game,
                            scoreInfo: {
                              similarity: game.similarity_score
                            }
                          }))} 
                          title=""
                          onAddToLibrary={(gameId: number, status = 'backlog') => {
                            handleAddToLibrary(gameId, status)
                          }}
                          onMoreInfo={(gameId: number) => console.log('More info:', gameId)}
                        />
                      ) : (
                        <div className="space-y-4">
                          {recommendations.recommendations.map((game: any) => {
                            const getCoverUrl = (url?: string) => {
                              if (!url) return 'https://placehold.co/200x300/1f1f2b/5d4af8?text=No+Cover'
                              if (url.startsWith('//')) url = 'https:' + url
                              return url.replace('t_thumb', 't_cover_big')
                            }
                            
                            return (
                              <div 
                                key={game.id} 
                                className="flex gap-4 bg-zinc-900/50 border border-[#5d4af8]/20 rounded-lg p-4 hover:border-[#5d4af8]/40 transition-colors"
                              >
                                <img 
                                  src={getCoverUrl(game.cover?.url)} 
                                  alt={game.name}
                                  className="w-24 h-32 object-cover rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-lg font-bold text-white mb-2">{game.name}</h4>
                                  {game.summary && (
                                    <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{game.summary}</p>
                                  )}
                                  <div className="flex items-center gap-4 text-sm">
                                    {game.rating && (
                                      <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                                        ⭐ {Math.round(game.rating / 10)}/10
                                      </span>
                                    )}
                                    {game.similarity_score && (
                                      <span className="bg-[#5d4af8]/20 text-[#5d4af8] px-2 py-1 rounded">
                                        {Math.round(game.similarity_score * 100)}% match
                                      </span>
                                    )}
                                    {game.genres && game.genres.length > 0 && (
                                      <span className="text-zinc-500">
                                        {game.genres.slice(0, 2).map((g: any) => g.name).join(', ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Button
                                    onClick={() => handleAddToLibrary(game.id, 'backlog')}
                                    size="sm"
                                    className="bg-[#5d4af8] hover:bg-[#4a3ad6] text-white"
                                  >
                                    Add to Library
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-6 text-zinc-600">×</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No recommendations found</h3>
                    <p className="text-zinc-400 max-w-md mx-auto">
                      We couldn't find any recommendations matching your criteria. Try adjusting your preferences!
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-zinc-700 p-4 bg-zinc-900/50 flex items-center justify-between">
                <div className="text-sm text-zinc-400">
                  {recommendations.recommendations.length > 0 && `Showing ${recommendations.recommendations.length} recommendations`}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowResultsModal(false)
                      // Keep the results but allow viewing them again
                    }}
                    variant="outline"
                    className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setRecommendations(null)
                      setShowResultsModal(false)
                      setSelectedGames([])
                      setSelectedGenres([])
                      setSelectedKeywords([])
                      setSelectedThemes([])
                      setSelectedPlatforms([])
                      setGamerProfile(null)
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    New Search
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
