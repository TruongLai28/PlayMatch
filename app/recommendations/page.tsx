'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { GameGrid } from '@/features/game'
import { ExpandedGameCard } from '@/features/game/components/ExpandedGameCard'
import { Button } from '@/components/ui/button'
import { Sparkles, X, TrendingUp, Grid3x3, List } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLibrary } from '@/hooks/use-library'
import { GamifiedQuiz } from './components/GamifiedQuiz'

interface Game {
  id: number
  name: string
  cover?: { url: string }
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

const GENRES = [
  'Point-and-click', 'Fighting', 'Shooter', 'Music', 'Platform', 'Puzzle', 'Racing',
  'Real Time Strategy (RTS)', 'Role-playing (RPG)', 'Simulator', 'Sport', 'Strategy',
  'Turn-based Strategy (TBS)', 'Tactical', 'Hack & slash/Beat \'em up', 'Quiz/Trivia',
  'Pinball', 'Adventure', 'Indie', 'Arcade', 'Visual Novel', 'Card & Board Game', 'MOBA'
]

const KEYWORDS = [
  'Open World', 'Multiplayer', 'Single Player', 'Co-op', 'Online', 'Offline',
  'Story Rich', 'Atmospheric', 'Pixel Graphics', '2D', '3D', 'Retro',
  'Survival', 'Crafting', 'Building', 'Exploration', 'Combat', 'Magic',
  'Sci-fi', 'Fantasy', 'Horror', 'Comedy', 'Drama', 'Historical'
]

const THEMES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Educational', 'Fantasy',
  'Historical', 'Horror', 'Kids', 'Mystery', 'Non-fiction', 'Open World',
  'Party', 'Romance', 'Sandbox', 'Science Fiction', 'Stealth', 'Survival',
  'Thriller', 'Warfare', 'Western'
]

const PLATFORMS = [
  'PC (Windows)', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X/S', 'Xbox One',
  'Nintendo Switch', 'Nintendo 3DS', 'PlayStation Vita', 'iOS', 'Android',
  'Mac', 'Linux', 'Steam Deck', 'VR', 'Web Browser'
]

const MAX_GAMES = 5
const MAX_GENRES = 6
const MAX_KEYWORDS = 6
const MAX_THEMES = 4
const MAX_PLATFORMS = 4

// Main content component that uses useSearchParams
function RecommendationsContent() {
  const searchParams = useSearchParams()
  const seedId = searchParams.get('seedId')
  const toast = useToast()
  const { addGameToLibrary } = useLibrary(false)

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
  const [searchSuggestions, setSearchSuggestions] = useState<Game[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedGameForModal, setSelectedGameForModal] = useState<Game | null>(null)

  const generateGamerProfile = () => {
    const profiles: Record<string, { title: string; description: string; icon: string }> = {
      action_lover: { title: 'The Action Junkie', description: 'You live for adrenaline and fast-paced gameplay', icon: '⚡' },
      story_seeker: { title: 'The Story Seeker', description: 'You appreciate deep narratives and character development', icon: '📖' },
      strategy_master: { title: 'The Strategy Mastermind', description: 'You excel at planning and tactical thinking', icon: '🧠' },
      explorer: { title: 'The Worldbuilder', description: 'You love exploring vast open worlds and creating', icon: '🌍' },
      competitor: { title: 'The Competitive Champion', description: 'You thrive in multiplayer and competitive environments', icon: '🏆' },
      casual_gamer: { title: 'The Casual Connoisseur', description: 'You enjoy relaxed, accessible gaming experiences', icon: '🎮' },
      completionist: { title: 'The Achievement Hunter', description: 'You must complete everything and collect all achievements', icon: '💯' },
      indie_enthusiast: { title: 'The Indie Explorer', description: 'You seek out unique, creative indie experiences', icon: '💎' }
    }

    const hasShooter = selectedGenres.some(g => g.includes('Shooter') || g.includes('Fighting'))
    const hasRPG = selectedGenres.some(g => g.includes('RPG') || g.includes('Adventure'))
    const hasStrategy = selectedGenres.some(g => g.includes('Strategy') || g.includes('Tactical'))
    const hasIndie = selectedGenres.includes('Indie')
    const hasMultiplayer = selectedKeywords.includes('Multiplayer') || selectedKeywords.includes('Co-op')
    const hasSinglePlayer = selectedKeywords.includes('Single Player')
    const hasOpenWorld = selectedKeywords.includes('Open World') || selectedKeywords.includes('Exploration')

    if (hasIndie && selectedGenres.length >= 3) return profiles.indie_enthusiast
    if (hasShooter && hasMultiplayer) return profiles.action_lover
    if (hasRPG && hasSinglePlayer) return profiles.story_seeker
    if (hasStrategy) return profiles.strategy_master
    if (hasOpenWorld) return profiles.explorer
    if (hasMultiplayer) return profiles.competitor
    if (selectedKeywords.length <= 2) return profiles.casual_gamer

    return profiles.completionist
  }

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
      if (data.results?.length > 0) {
        const suggestions = data.results.slice(0, 8).map((game: any) => ({
          id: game.id,
          name: game.name,
          cover: game.cover_url?.startsWith('//') ? { url: `https:${game.cover_url}` } : game.cover_url ? { url: game.cover_url } : undefined,
          summary: game.summary,
          rating: game.rating,
          genres: game.genres || []
        }))
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

  useEffect(() => {
    if (selectedGames.length > 0 || selectedGenres.length > 0) {
      const baseCount = 5000
      const estimated = Math.max(10, baseCount - selectedGames.length * 200 - selectedGenres.length * 150 - 
        selectedKeywords.length * 100 - selectedThemes.length * 80 - selectedPlatforms.length * 50)
      setMatchingGamesCount(estimated)
    } else {
      setMatchingGamesCount(null)
    }
  }, [selectedGames, selectedGenres, selectedKeywords, selectedThemes, selectedPlatforms])

  const selectGameFromSuggestion = (game: Game) => {
    if (selectedGames.length < MAX_GAMES) {
      setSelectedGames(prev => [...prev, game])
      setSearchInput('')
      setShowSuggestions(false)
      setSearchSuggestions([])
    }
  }

  const removeGame = (gameId: number) => setSelectedGames(prev => prev.filter(game => game.id !== gameId))

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (showSuggestions && searchSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => prev < searchSuggestions.length - 1 ? prev + 1 : 0)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : searchSuggestions.length - 1)
      } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
        e.preventDefault()
        selectGameFromSuggestion(searchSuggestions[selectedSuggestionIndex])
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
      }
    }
  }

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : 
      prev.length < MAX_GENRES ? [...prev, genre] : prev)
  }

  const handleKeywordToggle = (keyword: string) => {
    setSelectedKeywords(prev => prev.includes(keyword) ? prev.filter(k => k !== keyword) :
      prev.length < MAX_KEYWORDS ? [...prev, keyword] : prev)
  }

  const handleThemeToggle = (theme: string) => {
    setSelectedThemes(prev => prev.includes(theme) ? prev.filter(t => t !== theme) :
      prev.length < MAX_THEMES ? [...prev, theme] : prev)
  }

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => prev.includes(platform) ? prev.filter(p => p !== platform) :
      prev.length < MAX_PLATFORMS ? [...prev, platform] : prev)
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

      const profile = generateGamerProfile()
      setGamerProfile(profile.title)

      const response = await fetch('/api/db/ai-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameIds: selectedGames.map(g => g.id),
          genres: selectedGenres,
          themes: selectedThemes,
          keywords: selectedKeywords,
          platforms: selectedPlatforms,
          limit: 30,
          minRating: 70
        })
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
              gameAny.coverUrl ? { url: gameAny.coverUrl } : undefined
          }
        }) || []
      }

      setRecommendations(processedData)
      setShowResultsModal(true)

      localStorage.setItem('playMatchRecommendations', JSON.stringify({
        games: processedData.recommendations,
        timestamp: Date.now(),
        gamerProfile: profile.title,
        count: processedData.count,
        preferences: { genres: selectedGenres, themes: selectedThemes, platforms: selectedPlatforms }
      }))

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

  const handleMoreInfo = (gameId: number) => {
    const game = recommendations?.recommendations?.find(g => g.id === gameId)
    if (game) {
      setSelectedGameForModal(game)
    }
  }

  const handleModalAddToLibrary = (status: 'backlog' | 'playing' | 'completed' | 'dropped') => {
    if (selectedGameForModal) {
      handleAddToLibrary(selectedGameForModal.id, status)
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12 relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 sm:gap-3 mb-4 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl border border-[#5d4af8]/30 bg-zinc-900/50 shadow-[0_0_20px_rgba(93,74,248,0.3)]">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[#5d4af8] animate-pulse" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-[#5d4af8] bg-clip-text text-transparent">
              Find Your Perfect Games
            </h1>
          </div>
        </div>

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
            maxGames={MAX_GAMES}
            maxGenres={MAX_GENRES}
            maxKeywords={MAX_KEYWORDS}
            maxThemes={MAX_THEMES}
            maxPlatforms={MAX_PLATFORMS}
            genres={GENRES}
            keywords={KEYWORDS}
            themes={THEMES}
            platforms={PLATFORMS}
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
        {recommendations && (
          <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  🎮 Your Recommendations
                </h2>
                {gamerProfile && (
                  <p className="text-zinc-400 text-sm sm:text-base">
                    Profile: <span className="text-purple-400 font-semibold">{gamerProfile}</span>
                  </p>
                )}
                <p className="text-zinc-500 text-xs sm:text-sm">
                  Found {recommendations.count} games matching your preferences
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="border-zinc-700"
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRecommendations(null)
                    setShowResultsModal(false)
                  }}
                  className="border-zinc-700"
                >
                  New Search
                </Button>
              </div>
            </div>

            {/* Games Grid */}
            {recommendations.recommendations && recommendations.recommendations.length > 0 ? (
              <GameGrid 
                games={recommendations.recommendations}
                viewMode={viewMode}
                onAddToLibrary={handleAddToLibrary}
                onMoreInfo={handleMoreInfo}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-zinc-400">No recommendations found. Try adjusting your preferences.</p>
              </div>
            )}
          </div>
        )}

        {/* Expanded Game Card Modal */}
        {selectedGameForModal && (
          <ExpandedGameCard
            game={selectedGameForModal}
            isOpen={!!selectedGameForModal}
            onClose={() => setSelectedGameForModal(null)}
            onAddToLibrary={handleModalAddToLibrary}
          />
        )}
      </div>
    </div>
  )
}

// Wrapper with Suspense
export default function RecommendationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-zinc-700 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading recommendations...</p>
        </div>
      </div>
    }>
      <RecommendationsContent />
    </Suspense>
  )
}