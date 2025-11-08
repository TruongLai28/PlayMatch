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
  
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState<string>('')
  const [selectedGames, setSelectedGames] = useState<Game[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  
  // Dropdown visibility states
  const [showKeywordDropdown, setShowKeywordDropdown] = useState(false)
  const [showThemeDropdown, setShowThemeDropdown] = useState(false)
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false)
  
  // Autocomplete states
  const [searchSuggestions, setSearchSuggestions] = useState<Game[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [showResultsModal, setShowResultsModal] = useState(false)

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
      
      // Prepare data for vector-search API
      const requestBody = {
        gameIds: selectedGames.map(game => game.id),
        genres: selectedGenres,
        themes: selectedThemes,
        keywords: selectedKeywords,
        platforms: selectedPlatforms,
        limit: 20,
        minRating: 70
      }
      
      console.log('Getting vector-based recommendations with:', requestBody)
      
      const response = await fetch('/api/db/ai-recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.error || 'Failed to get recommendations')
      }
      
      const data: RecommendationResponse = await response.json()
      console.log('Vector search recommendations received:', {
        query: data.query,
        count: data.count,
        message: data.message,
        debug: data.debug
      })
      
      // Log similarity scores for top matches
      if (data.recommendations && data.recommendations.length > 0) {
        console.log('Top 3 vector similarity matches:')
        data.recommendations.slice(0, 3).forEach((game: any, idx: number) => {
          console.log(`${idx + 1}. ${game.name} (Similarity: ${game.similarity_score || 'N/A'})`)
          if (game.rating) {
            console.log(`   - Rating: ${game.rating}/100`)
          }
        })
      }
      
      // Fix cover URLs for recommendations
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

  const allGames = recommendations ? recommendations.recommendations : []

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
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-[#5d4af8] to-purple-500 rounded-full flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Discover Your Match
            </h1>
          </div>
          <p className="text-zinc-300 text-xl mb-4 max-w-3xl mx-auto">
            
          </p>
          <p className="text-zinc-500 text-base max-w-2xl mx-auto">
            Our AI analyzes gameplay patterns, themes, player sentiment, and semantic relationships to find games that truly match your preferences.
          </p>
        </div>

        {/* Interactive Preference Wizard */}
        <div className="space-y-8 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step 1: Games Card */}
            <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 rounded-2xl border border-blue-500/30 p-6 hover:border-blue-400/50 transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Add Games You Love</h3>
                  <p className="text-blue-300 text-sm">Tell us what you enjoy playing</p>
                </div>
              </div>
              <div className="mb-4">
                {selectedGames.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {selectedGames.map((game) => (
                        <div key={game.id} className="relative group">
                          <div className="w-12 h-16 bg-zinc-700 rounded border-2 border-blue-400/30 overflow-hidden group-hover:border-blue-400/60 transition-colors">
                            {game.cover?.url ? (
                              <img
                                src={game.cover.url}
                                alt={game.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-blue-400 text-xs">
                                No Image
                              </div>
                            )}
                          </div>
                          {/* Delete Button */}
                          <button
                            onClick={() => removeGame(game.id)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            title={`Remove ${game.name}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="text-center">
                      <p className="text-blue-200 text-sm">{selectedGames.length}/{maxGames} games selected</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 border-2 border-dashed border-blue-500/30 rounded-lg group-hover:border-blue-400/50 transition-colors">
                    <div className="text-blue-400 text-2xl mb-2">+</div>
                    <p className="text-blue-200 text-sm">No games selected yet</p>
                    <p className="text-blue-300 text-xs mt-1">Search for games below</p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Preferences Card */}
            <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 rounded-2xl border border-purple-500/30 p-6 hover:border-purple-400/50 transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Set Preferences</h3>
                  <p className="text-purple-300 text-sm">Customize your recommendations</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-purple-200 text-sm">Genres</span>
                  <span className="text-purple-300 text-xs">{selectedGenres.length}/{maxGenres}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-200 text-sm">Keywords</span>
                  <span className="text-purple-300 text-xs">{selectedKeywords.length}/{maxKeywords}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-200 text-sm">Themes</span>
                  <span className="text-purple-300 text-xs">{selectedThemes.length}/{maxThemes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-200 text-sm">Platforms</span>
                  <span className="text-purple-300 text-xs">{selectedPlatforms.length}/{maxPlatforms}</span>
                </div>
              </div>
            </div>

            {/* Step 3: Discovery Card */}
            <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/20 rounded-2xl border border-emerald-500/30 p-6 hover:border-emerald-400/50 transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Discover Games</h3>
                  <p className="text-emerald-300 text-sm">Get AI-powered recommendations</p>
                </div>
              </div>
              <div className="text-center py-6">
                <div className="text-emerald-400 text-3xl mb-2">*</div>
                {recommendations ? (
                  <Button
                    onClick={() => setShowResultsModal(true)}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-2 rounded-lg w-full mb-2"
                  >
                    View Results! ({allGames.length} games)
                  </Button>
                ) : (
                  <Button
                    onClick={getRecommendations}
                    disabled={loading || selectedGames.length === 0}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-2 rounded-lg w-full"
                  >
                    {loading ? 'Analyzing...' : 'Find Games!'}
                  </Button>
                )}
                {recommendations && (
                  <Button
                    onClick={() => {
                      setRecommendations(null)
                      setShowResultsModal(false)
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs text-zinc-400 border-zinc-600 hover:bg-zinc-800 mt-2"
                  >
                    Start New Search
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Indicator & Action */}
          <div className="space-y-6">
            {/* Game Search Section - Always visible but compact */}
            <div className="bg-gradient-to-br from-zinc-900/70 to-zinc-800/70 rounded-2xl border border-[#5d4af8]/40 p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Search for Games</h3>
                <p className="text-zinc-400 text-sm">Find games you love to get better recommendations</p>
              </div>
              
          {/* Search Section */}
          <div className="mb-8">
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
                className="pl-12 pr-4 py-3 text-lg bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400 rounded-xl focus:ring-2 focus:ring-[#5d4af8] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
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
                      className="flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-2 border border-zinc-700 hover:border-zinc-600 transition-colors"
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

          {/* Collapsible Preference Sections */}
          <div className="space-y-4">
            {/* Genre Selection */}
            <details className="group bg-zinc-900/50 rounded-xl border border-zinc-700 overflow-hidden">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">G</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">Genres</h3>
                    <p className="text-zinc-400 text-sm">What types of games do you enjoy?</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30">
                    {selectedGenres.length}/{maxGenres}
                  </Badge>
                  <div className="text-zinc-400 group-open:rotate-180 transition-transform">
                    <ChevronDown className="h-5 w-5" />
                  </div>
                </div>
              </summary>
              <div className="p-4 pt-0">
                <div className="flex flex-wrap gap-2 max-w-4xl mx-auto">
                  {genres.map((genre) => {
                    const isSelected = selectedGenres.includes(genre)
                    const isDisabled = !isSelected && selectedGenres.length >= maxGenres
                    
                    return (
                      <Button
                        key={genre}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => handleGenreToggle(genre)}
                        disabled={isDisabled}
                        size="sm"
                        className={`rounded-full transition-all duration-200 ${
                          isSelected
                            ? "bg-purple-500 text-white hover:bg-purple-600 border-purple-500"
                            : isDisabled
                            ? "bg-zinc-800 text-zinc-500 border-zinc-700 opacity-50 cursor-not-allowed"
                            : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white"
                        }`}
                      >
                        {genre}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </details>

            {/* Keywords Section */}
            <details className="group bg-zinc-900/50 rounded-xl border border-zinc-700 overflow-hidden">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">K</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">Keywords</h3>
                    <p className="text-zinc-400 text-sm">Specific features you're looking for</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30">
                    {selectedKeywords.length}/{maxKeywords}
                  </Badge>
                  <div className="text-zinc-400 group-open:rotate-180 transition-transform">
                    <ChevronDown className="h-5 w-5" />
                  </div>
                </div>
              </summary>
              <div className="p-4 pt-0">
                <div className="flex flex-wrap gap-2 max-w-4xl mx-auto">
                  {keywords.map((keyword) => {
                    const isSelected = selectedKeywords.includes(keyword)
                    const isDisabled = !isSelected && selectedKeywords.length >= maxKeywords
                    
                    return (
                      <Button
                        key={keyword}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => handleKeywordToggle(keyword)}
                        disabled={isDisabled}
                        size="sm"
                        className={`rounded-full transition-all duration-200 ${
                          isSelected
                            ? "bg-amber-500 text-white hover:bg-amber-600 border-amber-500"
                            : isDisabled
                            ? "bg-zinc-800 text-zinc-500 border-zinc-700 opacity-50 cursor-not-allowed"
                            : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white"
                        }`}
                      >
                        {keyword}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </details>

            {/* Themes Section */}
            <details className="group bg-zinc-900/50 rounded-xl border border-zinc-700 overflow-hidden">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">T</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">Themes</h3>
                    <p className="text-zinc-400 text-sm">What moods and settings appeal to you?</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-300 border-rose-500/30">
                    {selectedThemes.length}/{maxThemes}
                  </Badge>
                  <div className="text-zinc-400 group-open:rotate-180 transition-transform">
                    <ChevronDown className="h-5 w-5" />
                  </div>
                </div>
              </summary>
              <div className="p-4 pt-0">
                <div className="flex flex-wrap gap-2 max-w-4xl mx-auto">
                  {themes.map((theme) => {
                    const isSelected = selectedThemes.includes(theme)
                    const isDisabled = !isSelected && selectedThemes.length >= maxThemes
                    
                    return (
                      <Button
                        key={theme}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => handleThemeToggle(theme)}
                        disabled={isDisabled}
                        size="sm"
                        className={`rounded-full transition-all duration-200 ${
                          isSelected
                            ? "bg-rose-500 text-white hover:bg-rose-600 border-rose-500"
                            : isDisabled
                            ? "bg-zinc-800 text-zinc-500 border-zinc-700 opacity-50 cursor-not-allowed"
                            : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white"
                        }`}
                      >
                        {theme}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </details>

            {/* Platforms Section */}
            <details className="group bg-zinc-900/50 rounded-xl border border-zinc-700 overflow-hidden">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">P</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">Platforms</h3>
                    <p className="text-zinc-400 text-sm">Which platforms do you game on?</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
                    {selectedPlatforms.length}/{maxPlatforms}
                  </Badge>
                  <div className="text-zinc-400 group-open:rotate-180 transition-transform">
                    <ChevronDown className="h-5 w-5" />
                  </div>
                </div>
              </summary>
              <div className="p-4 pt-0">
                <div className="flex flex-wrap gap-2 max-w-4xl mx-auto">
                  {platforms.map((platform) => {
                    const isSelected = selectedPlatforms.includes(platform)
                    const isDisabled = !isSelected && selectedPlatforms.length >= maxPlatforms
                    
                    return (
                      <Button
                        key={platform}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => handlePlatformToggle(platform)}
                        disabled={isDisabled}
                        size="sm"
                        className={`rounded-full transition-all duration-200 ${
                          isSelected
                            ? "bg-indigo-500 text-white hover:bg-indigo-600 border-indigo-500"
                            : isDisabled
                            ? "bg-zinc-800 text-zinc-500 border-zinc-700 opacity-50 cursor-not-allowed"
                            : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white"
                        }`}
                      >
                        {platform}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </details>
          </div>
        </div>
        </div>


        {/* Progress Indicator & Action */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedGames.length > 0 ? 'bg-green-500' : 'bg-zinc-700'}`}>
                <span className="text-white text-sm font-bold">✓</span>
              </div>
              <div className="w-16 h-1 bg-zinc-700 mx-2"></div>
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(selectedGenres.length > 0 || selectedKeywords.length > 0 || selectedThemes.length > 0 || selectedPlatforms.length > 0) ? 'bg-green-500' : 'bg-zinc-700'}`}>
                <span className="text-white text-sm font-bold">✓</span>
              </div>
              <div className="w-16 h-1 bg-zinc-700 mx-2"></div>
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${recommendations ? 'bg-green-500' : 'bg-[#5d4af8]'}`}>
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          {/* Clear All Button */}
          {(selectedGames.length > 0 || selectedGenres.length > 0 || 
            selectedKeywords.length > 0 || selectedThemes.length > 0 || selectedPlatforms.length > 0) && (
            <Button
              onClick={() => {
                setSelectedGames([])
                setSelectedGenres([])
                setSelectedKeywords([])
                setSelectedThemes([])
                setSelectedPlatforms([])
                setShowKeywordDropdown(false)
                setShowThemeDropdown(false)
                setShowPlatformDropdown(false)
              }}
              variant="outline"
              size="sm"
              className="text-zinc-400 border-zinc-700 hover:bg-zinc-800 mb-4"
            >
              Clear All Selections
            </Button>
          )}
          
          {selectedGames.length === 0 && !loading && (
            <div className="p-6 bg-amber-900/10 border border-amber-500/20 rounded-xl inline-block max-w-md">
              <div className="flex items-center gap-3 text-amber-300">
                <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <span className="text-amber-400 text-lg">!</span>
                </div>
                <div>
                  <p className="font-medium">Ready to discover new games?</p>
                  <p className="text-sm text-amber-400 mt-1">Start by adding games you love above!</p>
                </div>
              </div>
            </div>
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

        {/* Results Modal */}
        {showResultsModal && recommendations && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-700 bg-gradient-to-r from-[#5d4af8]/10 to-purple-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#5d4af8] to-purple-500 rounded-full flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Your Game Recommendations</h2>
                    <p className="text-zinc-400 text-sm">Powered by AI similarity matching</p>
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

              {/* Modal Content - Scrollable */}
              <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6">
                {allGames.length > 0 ? (
                  <div className="space-y-8">
                    {/* Compact Summary */}
                    <div className="bg-gradient-to-r from-zinc-800/50 to-zinc-700/50 rounded-xl p-6 border border-zinc-700">
                      <div className="flex items-center justify-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-[#5d4af8] rounded-full"></div>
                          <span className="text-zinc-300">Found <span className="text-white font-semibold">{recommendations.count}</span> matches</span>
                        </div>
                        {recommendations.debug && (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                              <span className="text-zinc-300">Database: <span className="text-white font-semibold">{recommendations.debug.with_embeddings}</span> games</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                              <span className="text-zinc-300">Vector similarity search</span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Search Query */}
                      {recommendations.query && (
                        <div className="mt-4 text-center">
                          <div className="text-[#5d4af8] font-medium mb-2 text-xs uppercase tracking-wide">Search Query</div>
                          <div className="text-white bg-zinc-800 rounded-lg px-4 py-2 inline-block border border-zinc-600">
                            <span className="font-medium">"{recommendations.query}"</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Games Grid */}
                    <div>
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-white mb-2">Recommended Games</h3>
                        <p className="text-zinc-400 text-sm">
                          Each game is scored based on similarity to your preferences
                        </p>
                      </div>
                      <GameGrid 
                        games={recommendations.recommendations.map((game: any) => ({
                          ...game,
                          scoreInfo: {
                            similarity: game.similarity_score
                          }
                        }))} 
                        title=""
                        onAddToLibrary={(gameId: number, status = 'backlog') => {
                          console.log('Add to Library:', gameId, 'with status:', status)
                        }}
                        onMoreInfo={(gameId: number) => console.log('More info:', gameId)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-6 text-zinc-600">×</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No recommendations found</h3>
                    <p className="text-zinc-400 max-w-md mx-auto">
                      We couldn't find any recommendations matching your criteria. Try adjusting your search preferences or selecting different games!
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-zinc-700 p-4 bg-zinc-900/50 flex items-center justify-between">
                <div className="text-sm text-zinc-400">
                  {allGames.length > 0 && `Showing ${allGames.length} recommendations`}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowResultsModal(false)}
                    variant="outline"
                    className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setRecommendations(null)
                      setShowResultsModal(false)
                    }}
                    className="bg-[#5d4af8] hover:bg-[#5d4af8]/90 text-white"
                  >
                    New Search
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !recommendations && (
          <div className="text-center py-16">
          
          </div>
        )}
      </div>
    </div>
  )
}