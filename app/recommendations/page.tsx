'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { GameGrid } from '@/features/game'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Sparkles, Search, ChevronDown, X } from 'lucide-react'
import { translateGenreNamesToIds } from '@/lib/genre-map'

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
  // Scoring fields from rec engine
  finalScore?: number
  genreScore?: number
  companyScore?: number
  keywordScore?: number
  themeScore?: number
  ratingScoreValue?: number
  platformScore?: number
}

interface RecommendationResponse {
  seed: Game
  dbScored: Game[]
  igdbPool: Game[]
}

export default function RecommendationsPage() {
  const searchParams = useSearchParams()
  const seedId = searchParams.get('seedId')
  
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState<string>('')
  const [selectedGames, setSelectedGames] = useState<Game[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  
  // Dropdown visibility states
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [showKeywordDropdown, setShowKeywordDropdown] = useState(false)
  const [showThemeDropdown, setShowThemeDropdown] = useState(false)
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false)
  
  // Autocomplete states
  const [searchSuggestions, setSearchSuggestions] = useState<Game[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)

  const genres = [
    'Point-and-click', 'Fighting', 'Shooter', 'Music', 'Platform', 'Puzzle', 'Racing', 
    'Real Time Strategy (RTS)', 'Role-playing (RPG)', 'Simulator', 'Sport', 'Strategy', 
    'Turn-based Strategy (TBS)', 'Tactical', 'Hack & slash/Beat \'em up', 'Quiz/Trivia', 
    'Pinball', 'Adventure', 'Indie', 'Arcade', 'Visual Novel', 'Card & Board Game', 'MOBA'
  ]

  const companies = [
    'Nintendo', 'Sony Interactive Entertainment', 'Microsoft Game Studios', 'Electronic Arts', 'Activision Blizzard',
    'Ubisoft', 'Take-Two Interactive', 'Square Enix', 'Capcom', 'Bandai Namco Entertainment',
    'Sega', 'Konami', 'Bethesda Softworks', 'CD Projekt', 'Valve Corporation',
    'Epic Games', 'Rockstar Games', 'Blizzard Entertainment', 'FromSoftware', 'Naughty Dog'
  ]

  const keywords = [
    'Open World', 'Multiplayer', 'Single Player', 'Co-op', 'Online', 'Offline',
    'Story Rich', 'Atmospheric', 'Pixel Graphics', '2D', '3D', 'Retro',
    'Survival', 'Crafting', 'Building', 'Exploration', 'Combat', 'Magic',
    'Sci-fi', 'Fantasy', 'Horror', 'Comedy', 'Drama', 'Historical'
  ]

  const themes = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Educational', 'Erotic', 'Fantasy',
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
  const maxCompanies = 4
  const maxKeywords = 6
  const maxThemes = 4
  const maxPlatforms = 4

  // autocomplete search
  const searchForSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      setIsSearching(true)
      const response = await fetch(`/api/new-search-game?q=${encodeURIComponent(query.trim())}`)
      if (!response.ok) {
        throw new Error('Failed to search for games')
      }
      
      const data = await response.json()
      if (data.results && data.results.length > 0) {
        // Limit to top 8 suggestions and format them
        const suggestions = data.results.slice(0, 8).map((game: any) => {
          let coverUrl = game.cover_url;
          if (coverUrl && coverUrl.startsWith('//')) {
            coverUrl = `https:${coverUrl}`;
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

  // autocomplete search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchForSuggestions(searchInput)
      setSelectedSuggestionIndex(-1) // Reset selection when searching
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchInput])

  const searchForGame = async (gameName: string) => {
    if (!gameName.trim()) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/new-search-game?q=${encodeURIComponent(gameName.trim())}`)
      if (!response.ok) {
        throw new Error('Failed to search for games')
      }
      
      const data = await response.json()
      console.log('Search API response:', data)
      console.log('Total results found:', data.total || 0)
      
      if (data.results && data.results.length > 0) {
        console.log('All search results:', data.results.map((g: any) => g.name))
        const game = data.results[0] // Take the first result
        console.log('Selected game (first result):', game.name)
        console.log('Search game fields:', Object.keys(game))
        console.log('Search game cover data:', game.cover, game.cover_url, game.coverUrl)
        
        // Handle cover URL - the API now returns cover_url directly
        let coverUrl = game.cover_url;
        if (coverUrl && coverUrl.startsWith('//')) {
          coverUrl = `https:${coverUrl}`;
        }
        
        const formattedGame: Game = {
          id: game.id,
          name: game.name,
          cover: coverUrl ? { url: coverUrl } : undefined,
          summary: game.summary,
          rating: game.rating,
          genres: game.genres || []
        }
        
        if (selectedGames.length < maxGames) {
          setSelectedGames(prev => [...prev, formattedGame])
          setSearchInput('')
        }
      } else {
        setError('No games found with that name')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search for game')
    } finally {
      setLoading(false)
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

  const handleCompanyToggle = (company: string) => {
    setSelectedCompanies(prev => {
      if (prev.includes(company)) {
        return prev.filter(c => c !== company)
      } else if (prev.length < maxCompanies) {
        return [...prev, company]
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

  const handleSearch = () => {
    if (searchInput.trim() && selectedGames.length < maxGames) {
      searchForGame(searchInput.trim())
    }
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
        } else {
          handleSearch()
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
      }
    } else if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getRecommendations = async () => {
    if (selectedGames.length === 0 && selectedGenres.length === 0) {
      setError('Please select at least one game or genre to get recommendations')
      return
    }

    if (selectedGames.length === 0) {
      setError('Please select at least one game to get recommendations.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      let url = '/api/rec-engine?'
      const params = new URLSearchParams()
      
      // Use the first selected game as seed (current API structure)
      if (selectedGames.length > 0) {
        const seedGameId = selectedGames[0].id
        params.append('seedGameId', seedGameId.toString())
        console.log('Getting recommendations for seed game:', selectedGames[0].name, 'ID:', seedGameId)
      }
      
      // Add selected criteria as preferences (future API enhancement)
      if (selectedGenres.length > 0) {
        params.append('preferredGenres', selectedGenres.join(','))
        console.log('Preferred genres:', selectedGenres)
      }
      if (selectedCompanies.length > 0) {
        params.append('preferredCompanies', selectedCompanies.join(','))
        console.log('Preferred companies:', selectedCompanies)
      }
      if (selectedKeywords.length > 0) {
        params.append('preferredKeywords', selectedKeywords.join(','))
        console.log('Preferred keywords:', selectedKeywords)
      }
      if (selectedThemes.length > 0) {
        params.append('preferredThemes', selectedThemes.join(','))
        console.log('Preferred themes:', selectedThemes)
      }
      if (selectedPlatforms.length > 0) {
        params.append('preferredPlatforms', selectedPlatforms.join(','))
        console.log('Preferred platforms:', selectedPlatforms)
      }
      
      // Note: The current rec engine analyzes all criteria of the seed game,
      // but these preferences could be used for weighting or filtering later
      
      url += params.toString()
      console.log('Recommendation API URL:', url)
      
      const response = await fetch(url, {
        method: 'POST'
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.error || 'Failed to get recommendations')
      }
      
      const data: RecommendationResponse = await response.json()
      console.log('Recommendations received:', {
        seedGame: data.seed?.name,
        dbScoredCount: data.dbScored?.length || 0,
        igdbPoolCount: data.igdbPool?.length || 0
      })
      
      // Log scoring details for top matches
      if (data.dbScored && data.dbScored.length > 0) {
        console.log('Top 3 scoring details:')
        data.dbScored.slice(0, 3).forEach((game: any, idx: number) => {
          console.log(`${idx + 1}. ${game.name} (Score: ${game.finalScore?.toFixed(3) || 'N/A'})`)
          if (game.genreScore !== undefined) {
            console.log(`   - Genre: ${(game.genreScore * 100).toFixed(1)}%`)
            console.log(`   - Company: ${(game.companyScore * 100).toFixed(1)}%`)
            console.log(`   - Keywords: ${(game.keywordScore * 100).toFixed(1)}%`)
            console.log(`   - Themes: ${(game.themeScore * 100).toFixed(1)}%`)
            console.log(`   - Rating: ${(game.ratingScoreValue * 100).toFixed(1)}%`)
            console.log(`   - Platform: ${(game.platformScore * 100).toFixed(1)}%`)
          }
        })
      }
      
      // Fix cover URLs for database games if needed
      const processedData = {
        ...data,
        dbScored: data.dbScored?.map(game => {
          const gameAny = game as any
          return {
            ...game,
            cover: game.cover?.url ? game.cover : 
                   gameAny.cover_url ? { url: gameAny.cover_url } :
                   gameAny.coverUrl ? { url: gameAny.coverUrl } :
                   undefined
          }
        }) || [],
        igdbPool: data.igdbPool?.map(game => {
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
    } catch (err) {
      console.error('Recommendation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to get recommendations')
      setRecommendations(null)
    } finally {
      setLoading(false)
    }
  }

  // Auto-load game if seedId is provided in URL
  useEffect(() => {
    if (seedId) {
      const gameId = parseInt(seedId)
      if (!isNaN(gameId)) {
        setSearchInput(`Game ${gameId}`)
        // Will implement actual game lookup later
      }
    }
  }, [seedId])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.dropdown-container')) {
        setShowCompanyDropdown(false)
        setShowKeywordDropdown(false)
        setShowThemeDropdown(false)
        setShowPlatformDropdown(false)
      }
      // Close search suggestions when clicking outside search area
      if (!target.closest('.search-container')) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const allGames = recommendations ? [...recommendations.dbScored, ...recommendations.igdbPool] : []

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Gradient Glowing Question Mark Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <style jsx>{`
          @keyframes float1 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(30px, -20px) rotate(2deg); }
            50% { transform: translate(-20px, -40px) rotate(-1deg); }
            75% { transform: translate(40px, -10px) rotate(1deg); }
          }
          @keyframes float2 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            20% { transform: translate(-40px, 30px) rotate(-2deg); }
            40% { transform: translate(20px, 50px) rotate(1deg); }
            60% { transform: translate(-30px, 20px) rotate(-1deg); }
            80% { transform: translate(10px, -20px) rotate(2deg); }
          }
          @keyframes float3 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(50px, 20px) rotate(3deg); }
            66% { transform: translate(-25px, 40px) rotate(-2deg); }
          }
          @keyframes float4 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            30% { transform: translate(-35px, -30px) rotate(-3deg); }
            70% { transform: translate(45px, 25px) rotate(2deg); }
          }
          @keyframes float5 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            40% { transform: translate(25px, -35px) rotate(1deg); }
            80% { transform: translate(-40px, 15px) rotate(-2deg); }
          }
          @keyframes float6 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(-20px, -25px) rotate(-1deg); }
          }
          @keyframes floatCenter {
            0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
            25% { transform: translate(-50%, -50%) scale(1.05) rotate(1deg); }
            50% { transform: translate(-50%, -50%) scale(0.95) rotate(-1deg); }
            75% { transform: translate(-50%, -50%) scale(1.02) rotate(0.5deg); }
          }
          .float1 { animation: float1 12s ease-in-out infinite, pulse 3s ease-in-out infinite; }
          .float2 { animation: float2 15s ease-in-out infinite, pulse 4s ease-in-out infinite 1s; }
          .float3 { animation: float3 10s ease-in-out infinite, pulse 3.5s ease-in-out infinite 2s; }
          .float4 { animation: float4 14s ease-in-out infinite, pulse 4.5s ease-in-out infinite 0.5s; }
          .float5 { animation: float5 11s ease-in-out infinite, pulse 3s ease-in-out infinite 3s; }
          .float6 { animation: float6 13s ease-in-out infinite, pulse 4s ease-in-out infinite 1.5s; }
          .float7 { animation: float1 16s ease-in-out infinite, pulse 5s ease-in-out infinite 2.5s; }
          .float8 { animation: float2 18s ease-in-out infinite, pulse 3.5s ease-in-out infinite 4s; }
          .floatCenter { animation: floatCenter 20s ease-in-out infinite, pulse 6s ease-in-out infinite 5s; }
        `}</style>
        
        {/* Question Mark 1 - Top Left */}
        <div className="absolute -top-20 -left-20 text-[300px] font-bold text-transparent bg-gradient-to-br from-[#5d4af8]/40 via-purple-500/25 to-transparent bg-clip-text drop-shadow-[0_0_50px_rgba(93,74,248,0.6)] float1">
          ?
        </div>
        
        {/* Question Mark 2 - Top Right */}
        <div className="absolute -top-10 -right-32 text-[220px] font-bold text-transparent bg-gradient-to-bl from-emerald-500/35 via-[#5d4af8]/20 to-transparent bg-clip-text drop-shadow-[0_0_40px_rgba(16,185,129,0.5)] float2">
          ?
        </div>
        
        {/* Question Mark 3 - Middle Left */}
        <div className="absolute top-1/3 -left-16 text-[180px] font-bold text-transparent bg-gradient-to-r from-pink-500/35 via-[#5d4af8]/20 to-transparent bg-clip-text drop-shadow-[0_0_35px_rgba(236,72,153,0.5)] float3">
          ?
        </div>
        
        {/* Question Mark 4 - Middle Right */}
        <div className="absolute top-1/2 -right-20 text-[260px] font-bold text-transparent bg-gradient-to-l from-cyan-500/35 via-[#5d4af8]/20 to-transparent bg-clip-text drop-shadow-[0_0_45px_rgba(6,182,212,0.5)] float4">
          ?
        </div>
        
        {/* Question Mark 5 - Bottom Left */}
        <div className="absolute -bottom-16 -left-24 text-[240px] font-bold text-transparent bg-gradient-to-tr from-yellow-500/35 via-[#5d4af8]/20 to-transparent bg-clip-text drop-shadow-[0_0_40px_rgba(234,179,8,0.5)] float5">
          ?
        </div>
        
        {/* Question Mark 6 - Bottom Right */}
        <div className="absolute -bottom-20 -right-16 text-[200px] font-bold text-transparent bg-gradient-to-tl from-red-500/35 via-[#5d4af8]/20 to-transparent bg-clip-text drop-shadow-[0_0_38px_rgba(239,68,68,0.5)] float6">
          ?
        </div>
        
        {/* Additional Smaller Question Marks for depth */}
        <div className="absolute top-1/4 left-1/4 text-[120px] font-bold text-transparent bg-gradient-to-br from-[#5d4af8]/25 to-transparent bg-clip-text drop-shadow-[0_0_25px_rgba(93,74,248,0.4)] float7">
          ?
        </div>
        
        <div className="absolute top-3/4 right-1/3 text-[150px] font-bold text-transparent bg-gradient-to-bl from-[#5d4af8]/25 to-transparent bg-clip-text drop-shadow-[0_0_30px_rgba(93,74,248,0.4)] float8">
          ?
        </div>
        
        {/* Additional prominent center question marks */}
        <div className="absolute top-1/2 left-1/2 text-[400px] font-bold text-transparent bg-gradient-to-br from-[#5d4af8]/15 via-purple-400/10 to-transparent bg-clip-text drop-shadow-[0_0_60px_rgba(93,74,248,0.3)] floatCenter">
          ?
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="h-8 w-8 text-[#5d4af8]" />
            <h1 className="text-2xl font-semibold text-white">Game Recommender</h1>
          </div>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Analyzes genre, company, keywords, themes, ratings, and platforms. 
          </p>
        </div>

        {/* Search and Genre Selection Container */}
        <div className="bg-zinc-900/50 rounded-2xl border border-[#5d4af8]/30 p-8 mb-12 shadow-[0_0_20px_rgba(93,74,248,0.3)] hover:shadow-[0_0_30px_rgba(93,74,248,0.4)] transition-shadow duration-300">
          {/* Search Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium text-white">Add Games ({selectedGames.length}/{maxGames})</h2>
              {(selectedGames.length > 0 || selectedGenres.length > 0 || selectedCompanies.length > 0 || 
                selectedKeywords.length > 0 || selectedThemes.length > 0 || selectedPlatforms.length > 0) && (
                <Button
                  onClick={() => {
                    setSelectedGames([])
                    setSelectedGenres([])
                    setSelectedCompanies([])
                    setSelectedKeywords([])
                    setSelectedThemes([])
                    setSelectedPlatforms([])
                    // Close all dropdowns
                    setShowCompanyDropdown(false)
                    setShowKeywordDropdown(false)
                    setShowThemeDropdown(false)
                    setShowPlatformDropdown(false)
                  }}
                  variant="outline"
                  size="sm"
                  className="text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                >
                  Clear All Selections
                </Button>
              )}
            </div>
            
            <div className="relative max-w-2xl mx-auto search-container">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 h-5 w-5 z-10" />
              <Input
                type="text"
                placeholder={selectedGames.length >= maxGames ? "Maximum games reached" : "Search for a game..."}
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  if (!e.target.value.trim()) {
                    setShowSuggestions(false)
                  }
                }}
                onKeyDown={handleKeyPress}
                onFocus={() => {
                  if (searchSuggestions.length > 0 && searchInput.trim()) {
                    setShowSuggestions(true)
                  }
                }}
                disabled={selectedGames.length >= maxGames}
                className="pl-12 pr-4 py-4 text-lg bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400 rounded-xl focus:ring-2 focus:ring-[#5d4af8] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
              />
              
              {/* Loading indicator */}
              {isSearching && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#5d4af8]"></div>
                </div>
              )}
              
              {/* Autocomplete suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg z-20 max-h-96 overflow-y-auto">
                  <div className="p-2">
                    {searchSuggestions.map((game, index) => (
                      <button
                        key={game.id}
                        onClick={() => selectGameFromSuggestion(game)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                          index === selectedSuggestionIndex 
                            ? 'bg-[#5d4af8] bg-opacity-20 border border-[#5d4af8] border-opacity-50' 
                            : 'hover:bg-zinc-700'
                        }`}
                      >
                        {/* Game Cover */}
                        <div className="flex-shrink-0 w-12 h-16 bg-zinc-700 rounded overflow-hidden">
                          {game.cover?.url ? (
                            <img
                              src={game.cover.url}
                              alt={game.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        
                        {/* Game Info */}
                        <div className="flex-grow min-w-0">
                          <div className="font-medium text-white truncate">{game.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {game.rating && (
                              <span className="text-[#5d4af8] text-sm font-medium">
                                {Math.round(game.rating)}/100
                              </span>
                            )}
                            {game.genres && game.genres.length > 0 && (
                              <span className="text-zinc-400 text-sm truncate">
                                {game.genres.slice(0, 2).map((g: any) => g.name).join(', ')}
                                {game.genres.length > 2 && ` +${game.genres.length - 2}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* No results message */}
              {showSuggestions && searchSuggestions.length === 0 && searchInput.trim().length >= 2 && !isSearching && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg z-20">
                  <div className="p-4 text-center text-zinc-400">
                    No games found for "{searchInput}"
                  </div>
                </div>
              )}
            </div>

            {/* Selected Games Display */}
            {selectedGames.length > 0 && (
              <div className="mt-6">
                <div className="flex flex-wrap gap-3 justify-center">
                  {selectedGames.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-2 border border-zinc-700"
                    >
                      {game.cover?.url && (
                        <img
                          src={game.cover.url}
                          alt={game.name}
                          className="w-6 h-6 rounded object-cover"
                        />
                      )}
                      <span className="text-white text-sm font-medium">{game.name}</span>
                      <Button
                        onClick={() => removeGame(game.id)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-full"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selection Tabs */}
          <div className="space-y-8">
            {/* Genre Selection */}
            <div>
              <h2 className="text-xl font-medium text-white mb-6 text-center">
                Select Genres ({selectedGenres.length}/{maxGenres})
              </h2>
              <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
                {genres.map((genre) => {
                  const isSelected = selectedGenres.includes(genre)
                  const isDisabled = !isSelected && selectedGenres.length >= maxGenres
                  
                  return (
                    <Button
                      key={genre}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => handleGenreToggle(genre)}
                      disabled={isDisabled}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                        isSelected
                          ? "bg-[#5d4af8] text-white hover:bg-[#5d4af8]/80"
                          : isDisabled
                          ? "bg-zinc-800 text-zinc-500 border-zinc-700 opacity-50 cursor-not-allowed"
                          : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                      }`}
                    >
                      {genre}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Company Selection - Dropdown */}
            <div className="relative dropdown-container">
              <h2 className="text-xl font-medium text-white mb-4 text-center">
                Select Companies ({selectedCompanies.length}/{maxCompanies})
              </h2>
              
              {/* Selected Companies Display */}
              {selectedCompanies.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {selectedCompanies.map((company) => (
                    <div
                      key={company}
                      className="flex items-center gap-2 bg-emerald-600 text-white rounded-full px-3 py-1 text-sm"
                    >
                      <span>{company}</span>
                      <button
                        onClick={() => handleCompanyToggle(company)}
                        className="hover:bg-emerald-700 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Dropdown Button */}
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                  variant="outline"
                  disabled={selectedCompanies.length >= maxCompanies}
                  className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 px-6 py-2"
                >
                  Add Company
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showCompanyDropdown ? 'rotate-180' : ''}`} />
                </Button>
              </div>
              
              {/* Dropdown Menu */}
              {showCompanyDropdown && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {companies
                      .filter(company => !selectedCompanies.includes(company))
                      .map((company) => (
                        <button
                          key={company}
                          onClick={() => {
                            handleCompanyToggle(company)
                            if (selectedCompanies.length + 1 >= maxCompanies) {
                              setShowCompanyDropdown(false)
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-700 rounded transition-colors"
                        >
                          {company}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Keywords Selection - Dropdown */}
            <div className="relative dropdown-container">
              <h2 className="text-xl font-medium text-white mb-4 text-center">
                Select Keywords ({selectedKeywords.length}/{maxKeywords})
              </h2>
              
              {/* Selected Keywords Display */}
              {selectedKeywords.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {selectedKeywords.map((keyword) => (
                    <div
                      key={keyword}
                      className="flex items-center gap-2 bg-amber-600 text-white rounded-full px-3 py-1 text-sm"
                    >
                      <span>{keyword}</span>
                      <button
                        onClick={() => handleKeywordToggle(keyword)}
                        className="hover:bg-amber-700 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Dropdown Button */}
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowKeywordDropdown(!showKeywordDropdown)}
                  variant="outline"
                  disabled={selectedKeywords.length >= maxKeywords}
                  className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 px-6 py-2"
                >
                  Add Keyword
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showKeywordDropdown ? 'rotate-180' : ''}`} />
                </Button>
              </div>
              
              {/* Dropdown Menu */}
              {showKeywordDropdown && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {keywords
                      .filter(keyword => !selectedKeywords.includes(keyword))
                      .map((keyword) => (
                        <button
                          key={keyword}
                          onClick={() => {
                            handleKeywordToggle(keyword)
                            if (selectedKeywords.length + 1 >= maxKeywords) {
                              setShowKeywordDropdown(false)
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-700 rounded transition-colors"
                        >
                          {keyword}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Themes Selection - Dropdown */}
            <div className="relative dropdown-container">
              <h2 className="text-xl font-medium text-white mb-4 text-center">
                Select Themes ({selectedThemes.length}/{maxThemes})
              </h2>
              
              {/* Selected Themes Display */}
              {selectedThemes.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {selectedThemes.map((theme) => (
                    <div
                      key={theme}
                      className="flex items-center gap-2 bg-rose-600 text-white rounded-full px-3 py-1 text-sm"
                    >
                      <span>{theme}</span>
                      <button
                        onClick={() => handleThemeToggle(theme)}
                        className="hover:bg-rose-700 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Dropdown Button */}
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                  variant="outline"
                  disabled={selectedThemes.length >= maxThemes}
                  className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 px-6 py-2"
                >
                  Add Theme
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showThemeDropdown ? 'rotate-180' : ''}`} />
                </Button>
              </div>
              
              {/* Dropdown Menu */}
              {showThemeDropdown && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {themes
                      .filter(theme => !selectedThemes.includes(theme))
                      .map((theme) => (
                        <button
                          key={theme}
                          onClick={() => {
                            handleThemeToggle(theme)
                            if (selectedThemes.length + 1 >= maxThemes) {
                              setShowThemeDropdown(false)
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-700 rounded transition-colors"
                        >
                          {theme}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Platforms Selection - Dropdown */}
            <div className="relative dropdown-container">
              <h2 className="text-xl font-medium text-white mb-4 text-center">
                Select Platforms ({selectedPlatforms.length}/{maxPlatforms})
              </h2>
              
              {/* Selected Platforms Display */}
              {selectedPlatforms.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {selectedPlatforms.map((platform) => (
                    <div
                      key={platform}
                      className="flex items-center gap-2 bg-blue-600 text-white rounded-full px-3 py-1 text-sm"
                    >
                      <span>{platform}</span>
                      <button
                        onClick={() => handlePlatformToggle(platform)}
                        className="hover:bg-blue-700 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Dropdown Button */}
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                  variant="outline"
                  disabled={selectedPlatforms.length >= maxPlatforms}
                  className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 px-6 py-2"
                >
                  Add Platform
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showPlatformDropdown ? 'rotate-180' : ''}`} />
                </Button>
              </div>
              
              {/* Dropdown Menu */}
              {showPlatformDropdown && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {platforms
                      .filter(platform => !selectedPlatforms.includes(platform))
                      .map((platform) => (
                        <button
                          key={platform}
                          onClick={() => {
                            handlePlatformToggle(platform)
                            if (selectedPlatforms.length + 1 >= maxPlatforms) {
                              setShowPlatformDropdown(false)
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-700 rounded transition-colors"
                        >
                          {platform}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Get Recommendations Button */}
        <div className="text-center mb-16">
          <Button
            onClick={getRecommendations}
            disabled={loading || selectedGames.length === 0}
            className="bg-[#5d4af8] hover:bg-[#5d4af8]/80 text-white px-12 py-4 text-lg rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            {loading ? 'Getting Recommendations...' : 'Get Recommendations'}
          </Button>
          
          {selectedGames.length === 0 && (
            <p className="text-zinc-500 text-sm mt-2">
              Select at least one game to get recommendations
            </p>
          )}
          

        </div>



        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-8">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5d4af8] mx-auto mb-4"></div>
            <p className="text-zinc-400">Finding perfect games for you...</p>
          </div>
        )}

        {/* Results */}
        {recommendations && allGames.length > 0 && (
          <div className="mt-16">
            {/* Seed Game Info */}
            <div className="bg-zinc-900/50 rounded-2xl border border-[#5d4af8]/30 p-6 mb-12 shadow-[0_0_20px_rgba(93,74,248,0.3)]">
              <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                Recommendations based on "{recommendations.seed.name}"
              </h2>
              
              {/* Seed Game Details */}
              <div className="flex items-center justify-center gap-6 mb-6">
                {recommendations.seed.cover?.url && (
                  <img
                    src={recommendations.seed.cover.url}
                    alt={recommendations.seed.name}
                    className="w-20 h-28 rounded-lg object-cover"
                  />
                )}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">{recommendations.seed.name}</h3>
                  {recommendations.seed.rating && (
                    <div className="text-[#5d4af8] font-semibold mb-2">
                      Rating: {Math.round(recommendations.seed.rating)}/100
                    </div>
                  )}
                </div>
              </div>
              
              {/* Seed Game Attributes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {recommendations.seed.genres && recommendations.seed.genres.length > 0 && (
                  <div>
                    <div className="text-[#5d4af8] font-semibold mb-2">Genres:</div>
                    <div className="flex flex-wrap gap-1">
                      {recommendations.seed.genres.slice(0, 3).map((genre: any, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {genre.name || `Genre ${genre.id}`}
                        </Badge>
                      ))}
                      {recommendations.seed.genres.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{recommendations.seed.genres.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {recommendations.seed.companies && recommendations.seed.companies.length > 0 && (
                  <div>
                    <div className="text-[#5d4af8] font-semibold mb-2">Companies:</div>
                    <div className="flex flex-wrap gap-1">
                      {recommendations.seed.companies.slice(0, 2).map((company: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {company.company?.name || company.name || `Company ${company.id}`}
                        </Badge>
                      ))}
                      {recommendations.seed.companies.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{recommendations.seed.companies.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {recommendations.seed.platforms && recommendations.seed.platforms.length > 0 && (
                  <div>
                    <div className="text-[#5d4af8] font-semibold mb-2">Platforms:</div>
                    <div className="flex flex-wrap gap-1">
                      {recommendations.seed.platforms.slice(0, 3).map((platform: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {platform.name || `Platform ${platform.id}`}
                        </Badge>
                      ))}
                      {recommendations.seed.platforms.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{recommendations.seed.platforms.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>



            <div className="space-y-16">
              {recommendations.dbScored.length > 0 && (
                <div>
                  <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="h-1 w-12 bg-gradient-to-r from-[#5d4af8] to-transparent rounded"></div>
                    <h3 className="text-2xl font-bold text-white">AI-Scored Matches</h3>
                    <div className="h-1 w-12 bg-gradient-to-l from-[#5d4af8] to-transparent rounded"></div>
                  </div>
                  <p className="text-zinc-400 text-center mb-8 max-w-2xl mx-auto">
                    These games scored highest based on genre, company, keyword, theme, rating, and platform similarities.
                  </p>
                  <GameGrid 
                    games={recommendations.dbScored.map((game: any) => ({
                      ...game,
                      // Add score info to game for potential display
                      scoreInfo: {
                        finalScore: game.finalScore,
                        genreScore: game.genreScore,
                        companyScore: game.companyScore,
                        keywordScore: game.keywordScore,
                        themeScore: game.themeScore,
                        ratingScore: game.ratingScoreValue,
                        platformScore: game.platformScore
                      }
                    }))} 
                    title=""
                    onAddToList={(gameId: number) => console.log('Add to list:', gameId)}
                    onAddToLibrary={(gameId: number) => console.log('Like game:', gameId)}
                    onMoreInfo={(gameId: number) => console.log('More info:', gameId)}
                  />
                </div>
              )}
              
              {recommendations.igdbPool.length > 0 && (
                <div>
                  <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="h-1 w-12 bg-gradient-to-r from-emerald-500 to-transparent rounded"></div>
                    <h3 className="text-2xl font-bold text-white">Popular in Same Genres</h3>
                    <div className="h-1 w-12 bg-gradient-to-l from-emerald-500 to-transparent rounded"></div>
                  </div>
                  <p className="text-zinc-400 text-center mb-8 max-w-2xl mx-auto">
                    Highly-rated games that share genres with "{recommendations.seed.name}".
                  </p>
                  <GameGrid 
                    games={recommendations.igdbPool} 
                    title=""
                    onAddToList={(gameId: number) => console.log('Add to list:', gameId)}
                    onAddToLibrary={(gameId: number) => console.log('Like game:', gameId)}
                    onMoreInfo={(gameId: number) => console.log('More info:', gameId)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !recommendations && (
          <div className="text-center py-16">
          
          </div>
        )}

        {/* No Results */}
        {recommendations && allGames.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">😔</div>
            <h3 className="text-xl font-semibold text-white mb-2">No recommendations found</h3>
            <p className="text-zinc-400 max-w-md mx-auto">
              We couldn't find any recommendations for "{recommendations.seed.name}". Try searching for a different game!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}