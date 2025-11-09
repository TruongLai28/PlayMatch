'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Filter, ChevronDown, Grid3X3, List, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { GameCard, GameGrid, ExpandedGameCard } from '@/features/game'
import { useLibrary } from '@/hooks/use-library'
import { useToast } from '@/hooks/use-toast'

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
  selectedPlatforms: number[]
  sortBy: 'popular' | 'rating' | 'name' | 'release_date'
  selectedYear?: number
  minRating?: number
  maxRating?: number
}

export default function BrowsePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addGameToLibrary, isLoading: libraryLoading } = useLibrary(false) // Don't auto-load library on browse page
  const toast = useToast()
  
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [genres, setGenres] = useState<Array<{ id?: number; name: string }>>([])
  const [searchResultsCount, setSearchResultsCount] = useState<number>(0)
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

  // Handle URL search parameters
  useEffect(() => {
    const query = searchParams.get('q')
    const genreIds = searchParams.getAll('genre_id')
    const platformIds = searchParams.getAll('platform_id')
    const year = searchParams.get('year')
    const minRating = searchParams.get('min_rating')
    const maxRating = searchParams.get('max_rating')
    
    if (query || genreIds.length > 0 || platformIds.length > 0 || year || minRating || maxRating) {
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
        
        // Use search API if there's a search query or any filters selected
        if (filters.searchQuery.trim() || filters.selectedGenres.length > 0 || filters.selectedPlatforms.length > 0 || filters.selectedYear || filters.minRating !== undefined || filters.maxRating !== undefined) {
          setIsSearchMode(true)
          
          // Build search URL
          let url = `/api/new-search-game?q=${encodeURIComponent(filters.searchQuery.trim() || '*')}`
          
          // Add genre filters
          if (filters.selectedGenres.length > 0) {
            // Convert genre names to IDs
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
          
          // Add platform filters
          if (filters.selectedPlatforms.length > 0) {
            const platformParams = filters.selectedPlatforms.map(id => `platform_id=${id}`).join('&')
            url += `&${platformParams}`
          }
          
          // Add year filter
          if (filters.selectedYear) {
            url += `&year=${filters.selectedYear}`
          }
          
          // Add rating filters
          if (filters.minRating !== undefined) {
            url += `&min_rating=${filters.minRating}`
          }
          if (filters.maxRating !== undefined) {
            url += `&max_rating=${filters.maxRating}`
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
  }, [filters.searchQuery, filters.selectedGenres, filters.selectedPlatforms, filters.sortBy, filters.selectedYear, filters.minRating, filters.maxRating])

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
    setCustomYearInput('')
    setFilters({
      searchQuery: '',
      selectedGenres: [],
      selectedPlatforms: [],
      sortBy: 'popular'
    })
    // Clear URL parameters by navigating to base browse page
    router.push('/browse')
  }

  const hasActiveFilters = filters.searchQuery || 
    filters.selectedGenres.length > 0 || 
    filters.selectedPlatforms.length > 0 ||
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

  const handleCloseExpandedCard = () => {
    setShowExpandedCard(false)
    setSelectedGameId(null)
  }

  const selectedGame = selectedGameId ? games.find(game => game.id === selectedGameId) : null

  // Handle adding game to library
  const handleAddToLibrary = async (gameId: number, status: 'backlog' | 'playing' | 'completed' | 'dropped', hoursPlayed: number = 0) => {
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
      toast.error(error instanceof Error ? error.message : 'Failed to add game to library')
    }
  }

  // Handle adding game to wishlist (we can treat this as backlog status)
  const handleAddToWishlist = async (gameId: number) => {
    await handleAddToLibrary(gameId, 'backlog')
  }

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
      
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
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
      
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
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
                    variant={filters.sortBy === 'rating' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (filters.sortBy === 'rating') {
                        // If already selected, reset to default
                        handleFilterChange('sortBy', 'popular')
                        handleFilterChange('minRating', undefined)
                      } else {
                        // If not selected, apply the filter
                        handleFilterChange('sortBy', 'rating')
                        handleFilterChange('minRating', 90)
                      }
                    }}
                    className={filters.sortBy === 'rating' 
                      ? "bg-[#5d4af8] hover:bg-[#5d4af8]/90 text-white border-[#5d4af8]" 
                      : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
                    }
                  >
                    Highest Rated (9.0+)
                  </Button>
                  <Button
                    variant={filters.sortBy === 'release_date' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (filters.sortBy === 'release_date') {
                        // If already selected, reset to default
                        handleFilterChange('sortBy', 'popular')
                        handleFilterChange('selectedYear', undefined)
                      } else {
                        // If not selected, apply the filter
                        handleFilterChange('sortBy', 'release_date')
                        handleFilterChange('selectedYear', 2025)
                      }
                    }}
                    className={filters.sortBy === 'release_date' 
                      ? "bg-[#5d4af8] hover:bg-[#5d4af8]/90 text-white border-[#5d4af8]" 
                      : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
                    }
                  >
                    New Releases (2025)
                  </Button>
                  <Button
                    variant={filters.sortBy === 'name' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (filters.sortBy === 'name') {
                        // If already selected, reset to default
                        handleFilterChange('sortBy', 'popular')
                      } else {
                        // If not selected, apply the filter
                        handleFilterChange('sortBy', 'name')
                      }
                    }}
                    className={filters.sortBy === 'name' 
                      ? "bg-[#5d4af8] hover:bg-[#5d4af8]/90 text-white border-[#5d4af8]" 
                      : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
                    }
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
                      className={filters.selectedGenres.includes(genre.name)
                        ? "bg-[#5d4af8] hover:bg-[#5d4af8]/90 text-white border-[#5d4af8] text-xs"
                        : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200 text-xs"
                      }
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Platform Filter */}
                <div>
                  <h3 className="text-sm font-medium text-emerald-400 mb-3">Platform</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 6, name: 'PC' },
                      { id: 167, name: 'PS5' },
                      { id: 48, name: 'PS4' },
                      { id: 169, name: 'Xbox Series' },
                      { id: 49, name: 'Xbox One' },
                      { id: 130, name: 'Switch' },
                      { id: 3, name: 'Linux' },
                      { id: 14, name: 'Mac' }
                    ].map((platform) => (
                      <Button
                        key={platform.id}
                        variant={filters.selectedPlatforms.includes(platform.id) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const newPlatforms = filters.selectedPlatforms.includes(platform.id)
                            ? filters.selectedPlatforms.filter(id => id !== platform.id)
                            : [...filters.selectedPlatforms, platform.id]
                          handleFilterChange('selectedPlatforms', newPlatforms)
                        }}
                        className={filters.selectedPlatforms.includes(platform.id)
                          ? "bg-[#5d4af8] hover:bg-[#5d4af8]/90 text-white border-[#5d4af8] text-xs"
                          : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200 text-xs"
                        }
                      >
                        {platform.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Year Filter */}
                <div>
                  <h3 className="text-sm font-medium text-amber-400 mb-3">Release Year</h3>
                  <div className="flex flex-wrap gap-2 items-center">
                    {[
                      { value: null, label: 'All Years' },
                      { value: 2025, label: '2025' },
                      { value: 2024, label: '2024' },
                      { value: 2023, label: '2023' },
                      { value: 2022, label: '2022' },
                      { value: 2021, label: '2021' },
                      { value: 2020, label: '2020' }
                    ].map((yearOption) => (
                      <Button
                        key={yearOption.label}
                        variant={filters.selectedYear === yearOption.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          handleFilterChange('selectedYear', yearOption.value)
                          setCustomYearInput('') // Clear custom input when selecting preset
                        }}
                        className={filters.selectedYear === yearOption.value
                          ? "bg-[#5d4af8] hover:bg-[#5d4af8]/90 text-white border-[#5d4af8] text-xs"
                          : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200 text-xs"
                        }
                      >
                        {yearOption.label}
                      </Button>
                    ))}
                    
                    {/* Custom Year Input - Inline */}
                    <div className="flex items-center gap-2 ml-2">
                      <label className="text-xs text-zinc-400 whitespace-nowrap">or</label>
                      <Input
                        type="number"
                        placeholder="Custom year"
                        value={customYearInput}
                        onChange={(e) => setCustomYearInput(e.target.value)}
                        className="w-24 h-8 px-2 text-xs bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-[#5d4af8] focus:ring-[#5d4af8]"
                        min="1970"
                        max="2030"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const year = parseInt(customYearInput)
                          if (!isNaN(year) && year >= 1970 && year <= 2030) {
                            handleFilterChange('selectedYear', year)
                            setCustomYearInput('')
                          }
                        }}
                        disabled={!customYearInput || isNaN(parseInt(customYearInput))}
                        className="h-8 px-3 text-xs bg-[#5d4af8] hover:bg-[#5d4af8]/90 text-white"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <h3 className="text-sm font-medium text-rose-400 mb-3">Rating</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Min Rating</label>
                      <select
                        value={filters.minRating || ''}
                        onChange={(e) => handleFilterChange('minRating', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full bg-zinc-800/80 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#5d4af8]/50 focus:border-[#5d4af8] hover:bg-zinc-700/80 transition-colors appearance-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 8px center',
                          backgroundSize: '16px',
                          paddingRight: '32px'
                        }}
                      >
                        <option value="" className="bg-zinc-800 text-zinc-200">Any</option>
                        <option value="90" className="bg-zinc-800 text-zinc-200">9.0+</option>
                        <option value="85" className="bg-zinc-800 text-zinc-200">8.5+</option>
                        <option value="80" className="bg-zinc-800 text-zinc-200">8.0+</option>
                        <option value="75" className="bg-zinc-800 text-zinc-200">7.5+</option>
                        <option value="70" className="bg-zinc-800 text-zinc-200">7.0+</option>
                        <option value="65" className="bg-zinc-800 text-zinc-200">6.5+</option>
                        <option value="60" className="bg-zinc-800 text-zinc-200">6.0+</option>
                        <option value="50" className="bg-zinc-800 text-zinc-200">5.0+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Max Rating</label>
                      <select
                        value={filters.maxRating || ''}
                        onChange={(e) => handleFilterChange('maxRating', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full bg-zinc-800/80 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#5d4af8]/50 focus:border-[#5d4af8] hover:bg-zinc-700/80 transition-colors appearance-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 8px center',
                          backgroundSize: '16px',
                          paddingRight: '32px'
                        }}
                      >
                        <option value="" className="bg-zinc-800 text-zinc-200">Any</option>
                        <option value="100" className="bg-zinc-800 text-zinc-200">10.0 or less</option>
                        <option value="95" className="bg-zinc-800 text-zinc-200">9.5 or less</option>
                        <option value="90" className="bg-zinc-800 text-zinc-200">9.0 or less</option>
                        <option value="85" className="bg-zinc-800 text-zinc-200">8.5 or less</option>
                        <option value="80" className="bg-zinc-800 text-zinc-200">8.0 or less</option>
                        <option value="75" className="bg-zinc-800 text-zinc-200">7.5 or less</option>
                      </select>
                    </div>
                  </div>
                  {(filters.minRating !== undefined || filters.maxRating !== undefined) && (
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          setFilters(prev => ({
                            ...prev,
                            minRating: undefined,
                            maxRating: undefined
                          }))
                        }}
                        className="text-xs text-zinc-400 hover:text-zinc-300 underline"
                      >
                        Clear rating filters
                      </button>
                    </div>
                  )}
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
                <Badge 
                  variant="secondary" 
                  className="bg-zinc-800 text-zinc-300 cursor-pointer hover:bg-zinc-700 flex items-center gap-1"
                  onClick={() => {
                    setSearchInput('')
                    handleFilterChange('searchQuery', '')
                  }}
                >
                  Search: "{filters.searchQuery}"
                  <span className="ml-1 text-xs">×</span>
                </Badge>
              )}
              {filters.selectedGenres.map((genre) => (
                <Badge 
                  key={genre} 
                  variant="secondary" 
                  className="bg-purple-900 text-purple-300 cursor-pointer hover:bg-purple-800 flex items-center gap-1"
                  onClick={() => handleGenreToggle(genre)}
                >
                  {genre}
                  <span className="ml-1 text-xs">×</span>
                </Badge>
              ))}
              {filters.selectedPlatforms.map((platformId) => {
                const platformNames: { [key: number]: string } = {
                  6: 'PC', 167: 'PS5', 48: 'PS4', 169: 'Xbox Series', 
                  49: 'Xbox One', 130: 'Switch', 3: 'Linux', 14: 'Mac'
                }
                return (
                  <Badge 
                    key={platformId} 
                    variant="secondary" 
                    className="bg-emerald-900 text-emerald-300 cursor-pointer hover:bg-emerald-800 flex items-center gap-1"
                    onClick={() => {
                      const newPlatforms = filters.selectedPlatforms.filter(id => id !== platformId)
                      handleFilterChange('selectedPlatforms', newPlatforms)
                    }}
                  >
                    {platformNames[platformId] || `Platform ${platformId}`}
                    <span className="ml-1 text-xs">×</span>
                  </Badge>
                )
              })}
              {filters.sortBy !== 'popular' && (
                <Badge 
                  variant="secondary" 
                  className="bg-zinc-800 text-zinc-300 cursor-pointer hover:bg-zinc-700 flex items-center gap-1"
                  onClick={() => handleFilterChange('sortBy', 'popular')}
                >
                  Sort: {filters.sortBy.replace('_', ' ')}
                  <span className="ml-1 text-xs">×</span>
                </Badge>
              )}
              {filters.selectedYear && (
                <Badge 
                  variant="secondary" 
                  className="bg-amber-900 text-amber-300 cursor-pointer hover:bg-amber-800 flex items-center gap-1"
                  onClick={() => handleFilterChange('selectedYear', undefined)}
                >
                  Year: {filters.selectedYear}
                  <span className="ml-1 text-xs">×</span>
                </Badge>
              )}
              {(filters.minRating !== undefined || filters.maxRating !== undefined) && (
                <Badge 
                  variant="secondary" 
                  className="bg-rose-900 text-rose-300 cursor-pointer hover:bg-rose-800 flex items-center gap-1"
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      minRating: undefined,
                      maxRating: undefined
                    }))
                  }}
                >
                  Rating: {filters.minRating ? `${(filters.minRating / 10).toFixed(1)}+` : 'All'}
                  <span className="ml-1 text-xs">×</span>
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
            onAddToLibrary={(gameId: number, status = 'backlog') => {
              handleAddToLibrary(gameId, status)
            }}
            onMoreInfo={(gameId: number) => handleGameSelect(gameId)}
          />
        ) : (
          <div className="space-y-4">
            {games.map((game) => (
              <div 
                key={game.id} 
                className={`bg-zinc-900 rounded-lg p-4 flex gap-4 items-start cursor-pointer transition-all duration-200 hover:bg-zinc-800 hover:shadow-lg border ${
                  selectedGameId === game.id 
                    ? 'border-[#5d4af8] shadow-[0_0_20px_rgba(93,74,248,0.3)]' 
                    : 'border-transparent hover:border-zinc-700'
                }`}
                onClick={() => handleGameSelect(game.id)}
              >
                <div className="w-20 h-28 bg-zinc-800 rounded flex-shrink-0 overflow-hidden">
                  {(game.cover?.url || game.cover_url) && (
                    <img
                      src={(game.cover?.url || game.cover_url || '').replace('t_thumb', 't_cover_small')}
                      alt={game.name}
                      className="w-full h-full object-cover rounded transition-transform duration-200 hover:scale-105"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-2 truncate hover:text-[#5d4af8] transition-colors">
                    {game.name}
                  </h3>
                  {game.genres && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {game.genres.slice(0, 3).map((genre, i) => (
                        <Badge key={i} variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors">
                          {genre.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {game.summary && (
                    <p className="text-zinc-400 text-sm line-clamp-2 mb-2">
                      {game.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    {game.rating && (
                      <Badge className="bg-yellow-600 text-white text-xs">
                        {Math.round(game.rating / 10)}/10
                      </Badge>
                    )}
                    <div className="text-xs text-zinc-500">
                      Click to view details
                    </div>
                  </div>
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

      {/* Expanded Game Card Modal */}
      {selectedGame && (
        <ExpandedGameCard
          game={selectedGame}
          isOpen={showExpandedCard}
          onClose={handleCloseExpandedCard}
          onAddToLibrary={(status, hoursPlayed) => {
            const safeStatus = status !== undefined ? status : 'backlog'
            return handleAddToLibrary(selectedGame.id, safeStatus, hoursPlayed)
          }}
          onPlay={() => {
            handleCloseExpandedCard()
          }}
        />
      )}
    </div>
    </>
  )
}
