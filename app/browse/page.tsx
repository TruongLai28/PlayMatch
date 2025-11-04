'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Filter, ChevronDown, Grid3X3, List, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { GameCard, GameGrid } from '@/features/game'

interface Game {
  id: number
  name: string
  cover?: {
    url: string
  }
  cover_url?: string // Support both formats
  summary?: string
  rating?: number
  genres?: Array<{ id: number; name: string }>
  platforms?: Array<{ id: number; name: string }>
  release_date?: string
}

interface FilterState {
  searchQuery: string
  selectedGenres: string[]
  sortBy: 'popular' | 'rating' | 'name' | 'release_date'
  yearRange: string
  ratingRange: string
}

export default function BrowsePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [genres, setGenres] = useState<Array<{ id?: number; name: string }>>([])
  const [searchResultsCount, setSearchResultsCount] = useState<number>(0)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedGenres: [],
    sortBy: 'popular',
    yearRange: 'all',
    ratingRange: 'all'
  })

  // Handle URL search parameters
  useEffect(() => {
    const query = searchParams.get('q')
    const genreIds = searchParams.getAll('genre_id')
    
    if (query || genreIds.length > 0) {
      setIsSearchMode(true)
      setSearchInput(query || '')
      
      // Convert genre IDs to genre names for the filter system
      const genreIdToName: { [key: string]: string } = {
        '2': 'Point-and-click',
        '4': 'Fighting',
        '5': 'Shooter',
        '7': 'Music',
        '8': 'Platform',
        '9': 'Puzzle',
        '10': 'Racing',
        '11': 'Real Time Strategy (RTS)',
        '12': 'Role-playing (RPG)',
        '13': 'Simulator',
        '14': 'Sport',
        '15': 'Strategy',
        '16': 'Turn-based Strategy (TBS)',
        '24': 'Tactical',
        '25': 'Hack & slash/Beat \'em up',
        '26': 'Quiz/Trivia',
        '30': 'Pinball',
        '31': 'Adventure',
        '32': 'Indie',
        '33': 'Arcade',
        '34': 'Visual Novel',
        '35': 'Card & Board Game',
        '36': 'MOBA'
      }
      
      const genreNames = genreIds
        .map(id => genreIdToName[id])
        .filter(name => name !== undefined)
      
      setFilters(prev => ({
        ...prev,
        searchQuery: query || '',
        selectedGenres: genreNames
      }))
    } else {
      setIsSearchMode(false)
    }
  }, [searchParams])

  // Debounced search input effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        searchQuery: searchInput
      }))
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchInput])

  // Fetch games data
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true)
        
        // Use search API if there's a search query or selected genres
        if (filters.searchQuery.trim() || filters.selectedGenres.length > 0) {
          setIsSearchMode(true)
          
          // Build search URL
          let url = `/api/new-search-game?q=${encodeURIComponent(filters.searchQuery.trim() || '*')}`
          
          // Add genre filters - need to convert genre names to IDs
          if (filters.selectedGenres.length > 0) {
            // Check if we have genre IDs from URL or genre names from UI
            const genreIds = searchParams.getAll('genre_id')
            
            if (genreIds.length > 0) {
              // Use genre IDs directly from URL
              const genreParams = genreIds.map(id => `genre_id=${id}`).join('&')
              url += `&${genreParams}`
            } else {
              // Convert genre names to IDs for UI-selected genres
              const genreNameToId: { [key: string]: number } = {
                'Point-and-click': 2,
                'Fighting': 4,
                'Shooter': 5,
                'Music': 7,
                'Platform': 8,
                'Puzzle': 9,
                'Racing': 10,
                'Real Time Strategy (RTS)': 11,
                'Role-playing (RPG)': 12,
                'Simulator': 13,
                'Sport': 14,
                'Strategy': 15,
                'Turn-based Strategy (TBS)': 16,
                'Tactical': 24,
                'Hack & slash/Beat \'em up': 25,
                'Quiz/Trivia': 26,
                'Pinball': 30,
                'Adventure': 31,
                'Indie': 32,
                'Arcade': 33,
                'Visual Novel': 34,
                'Card & Board Game': 35,
                'MOBA': 36
              }
              
              const mappedGenreIds = filters.selectedGenres
                .map(name => genreNameToId[name])
                .filter(id => id !== undefined)
              
              if (mappedGenreIds.length > 0) {
                const genreParams = mappedGenreIds.map(id => `genre_id=${id}`).join('&')
                url += `&${genreParams}`
              }
            }
          }
          
          console.log('Browse page search URL:', url)
          const response = await fetch(url)
          
          if (!response.ok) {
            throw new Error('Failed to search games')
          }
          
          const data = await response.json()
          console.log('Browse page search results:', data.results?.length || 0)
          
          let results = data.results || []
          
          // Apply client-side sorting if needed
          if (filters.sortBy !== 'popular') {
            results = [...results].sort((a, b) => {
              switch (filters.sortBy) {
                case 'name':
                  return a.name.localeCompare(b.name)
                case 'rating':
                  return (b.rating || 0) - (a.rating || 0)
                case 'release_date':
                  return (b.release_date || '').localeCompare(a.release_date || '')
                default:
                  return 0
              }
            })
          }
          
          setGames(results)
          setSearchResultsCount(data.total || 0)
        } else {
          setIsSearchMode(false)
          // Use popular games as default
          const response = await fetch('/api/db/popular?limit=24')
          const data = await response.json()
          setGames(data || [])
          setSearchResultsCount(0)
        }
      } catch (error) {
        console.error('Error fetching games:', error)
        setGames([])
        setSearchResultsCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [filters.searchQuery, filters.selectedGenres, filters.sortBy])

  // Load IGDB genres for filter dropdown
  useEffect(() => {
    const loadGenres = () => {
      // Use the same IGDB genre list as HeaderSearch
      const igdbGenres = [
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
      setGenres(igdbGenres)
    }
    loadGenres()
  }, [])

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
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
    setFilters({
      searchQuery: '',
      selectedGenres: [],
      sortBy: 'popular',
      yearRange: 'all',
      ratingRange: 'all'
    })
  }

  const hasActiveFilters = filters.searchQuery || 
    filters.selectedGenres.length > 0 || 
    filters.sortBy !== 'popular' || 
    filters.yearRange !== 'all' || 
    filters.ratingRange !== 'all'

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isSearchMode ? 'Search Results' : 'Browse Games'}
          </h1>
          <p className="text-zinc-400 text-lg">
            {isSearchMode ? (
              <>
                Found <span className="text-white font-semibold">{searchResultsCount}</span> games
                {filters.searchQuery && (
                  <> for "<span className="text-white font-medium">{filters.searchQuery}</span>"</>
                )}
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
                onClick={() => {
                  clearFilters()
                  router.push('/browse')
                }}
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
          {/* Top row - Search and view controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search Input */}
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

            {/* View Mode Toggle */}
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

              {/* Filter Toggle */}
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

          {/* Filter Section */}
          {showFilters && (
            <div className="border-t border-zinc-700 pt-6 space-y-6">
              {/* Quick Filters */}
              <div>
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Quick Filters</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filters.sortBy === 'popular' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('sortBy', 'popular')}
                    className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  >
                    Most Popular
                  </Button>
                  <Button
                    variant={filters.sortBy === 'rating' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('sortBy', 'rating')}
                    className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  >
                    Highest Rated
                  </Button>
                  <Button
                    variant={filters.sortBy === 'release_date' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('sortBy', 'release_date')}
                    className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  >
                    New Releases
                  </Button>
                  <Button
                    variant={filters.sortBy === 'name' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('sortBy', 'name')}
                    className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  >
                    A-Z
                  </Button>
                </div>
              </div>

              {/* Genre Filter */}
              <div>
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Genres</h3>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {genres.map((genre) => (
                    <Button
                      key={genre.id ?? genre.name}
                      variant={filters.selectedGenres.includes(genre.name) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleGenreToggle(genre.name)}
                      className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-xs"
                    >
                      {genre.name}
                      {filters.selectedGenres.includes(genre.name) && (
                        <span className="ml-1">✓</span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Additional Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Year Range */}
                <div>
                  <h3 className="text-sm font-medium text-zinc-300 mb-3">Release Year</h3>
                  <div className="flex flex-wrap gap-2">
                    {['all', '2024', '2023', '2022', '2021', '2020', 'older'].map((year) => (
                      <Button
                        key={year}
                        variant={filters.yearRange === year ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('yearRange', year)}
                        className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-xs"
                      >
                        {year === 'all' ? 'All Years' : year === 'older' ? '2019 & Earlier' : year}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Rating Range */}
                <div>
                  <h3 className="text-sm font-medium text-zinc-300 mb-3">Rating</h3>
                  <div className="flex flex-wrap gap-2">
                    {['all', '90+', '80+', '70+', '60+'].map((rating) => (
                      <Button
                        key={rating}
                        variant={filters.ratingRange === rating ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('ratingRange', rating)}
                        className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-xs"
                      >
                        {rating === 'all' ? 'All Ratings' : rating}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={clearFilters}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-zinc-400">Active filters:</span>
              {filters.searchQuery && (
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                  Search: "{filters.searchQuery}"
                </Badge>
              )}
              {filters.selectedGenres.map((genre) => (
                <Badge key={genre} variant="secondary" className="bg-zinc-800 text-zinc-300">
                  {genre}
                </Badge>
              ))}
              {filters.sortBy !== 'popular' && (
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                  Sort: {filters.sortBy.replace('_', ' ')}
                </Badge>
              )}
              {filters.yearRange !== 'all' && (
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                  Year: {filters.yearRange}
                </Badge>
              )}
              {filters.ratingRange !== 'all' && (
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                  Rating: {filters.ratingRange}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Results Count and Status */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-zinc-400">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin"></div>
                Searching...
              </div>
            ) : (
              <div>
                {isSearchMode ? (
                  <>
                    <span className="text-white font-semibold">{games.length}</span> games found
                    {filters.searchQuery && (
                      <> for "<span className="text-white">{filters.searchQuery}</span>"</>
                    )}
                  </>
                ) : (
                  `${games.length} popular games`
                )}
              </div>
            )}
          </div>
          
          {!loading && games.length === 0 && isSearchMode && (
            <div className="text-zinc-500 text-sm">
              Try adjusting your search terms or filters
            </div>
          )}
        </div>

        {/* Games Grid/List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4 md:px-8 lg:px-12">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-zinc-800 rounded-lg h-96 animate-pulse" />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-semibold text-white mb-2">No games found</h3>
            <p className="text-zinc-400 mb-4">
              {isSearchMode 
                ? "Try adjusting your search query or removing some filters" 
                : "Unable to load games at the moment"}
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" className="border-zinc-700 text-zinc-300">
                Clear All Filters
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <GameGrid 
            games={games}
            onAddToList={(gameId: number) => console.log('Add to list:', gameId)}
            onAddToLibrary={(gameId: number) => console.log('Like game:', gameId)}
            onMoreInfo={(gameId: number) => console.log('More info:', gameId)}
          />
        ) : (
          <div className="space-y-4">
            {games.map((game) => (
              <div key={game.id} className="bg-zinc-900 rounded-lg p-4 flex gap-4 items-start">
                <div className="w-20 h-28 bg-zinc-800 rounded flex-shrink-0">
                  {(game.cover?.url || game.cover_url) && (
                    <img
                      src={(game.cover?.url || game.cover_url || '').replace('t_thumb', 't_cover_small')}
                      alt={game.name}
                      className="w-full h-full object-cover rounded"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-2 truncate">
                    {game.name}
                  </h3>
                  {game.genres && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {game.genres.slice(0, 3).map((genre, i) => (
                        <Badge key={i} variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
                          {genre.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {game.summary && (
                    <p className="text-zinc-400 text-sm line-clamp-2">
                      {game.summary}
                    </p>
                  )}
                  {game.rating && (
                    <div className="mt-2">
                      <Badge className="bg-yellow-600 text-white text-xs">
                        {Math.round(game.rating / 10)}/10
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && games.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl text-zinc-400 mb-4">No games found</h3>
            <p className="text-zinc-500 mb-6">
              Try adjusting your filters or search terms
            </p>
            <Button
              onClick={clearFilters}
              variant="outline"
              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
