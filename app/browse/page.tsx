'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Grid3X3, List, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { GameGrid, ExpandedGameCard } from '@/features/game'
import { useLibrary } from '@/hooks/use-library'
import { useToast } from '@/hooks/use-toast'

interface Game {
  id: number
  name: string
  cover?: { url: string }
  cover_url?: string
  summary?: string
  rating?: number
  genres?: Array<{ id: number; name: string }>
  platforms?: Array<{ id: number; name: string }>
  release_date?: string
}

interface FilterState {
  searchQuery: string
  selectedGenres: string[]
  selectedPlatforms: number[]
  sortBy: 'popular' | 'rating' | 'name' | 'release_date'
  selectedYear?: number
  minRating?: number
  maxRating?: number
}

const IGDB_GENRES = [
  { id: 2, name: 'Point-and-click' },
  { id: 4, name: 'Fighting' },
  { id: 5, name: 'Shooter' },
  { id: 7, name: 'Music' },
  { id: 8, name: 'Platform' },
  { id: 9, name: 'Puzzle' },
  { id: 10, name: 'Racing' },
  { id: 11, name: 'Real Time Strategy (RTS)' },
  { id: 12, name: 'Role-playing (RPG)' },
  { id: 13, name: 'Simulator' },
  { id: 14, name: 'Sport' },
  { id: 15, name: 'Strategy' },
  { id: 16, name: 'Turn-based Strategy (TBS)' },
  { id: 24, name: 'Tactical' },
  { id: 25, name: 'Hack & slash/Beat \'em up' },
  { id: 26, name: 'Quiz/Trivia' },
  { id: 30, name: 'Pinball' },
  { id: 31, name: 'Adventure' },
  { id: 32, name: 'Indie' },
  { id: 33, name: 'Arcade' },
  { id: 34, name: 'Visual Novel' },
  { id: 35, name: 'Card & Board Game' },
  { id: 36, name: 'MOBA' }
]

const PLATFORMS = [
  { id: 6, name: 'PC' },
  { id: 167, name: 'PS5' },
  { id: 48, name: 'PS4' },
  { id: 169, name: 'Xbox Series' },
  { id: 49, name: 'Xbox One' },
  { id: 130, name: 'Switch' },
  { id: 3, name: 'Linux' },
  { id: 14, name: 'Mac' }
]

const GENRE_ID_TO_NAME: Record<string, string> = Object.fromEntries(
  IGDB_GENRES.map(g => [g.id.toString(), g.name])
)

const GENRE_NAME_TO_ID: Record<string, number> = Object.fromEntries(
  IGDB_GENRES.map(g => [g.name, g.id])
)

const PLATFORM_NAMES: Record<number, string> = Object.fromEntries(
  PLATFORMS.map(p => [p.id, p.name])
)

// Main content component that uses useSearchParams
function BrowseContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addGameToLibrary } = useLibrary(false)
  const toast = useToast()
  
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [searchResultsCount, setSearchResultsCount] = useState(0)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [customYearInput, setCustomYearInput] = useState('')
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [showExpandedCard, setShowExpandedCard] = useState(false)
  
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedGenres: [],
    selectedPlatforms: [],
    sortBy: 'popular'
  })

  // Parse URL parameters
  useEffect(() => {
    const query = searchParams.get('q')
    const genreIds = searchParams.getAll('genre_id')
    const platformIds = searchParams.getAll('platform_id')
    const year = searchParams.get('year')
    const minRating = searchParams.get('min_rating')
    const maxRating = searchParams.get('max_rating')
    
    if (query || genreIds.length || platformIds.length || year || minRating || maxRating) {
      setIsSearchMode(true)
      setSearchInput(query || '')
      
      const genreNames = genreIds
        .map(id => GENRE_ID_TO_NAME[id])
        .filter(Boolean)
      
      const platforms = platformIds.map(id => parseInt(id)).filter(id => !isNaN(id))
      
      setFilters(prev => ({
        ...prev,
        searchQuery: query || '',
        selectedGenres: genreNames,
        selectedPlatforms: platforms,
        selectedYear: year ? parseInt(year) : undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        maxRating: maxRating ? parseFloat(maxRating) : undefined
      }))
    } else {
      setIsSearchMode(false)
    }
  }, [searchParams])

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({ ...prev, searchQuery: searchInput }))
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchInput])

  // Fetch games
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true)
        
        const hasFilters = filters.searchQuery.trim() || 
          filters.selectedGenres.length || 
          filters.selectedPlatforms.length || 
          filters.selectedYear || 
          filters.minRating !== undefined || 
          filters.maxRating !== undefined

        if (hasFilters) {
          setIsSearchMode(true)
          
          let url = `/api/new-search-game?q=${encodeURIComponent(filters.searchQuery.trim() || '*')}`
          
          if (filters.selectedGenres.length) {
            const genreIds = filters.selectedGenres
              .map(name => GENRE_NAME_TO_ID[name])
              .filter(Boolean)
              .map(id => `genre_id=${id}`)
              .join('&')
            if (genreIds) url += `&${genreIds}`
          }
          
          if (filters.selectedPlatforms.length) {
            url += `&${filters.selectedPlatforms.map(id => `platform_id=${id}`).join('&')}`
          }
          
          if (filters.selectedYear) url += `&year=${filters.selectedYear}`
          if (filters.minRating !== undefined) url += `&min_rating=${filters.minRating}`
          if (filters.maxRating !== undefined) url += `&max_rating=${filters.maxRating}`
          
          const response = await fetch(url)
          if (!response.ok) throw new Error('Search failed')
          
          const data = await response.json()
          let results = data.results || []
          
          // Client-side sorting
          if (filters.sortBy !== 'popular') {
            results = [...results].sort((a, b) => {
              if (filters.sortBy === 'name') return a.name.localeCompare(b.name)
              if (filters.sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
              if (filters.sortBy === 'release_date') return (b.release_date || '').localeCompare(a.release_date || '')
              return 0
            })
          }
          
          setGames(results)
          setSearchResultsCount(data.total || 0)
        } else {
          setIsSearchMode(false)
          const response = await fetch('/api/db/popular?limit=24')
          const data = await response.json()
          setGames(data || [])
          setSearchResultsCount(0)
        }
      } catch (error) {
        console.error('Error fetching games:', error)
        setGames([])
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [filters.searchQuery, filters.selectedGenres, filters.selectedPlatforms, filters.sortBy, filters.selectedYear, filters.minRating, filters.maxRating])

  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleGenreToggle = (genreName: string) => {
    setFilters(prev => ({
      ...prev,
      selectedGenres: prev.selectedGenres.includes(genreName)
        ? prev.selectedGenres.filter(g => g !== genreName)
        : [...prev.selectedGenres, genreName]
    }))
  }

  const clearFilters = () => {
    setSearchInput('')
    setCustomYearInput('')
    setFilters({
      searchQuery: '',
      selectedGenres: [],
      selectedPlatforms: [],
      sortBy: 'popular'
    })
    router.push('/browse')
  }

  const hasActiveFilters = filters.searchQuery || 
    filters.selectedGenres.length || 
    filters.selectedPlatforms.length ||
    filters.sortBy !== 'popular' || 
    filters.selectedYear !== undefined ||
    filters.minRating !== undefined ||
    filters.maxRating !== undefined

  const handleGameSelect = (gameId: number) => {
    const selectedGame = games.find(game => game.id === gameId)
    if (selectedGame) {
      setSelectedGameId(gameId)
      setShowExpandedCard(true)
    }
  }

  const handleAddToLibrary = async (
    gameId: number, 
    status: 'backlog' | 'playing' | 'completed' | 'dropped', 
    hoursPlayed = 0
  ) => {
    try {
      const game = games.find(g => g.id === gameId)
      if (!game) {
        toast.error('Game not found')
        return
      }

      await addGameToLibrary(game, status, hoursPlayed)
      toast.success(`"${game.name}" added to your library!`)
    } catch (error) {
      console.error('Error adding to library:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add game')
    }
  }

  const selectedGame = selectedGameId ? games.find(game => game.id === selectedGameId) : null

  return (
    <>
      <style jsx>{`
        /* ...existing gradient styles... */
      `}</style>
      
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Gradient decorations */}
        <div className="gradient-circles">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={i < 5 ? 'gradient-circle' : 'gradient-triangle'} />
          ))}
        </div>
      
        <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {isSearchMode ? 'Search Results' : 'Browse Games'}
            </h1>
            <p className="text-zinc-400 text-lg">
              {isSearchMode ? (
                <>
                  Found <span className="text-white font-semibold">{searchResultsCount}</span> games
                  {filters.searchQuery && <> for &quot;<span className="text-white font-medium">{filters.searchQuery}</span>&quot;</>}
                  {filters.selectedGenres.length > 0 && (
                    <> with <span className="text-purple-400">{filters.selectedGenres.length} genre filter{filters.selectedGenres.length > 1 ? 's' : ''}</span></>
                  )}
                </>
              ) : (
                'Discover and explore thousands of games with advanced filtering'
              )}
            </p>
            {isSearchMode && (
              <div className="mt-4">
                <Button 
                  onClick={() => { clearFilters(); router.push('/browse') }}
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500"
                >
                  ← Back to Browse
                </Button>
              </div>
            )}
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Search games..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-[#5d4af8] focus:ring-[#5d4af8]"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 flex items-center gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="bg-[#5d4af8] text-white text-xs px-1.5 py-0.5">
                      {filters.selectedGenres.length + (filters.searchQuery ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Filter panels */}
            {showFilters && (
              <div className="border-t border-zinc-700 pt-6 space-y-6">
                {/* Active Filters Summary */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-zinc-400 text-sm">Active filters:</span>
                    {filters.searchQuery && (
                      <Badge variant="secondary" className="bg-blue-600/90 text-white">
                        Query: "{filters.searchQuery}"
                      </Badge>
                    )}
                    {filters.selectedGenres.map(genre => (
                      <Badge key={genre} variant="secondary" className="bg-purple-600/90 text-white">
                        {genre}
                      </Badge>
                    ))}
                    {filters.selectedPlatforms.map(platformId => (
                      <Badge key={platformId} variant="secondary" className="bg-emerald-600/90 text-white">
                        {PLATFORM_NAMES[platformId]}
                      </Badge>
                    ))}
                    {filters.selectedYear && (
                      <Badge variant="secondary" className="bg-amber-600/90 text-white">
                        Year: {filters.selectedYear}
                      </Badge>
                    )}
                    {(filters.minRating !== undefined || filters.maxRating !== undefined) && (
                      <Badge variant="secondary" className="bg-rose-600/90 text-white">
                        Rating: {filters.minRating ? (filters.minRating / 10).toFixed(1) : '0'}-{filters.maxRating ? (filters.maxRating / 10).toFixed(1) : '10'}
                      </Badge>
                    )}
                    <Button
                      onClick={clearFilters}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      Clear All
                    </Button>
                  </div>
                )}

                {/* Genre Filters */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {IGDB_GENRES.map((genre) => {
                      const isSelected = filters.selectedGenres.includes(genre.name)
                      return (
                        <Button
                          key={genre.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleGenreToggle(genre.name)}
                          className={`${
                            isSelected 
                              ? 'bg-[#5d4af8] text-white border-[#5d4af8]' 
                              : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {genre.name}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Platform Filters */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Platforms</h3>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((platform) => {
                      const isSelected = filters.selectedPlatforms.includes(platform.id)
                      return (
                        <Button
                          key={platform.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFilterChange('selectedPlatforms', 
                            isSelected 
                              ? filters.selectedPlatforms.filter(id => id !== platform.id)
                              : [...filters.selectedPlatforms, platform.id]
                          )}
                          className={`${
                            isSelected 
                              ? 'bg-emerald-600 text-white border-emerald-600' 
                              : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {platform.name}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Year Filter */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Release Year</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map((year) => {
                      const isSelected = filters.selectedYear === year
                      return (
                        <Button
                          key={year}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFilterChange('selectedYear', isSelected ? undefined : year)}
                          className={`${
                            isSelected 
                              ? 'bg-amber-600 text-white border-amber-600' 
                              : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {year}
                        </Button>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Custom year"
                      value={customYearInput}
                      onChange={(e) => setCustomYearInput(e.target.value)}
                      className="w-32 bg-zinc-800 border-zinc-700 text-white"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const year = parseInt(customYearInput)
                        if (!isNaN(year) && year > 1970 && year <= new Date().getFullYear() + 2) {
                          handleFilterChange('selectedYear', year)
                          setCustomYearInput('')
                        }
                      }}
                      className="bg-zinc-700 hover:bg-zinc-600"
                    >
                      Apply
                    </Button>
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Rating</h3>
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Min Rating</label>
                      <select
                        value={filters.minRating || ''}
                        onChange={(e) => handleFilterChange('minRating', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:border-[#5d4af8] focus:ring-[#5d4af8]"
                      >
                        <option value="">Any</option>
                        <option value="90">9.0+</option>
                        <option value="85">8.5+</option>
                        <option value="80">8.0+</option>
                        <option value="75">7.5+</option>
                        <option value="70">7.0+</option>
                        <option value="65">6.5+</option>
                        <option value="60">6.0+</option>
                        <option value="50">5.0+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Max Rating</label>
                      <select
                        value={filters.maxRating || ''}
                        onChange={(e) => handleFilterChange('maxRating', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:border-[#5d4af8] focus:ring-[#5d4af8]"
                      >
                        <option value="">Any</option>
                        <option value="100">10.0 or less</option>
                        <option value="95">9.5 or less</option>
                        <option value="90">9.0 or less</option>
                        <option value="85">8.5 or less</option>
                        <option value="80">8.0 or less</option>
                        <option value="75">7.5 or less</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Sort By</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'popular', label: 'Popular' },
                      { key: 'rating', label: 'Rating' },
                      { key: 'name', label: 'Name' },
                      { key: 'release_date', label: 'Release Date' }
                    ].map((sort) => {
                      const isSelected = filters.sortBy === sort.key
                      return (
                        <Button
                          key={sort.key}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFilterChange('sortBy', sort.key as FilterState['sortBy'])}
                          className={`${
                            isSelected 
                              ? 'bg-[#5d4af8] text-white border-[#5d4af8]' 
                              : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {sort.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Games Display */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-zinc-800 rounded-lg h-96 animate-pulse" />
              ))}
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold mb-2">No games found</h3>
              <p className="text-zinc-400 mb-4">
                {isSearchMode ? 'Try adjusting your search or filters' : 'Unable to load games'}
              </p>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline" className="border-zinc-700">
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <GameGrid 
              games={games}
              viewMode={viewMode}
              onAddToLibrary={(gameId, status = 'backlog') => handleAddToLibrary(gameId, status)}
              onMoreInfo={handleGameSelect}
            />
          )}
        </div>

        {/* Expanded Card Modal */}
        {selectedGame && (
          <ExpandedGameCard
            game={selectedGame}
            isOpen={showExpandedCard}
            onClose={() => { setShowExpandedCard(false); setSelectedGameId(null) }}
            onAddToLibrary={(status = 'backlog', hoursPlayed = 0) => 
              handleAddToLibrary(selectedGame.id, status, hoursPlayed)
            }
            onPlay={() => setShowExpandedCard(false)}
          />
        )}
      </div>
    </>
  )
}

// Page wrapper with Suspense boundary
export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-zinc-700 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading games...</p>
        </div>
      </div>
    }>
      <BrowseContent />
    </Suspense>
  )
}