"use client"

import * as React from "react"
import { Search, Gamepad2, User, X, LogOut, Eye, EyeOff } from "lucide-react"
import { usePathname, useRouter } from 'next/navigation'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { ExpandedGameCard } from "@/features/game/components/ExpandedGameCard"

export function HeaderSearch() {
  const [searchInput, setSearchInput] = React.useState('')
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [userEmail, setUserEmail] = React.useState<string | null>(null)
  const [showEmail, setShowEmail] = React.useState(false)
  const [genres, setGenres] = React.useState<Array<{ id: number; name: string }>>([])
  const [modalSearchInput, setModalSearchInput] = React.useState('')
  const [searchResults, setSearchResults] = React.useState<any[]>([])
  const [searching, setSearching] = React.useState(false)
  const [selectedGenres, setSelectedGenres] = React.useState<number[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<number[]>([])
  const [selectedYear, setSelectedYear] = React.useState<number | undefined>(undefined)
  const [minRating, setMinRating] = React.useState<number | undefined>(undefined)
  const [maxRating, setMaxRating] = React.useState<number | undefined>(undefined)
  const [selectedGame, setSelectedGame] = React.useState<any | null>(null)
  const [showExpandedCard, setShowExpandedCard] = React.useState(false)
  const pathname = usePathname() ?? '/'
  const router = useRouter()

  // Load IGDB genres when the modal is first opened
  React.useEffect(() => {
    const loadGenres = () => {
      if (!isSearchOpen || genres.length > 0) return
      
      // Use the official IGDB genre list with correct IDs
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
  }, [isSearchOpen, genres.length])

  // Lazy-load basic user info when profile modal opens
  React.useEffect(() => {
    const loadUser = async () => {
      if (!isProfileOpen) return
      try {
        const { data } = await supabase.auth.getUser()
        setUserEmail(data.user?.email ?? null)
      } catch (e) {
        console.warn('Failed to load user', e)
        setUserEmail(null)
      }
    }
    loadUser()
  }, [isProfileOpen])

  const maskedEmail = React.useMemo(() => {
    if (!userEmail) return null
    if (showEmail) return userEmail
    const parts = userEmail.split('@')
    if (parts.length !== 2) return '••••••••'
    const [local, domain] = parts
    const visible = local.slice(0, 1)
    const masked = '•'.repeat(Math.max(local.length - 1, 1))
    return `${visible}${masked}@${domain}`
  }, [userEmail, showEmail])

  const handleSearch = async () => {
    if (!searchInput.trim()) return

    try {
      const seedId = parseInt(searchInput)
      if (isNaN(seedId)) {
        alert('Please enter a valid game ID number')
        return
      }

      const response = await fetch(`/api/games/search?seedId=${seedId}`)
      const data = await response.json()

      if (response.ok && data.results?.length > 0) {
        router.push(`/recommendations?seedId=${searchInput}`)
      } else {
        alert(data.error || 'No game found with that ID')
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Search failed. Please try again.')
    }
  }

  const searchGames = async (query: string, genreIds: number[] = selectedGenres) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      let url = `/api/new-search-game?q=${encodeURIComponent(query.trim())}`
      
      // Add genre filters if any are selected
      if (genreIds.length > 0) {
        const genreParams = genreIds.map(id => `genre_id=${id}`).join('&')
        url += `&${genreParams}`
      }
      
      // Add platform filters if any are selected
      if (selectedPlatforms.length > 0) {
        const platformParams = selectedPlatforms.map(id => `platform_id=${id}`).join('&')
        url += `&${platformParams}`
      }
      
      // Add year filter if selected
      if (selectedYear) {
        url += `&year=${selectedYear}`
      }
      
      // Add rating filters if selected
      if (minRating !== undefined) {
        url += `&min_rating=${minRating}`
      }
      if (maxRating !== undefined) {
        url += `&max_rating=${maxRating}`
      }
      
      console.log('Search URL:', url)
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to search games')
      }
      
      const data = await response.json()
      console.log('Search API response:', data)
      console.log('Search results count:', data.results?.length || 0)
      console.log('Genre filters applied:', genreIds)
      console.log('All search result names:', data.results?.map((g: any) => g.name) || [])
      setSearchResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  // Debounced search effect
  // Search whenever modalSearchInput or any filters change
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (modalSearchInput.trim()) {
        searchGames(modalSearchInput.trim(), selectedGenres)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [modalSearchInput, selectedGenres, selectedPlatforms, selectedYear, minRating, maxRating])

  const handleModalSearch = React.useCallback((query: string) => {
    setModalSearchInput(query)
  }, [])

  const handleSearchEnter = () => {
    if (modalSearchInput.trim() || selectedGenres.length > 0 || selectedPlatforms.length > 0 || selectedYear || minRating !== undefined || maxRating !== undefined) {
      // Build URL with search parameters
      const params = new URLSearchParams()
      if (modalSearchInput.trim()) {
        params.set('q', modalSearchInput.trim())
      }
      if (selectedGenres.length > 0) {
        selectedGenres.forEach(genreId => {
          params.append('genre_id', genreId.toString())
        })
      }
      if (selectedPlatforms.length > 0) {
        selectedPlatforms.forEach(platformId => {
          params.append('platform_id', platformId.toString())
        })
      }
      if (selectedYear) {
        params.set('year', selectedYear.toString())
      }
      if (minRating !== undefined) {
        params.set('min_rating', minRating.toString())
      }
      if (maxRating !== undefined) {
        params.set('max_rating', maxRating.toString())
      }
      
      // Navigate to browse page with search parameters
      router.push(`/browse?${params.toString()}`)
      closeSearchModal()
    }
  }

  const selectGame = (game: any) => {
    console.log('Selected game:', game.name, 'ID:', game.id)
    setSelectedGame(game)
    setShowExpandedCard(true)
    // Don't close search modal - keep it open so user can continue browsing
    // setIsSearchOpen(false)
    // setModalSearchInput('')
    // setSearchResults([])
  }

  const handleCloseExpandedCard = () => {
    setShowExpandedCard(false)
    setSelectedGame(null)
  }

  const handleAddToLibrary = async (gameId: number, status: string = 'backlog', hoursPlayed: number = 0) => {
    try {
      const response = await fetch('/api/db/user-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          status,
          hoursPlayed
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add game to library')
      }

      console.log('Game added to library successfully')
      return true
    } catch (error) {
      console.error('Error adding game to library:', error)
      throw error
    }
  }

  const closeSearchModal = () => {
    setIsSearchOpen(false)
    setModalSearchInput('')
    setSearchResults([])
    setSelectedGenres([])
    setSelectedPlatforms([])
    setSelectedYear(undefined)
    setMinRating(undefined)
    setMaxRating(undefined)
  }

  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev => {
      const isSelected = prev.includes(genreId)
      const newSelection = isSelected 
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
      
      const genreName = genres.find(g => g.id === genreId)?.name || 'Unknown'
      console.log('Genre toggled:', `${genreName} (ID: ${genreId})`, 'Selected genres:', newSelection)
      return newSelection
    })
  }

  const togglePlatform = (platformId: number) => {
    setSelectedPlatforms(prev => {
      const isSelected = prev.includes(platformId)
      const newSelection = isSelected 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
      
      console.log('Platform toggled:', `Platform ID: ${platformId}`, 'Selected platforms:', newSelection)
      return newSelection
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Show the pill navigation on all pages except the landing page '/'
  if (`${pathname}` !== '/') {
    const NavItem = ({
      href,
      children,
    }: {
      href: string
      children: React.ReactNode
    }) => {
  const currentPath = `${pathname}`
  const isActive = href === '/' ? currentPath === '/' : currentPath.startsWith(href)
      return (
        <button
          onClick={() => router.push(href)}
          className={`px-3 py-1 rounded-full text-sm transition-colors duration-150 ${isActive ? 'bg-[#5d4af8] text-white font-semibold' : 'text-[#a0a0b0] hover:bg-[#5d4af8]/10'} focus:outline-none focus:ring-0`}
          aria-current={isActive ? 'page' : undefined}
        >
          {children}
        </button>
      )
    }

    return (
      <div className="flex w-full items-center">
        <div className="mx-auto">
          <nav className="inline-flex items-center gap-2 text-sm rounded-full px-2 py-1 bg-[#5d4af8]/15 backdrop-blur-md shadow-sm">
            {/* Brand inside the pill */}
            <button
              onClick={() => router.push('/')}
              className="mr-1 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm text-[#e6e6ff] hover:bg-[#5d4af8]/10 focus:outline-none focus:ring-0"
              aria-label="PlayMatch Home"
            >
              <Gamepad2 className="h-4 w-4 text-[#cfd6ff]" />
              <span className="font-semibold tracking-tight">PlayMatch</span>
            </button>
            <NavItem href="/home">Home</NavItem>
            <NavItem href="/recommendations">Recommendations</NavItem>
            <NavItem href="/library">Library</NavItem>

            {/* inline search input inside the pill */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="ml-1 p-1 rounded-full bg-transparent hover:bg-[#5d4af8]/10 focus:outline-none focus:ring-0"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-[#cfd6ff]" />
            </button>


            {/* Profile icon inside the pill */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="ml-1 p-1 rounded-full bg-transparent hover:bg-[#5d4af8]/10 focus:outline-none focus:ring-0"
              aria-label="Profile"
            >
              <User className="h-5 w-5 text-[#cfd6ff]" />
            </button>
          </nav>
          {/* Search Modal Overlay (UI only, no functional search) */}
          {isSearchOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={closeSearchModal}
                aria-hidden="true"
              />
              {/* Modal Panel */}
              <div className="relative w-full max-w-5xl rounded-2xl border border-[#5d4af8]/30 bg-zinc-900/50 shadow-[0_0_20px_rgba(93,74,248,0.3)]">
                {/* Close button */}
                <button
                  onClick={closeSearchModal}
                  className="absolute right-3 top-3 rounded-full p-2 text-zinc-300 hover:bg-white/10 focus:outline-none"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="p-4 sm:p-6">
                  {/* Top search input */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 border-b border-white/20 pb-3">
                      <Search className="h-5 w-5 text-zinc-300" />
                      <input
                        type="text"
                        placeholder="Search games… (Press Enter to see all results)"
                        value={modalSearchInput}
                        onChange={(e) => handleModalSearch(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSearchEnter()
                          }
                        }}
                        className="w-full bg-transparent text-zinc-200 placeholder:text-zinc-400 outline-none"
                      />
                    </div>
                  </div>

                  {/* Search Results */}
                  {modalSearchInput && (
                    <div className="mb-6">
                      {searching ? (
                        <div className="text-center py-4">
                          <div className="text-zinc-400">Searching...</div>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          <div className="text-zinc-400 text-xs mb-2 px-2">
                            Found {searchResults.length} results (showing {Math.min(searchResults.length, 20)})
                            {selectedGenres.length > 0 && (
                              <span className="ml-2 text-purple-400">
                                (filtered by {selectedGenres.length} genre{selectedGenres.length > 1 ? 's' : ''})
                              </span>
                            )}
                          </div>
                          {searchResults.slice(0, 20).map((game, index) => {
                            if (index === 0) console.log('About to render', searchResults.length, 'search results')
                            console.log(`Rendering game ${index + 1}:`, game.name, game.cover_url)
                            return (
                              <button
                                key={game.id}
                                onClick={() => selectGame(game)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                              >
                                <div className="w-10 h-12 flex-shrink-0 flex items-center justify-center">
                                  {game.cover_url ? (
                                    <img
                                      src={game.cover_url.startsWith('//') ? `https:${game.cover_url}` : game.cover_url}
                                      alt={game.name}
                                      className="w-10 h-12 object-cover rounded"
                                      onError={(e) => console.log('Image failed to load:', game.cover_url)}
                                    />
                                  ) : (
                                    <div className="w-10 h-12 bg-zinc-700 rounded flex items-center justify-center text-zinc-400 text-xs">
                                      No
                                      <br />
                                      Cover
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-zinc-200 font-medium truncate">
                                    {game.name}
                                  </div>
                                  {game.genres?.length > 0 && (
                                    <div className="text-zinc-400 text-sm truncate">
                                      {game.genres.map((g: any) => g.name).join(', ')}
                                    </div>
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      ) : modalSearchInput.trim() ? (
                        <div className="text-center py-4">
                          <div className="text-zinc-400">No games found</div>
                          {selectedGenres.length === 0 && (
                            <div className="text-zinc-500 text-xs mt-1">
                              Try selecting some genres to refine your search
                            </div>
                          )}
                        </div>
                      ) : selectedGenres.length > 0 ? (
                        <div className="text-center py-4">
                          <div className="text-zinc-400">Enter a search term to find games</div>
                          <div className="text-zinc-500 text-xs mt-1">
                            Genre filters will be applied to your search
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Search All Button */}
                  {(modalSearchInput.trim() || selectedGenres.length > 0) && (
                    <div className="mb-4">
                      <button
                        onClick={handleSearchEnter}
                        className="w-full bg-[#5d4af8] hover:bg-[#5d4af8]/90 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        View All Results in Browse Page
                      </button>
                    </div>
                  )}

                  {/* Active Filters row */}
                  <div className="mb-3 text-sm text-zinc-300">
                    Active Filters:
                    {selectedGenres.length === 0 && selectedPlatforms.length === 0 && !selectedYear && minRating === undefined && maxRating === undefined && modalSearchInput.trim() === '' && (
                      <span className="text-zinc-400 ml-1">None</span>
                    )}
                  </div>
                  <div className="mb-5 flex flex-wrap items-center gap-3">
                    {modalSearchInput.trim() && (
                      <span className="rounded-md bg-blue-600/90 px-3 py-1.5 text-sm text-white">
                        Query: "{modalSearchInput.trim()}"
                      </span>
                    )}
                    {selectedGenres.length > 0 && (
                      <span className="rounded-md bg-purple-600/90 px-3 py-1.5 text-sm text-white">
                        {selectedGenres.length} Genre{selectedGenres.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {selectedPlatforms.length > 0 && (
                      <span className="rounded-md bg-emerald-600/90 px-3 py-1.5 text-sm text-white">
                        {selectedPlatforms.length} Platform{selectedPlatforms.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {selectedYear && (
                      <span className="rounded-md bg-amber-600/90 px-3 py-1.5 text-sm text-white">
                        Year: {selectedYear}
                      </span>
                    )}
                    {(minRating !== undefined || maxRating !== undefined) && (
                      <span className="rounded-md bg-rose-600/90 px-3 py-1.5 text-sm text-white">
                        Rating: {minRating ? (minRating / 10).toFixed(1) : '0'}-{maxRating ? (maxRating / 10).toFixed(1) : '10'}
                      </span>
                    )}
                    {(selectedGenres.length > 0 || selectedPlatforms.length > 0 || selectedYear || minRating !== undefined || maxRating !== undefined || modalSearchInput.trim()) && (
                      <button 
                        onClick={() => {
                          setSelectedGenres([])
                          setSelectedPlatforms([])
                          setSelectedYear(undefined)
                          setMinRating(undefined)
                          setMaxRating(undefined)
                          setModalSearchInput('')
                          setSearchResults([])
                        }}
                        className="rounded-md bg-red-600/90 px-3 py-1.5 text-sm text-white hover:bg-red-600"
                      >
                        × Clear All
                      </button>
                    )}
                  </div>

                  {/* Genres grid (chips) */}
                  <div className="mb-3 text-sm text-zinc-300">
                    Filter by Genre {selectedGenres.length > 0 && (
                      <span className="text-xs text-zinc-400">({selectedGenres.length} selected)</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {genres.length === 0 && (
                      <span className="select-none rounded-full bg-white/10 px-3 py-1 text-sm text-zinc-400">Loading genres…</span>
                    )}
                    {genres.map((g) => {
                      const isSelected = selectedGenres.includes(g.id)
                      return (
                        <button
                          key={g.id}
                          onClick={() => toggleGenre(g.id)}
                          className={`rounded-full px-3 py-1 text-sm transition-colors ${
                            isSelected 
                              ? 'bg-[#5d4af8] text-white font-medium' 
                              : 'bg-white/10 text-zinc-200 hover:bg-white/15'
                          }`}
                        >
                          {g.name}
                        </button>
                      )
                    })}
                  </div>
                  
                  {/* Clear genres button */}
                  {selectedGenres.length > 0 && (
                    <div className="mt-2 mb-4">
                      <button
                        onClick={() => setSelectedGenres([])}
                        className="text-xs text-zinc-400 hover:text-zinc-300 underline"
                      >
                        Clear all genres
                      </button>
                    </div>
                  )}

                  {/* Platform Filters */}
                  <div className="mb-3 mt-6 text-sm text-zinc-300">
                    Filter by Platform {selectedPlatforms.length > 0 && (
                      <span className="text-xs text-zinc-400">({selectedPlatforms.length} selected)</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 6, name: 'PC' },
                      { id: 48, name: 'PS4' },
                      { id: 167, name: 'PS5' },
                      { id: 49, name: 'Xbox One' },
                      { id: 169, name: 'Xbox Series' },
                      { id: 130, name: 'Switch' },
                      { id: 34, name: 'Android' },
                      { id: 39, name: 'iOS' },
                      { id: 14, name: 'Mac' },
                      { id: 3, name: 'Linux' }
                    ].map((platform) => {
                      const isSelected = selectedPlatforms.includes(platform.id)
                      return (
                        <button
                          key={platform.id}
                          onClick={() => togglePlatform(platform.id)}
                          className={`rounded-full px-3 py-1 text-sm transition-colors ${
                            isSelected 
                              ? 'bg-emerald-600 text-white font-medium' 
                              : 'bg-white/10 text-zinc-200 hover:bg-white/15'
                          }`}
                        >
                          {platform.name}
                        </button>
                      )
                    })}
                  </div>
                  {selectedPlatforms.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={() => setSelectedPlatforms([])}
                        className="text-xs text-zinc-400 hover:text-zinc-300 underline"
                      >
                        Clear all platforms
                      </button>
                    </div>
                  )}

                  {/* Year Filter */}
                  <div className="mb-3 mt-6 text-sm text-zinc-300">
                    Filter by Release Year
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map((year) => {
                      const isSelected = selectedYear === year
                      return (
                        <button
                          key={year}
                          onClick={() => setSelectedYear(isSelected ? undefined : year)}
                          className={`rounded-full px-3 py-1 text-sm transition-colors ${
                            isSelected 
                              ? 'bg-amber-600 text-white font-medium' 
                              : 'bg-white/10 text-zinc-200 hover:bg-white/15'
                          }`}
                        >
                          {year}
                        </button>
                      )
                    })}
                  </div>
                  {selectedYear && (
                    <div className="mt-2">
                      <button
                        onClick={() => setSelectedYear(undefined)}
                        className="text-xs text-zinc-400 hover:text-zinc-300 underline"
                      >
                        Clear year filter
                      </button>
                    </div>
                  )}

                  {/* Rating Filter */}
                  <div className="mb-3 mt-6 text-sm text-zinc-300">
                    Filter by Rating
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Min Rating</label>
                      <select
                        value={minRating || ''}
                        onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
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
                        value={maxRating || ''}
                        onChange={(e) => setMaxRating(e.target.value ? Number(e.target.value) : undefined)}
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
                  {(minRating !== undefined || maxRating !== undefined) && (
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          setMinRating(undefined)
                          setMaxRating(undefined)
                        }}
                        className="text-xs text-zinc-400 hover:text-zinc-300 underline"
                      >
                        Clear rating filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Profile Modal Overlay */}
          {isProfileOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setIsProfileOpen(false)}
                aria-hidden="true"
              />
              {/* Modal Panel */}
              <div className="relative w-full max-w-md rounded-2xl border border-[#5d4af8]/30 bg-zinc-900/50 shadow-[0_0_20px_rgba(93,74,248,0.3)]">
                {/* Close button */}
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="absolute right-3 top-3 rounded-full p-2 text-zinc-300 hover:bg-white/10 focus:outline-none"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="p-5">
                  <div className="mb-4">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                        <User className="h-5 w-5 text-[#cfd6ff]" />
                      </div>
                      <div>
                        <div className="text-sm text-zinc-400">Signed in</div>
                        <div className="flex items-center gap-2">
                          <div className="text-zinc-100 font-medium">{maskedEmail ?? 'Account'}</div>
                          {userEmail && (
                            <button
                              type="button"
                              onClick={() => setShowEmail((v) => !v)}
                              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-0"
                              aria-pressed={showEmail}
                              aria-label={showEmail ? 'Hide email' : 'Show email'}
                            >
                              {showEmail ? (
                                <>
                                  <EyeOff className="h-3 w-3" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3" />
                                  Show
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 grid gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await supabase.auth.signOut()
                        } finally {
                          setIsProfileOpen(false)
                          router.push('/')
                        }
                      }}
                      className="inline-flex w-full items-center justify-between rounded-md bg-red-600/90 px-3 py-2 text-left text-white hover:bg-red-600"
                    >
                      <span>Sign out</span>
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
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
    )
  }

  return (
    <>
      <div className="flex w-full items-center gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Gamepad2 className="h-6 w-6 text-[#5d4af8]" />
      </div>

      {/* Search trigger placed directly alongside the title */}
      <div className="relative">
        <Collapsible asChild>
          <div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon">
                <Search />
                <span className="sr-only">Open search</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {/* Inline search bar that opens to the right of the trigger and is vertically centered */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-[min(520px,60vw)] rounded-md bg-background p-2 shadow-lg border">
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="Enter game ID (e.g. 1942)" 
                    className="h-9"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    type="number"
                  />
                  <Button variant="default" onClick={handleSearch}>
                    Search
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      <div className="ml-auto" />
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
  </>
  )
}
