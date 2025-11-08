"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Search, Filter, Grid3X3, List, Clock, Star, Play, Plus, Heart, Archive, Trash2, Loader2, Edit3, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/features/auth/AuthProvider"
import { useRouter } from "next/navigation"

interface LibraryEntry {
  id: string
  gameId: number
  status: 'backlog' | 'playing' | 'completed' | 'dropped'
  hoursPlayed: number
  addedAt: string
  updatedAt: string
  game: {
    id: number
    name: string
    summary: string
    rating: number | null
    coverUrl: string
    genres: string[]
    platforms: string[]
  }
}

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [library, setLibrary] = useState<LibraryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeStatus, setActiveStatus] = useState<string>("all")
  const [editingHours, setEditingHours] = useState<{ [key: string]: boolean }>({})
  const [tempHours, setTempHours] = useState<{ [key: string]: string }>({})
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({})
  const [editingStatus, setEditingStatus] = useState<{ [key: string]: boolean }>({})
  const [updatingStatus, setUpdatingStatus] = useState<{ [key: string]: boolean }>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'addedAt' | 'hoursPlayed' | 'rating'>('addedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [minRating, setMinRating] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)

  // Filter library based on search and status
  const filteredLibrary = useMemo(() => {
    let filtered = library

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.game.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (activeStatus !== "all") {
      filtered = filtered.filter(entry => entry.status === activeStatus)
    }

    // Filter by genres
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(entry =>
        entry.game.genres.some((genre: any) => 
          selectedGenres.includes(typeof genre === 'string' ? genre : genre.name)
        )
      )
    }

    // Filter by rating
    if (minRating > 0) {
      filtered = filtered.filter(entry => 
        entry.game.rating && entry.game.rating >= minRating * 10
      )
    }

    // Sort the results
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.game.name.localeCompare(b.game.name)
          break
        case 'addedAt':
          comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
          break
        case 'hoursPlayed':
          comparison = a.hoursPlayed - b.hoursPlayed
          break
        case 'rating':
          comparison = (a.game.rating || 0) - (b.game.rating || 0)
          break
        default:
          return 0
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [library, searchQuery, activeStatus, selectedGenres, minRating, sortBy, sortOrder])

  const libraryStats = useMemo(() => {
    const totalHours = library.reduce((sum, entry) => sum + entry.hoursPlayed, 0)
    return {
      totalGames: library.length,
      backlog: library.filter(entry => entry.status === 'backlog').length,
      playing: library.filter(entry => entry.status === 'playing').length,
      completed: library.filter(entry => entry.status === 'completed').length,
      dropped: library.filter(entry => entry.status === 'dropped').length,
      totalHours
    }
  }, [library])

  // Get all unique genres from library for filtering
  const availableGenres = useMemo(() => {
    const genresSet = new Set<string>()
    library.forEach(entry => {
      entry.game.genres.forEach((genre: any) => {
        genresSet.add(typeof genre === 'string' ? genre : genre.name)
      })
    })
    return Array.from(genresSet).sort()
  }, [library])

  // Pagination logic
  const totalPages = Math.ceil(filteredLibrary.length / itemsPerPage)
  const paginatedLibrary = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredLibrary.slice(startIndex, endIndex)
  }, [filteredLibrary, currentPage, itemsPerPage])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeStatus, selectedGenres, minRating, sortBy, sortOrder])

  const categories = [
    { name: "All Games", count: libraryStats.totalGames, icon: Grid3X3, active: activeStatus === "all" },
    { name: "Backlog", count: libraryStats.backlog, icon: Archive, active: activeStatus === "backlog" },
    { name: "Playing", count: libraryStats.playing, icon: Play, active: activeStatus === "playing" },
    { name: "Completed", count: libraryStats.completed, icon: Star, active: activeStatus === "completed" },
    { name: "Dropped", count: libraryStats.dropped, icon: Trash2, active: activeStatus === "dropped" }
  ]

  // Fetch user library
  useEffect(() => {
    const fetchLibrary = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/db/user-library', {
          method: 'GET',
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Failed to fetch library')
        }

        const data = await response.json()
        setLibrary(data.library || [])
      } catch (err) {
        console.error('Error fetching library:', err)
        setError(err instanceof Error ? err.message : 'Failed to load library')
      } finally {
        setLoading(false)
      }
    }

    fetchLibrary()
  }, [user])

  // Remove game from library
  const removeFromLibrary = async (gameId: number) => {
    try {
      const response = await fetch('/api/db/user-library', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ gameId })
      })

      if (!response.ok) {
        throw new Error('Failed to remove game')
      }

      // Update local state
      setLibrary(prev => prev.filter(entry => entry.gameId !== gameId))
    } catch (err) {
      console.error('Error removing game:', err)
      // You could add a toast notification here
    }
  }

  // Update hours played
  const updateHoursPlayed = async (gameId: number, newHours: number) => {
    try {
      setUpdating(prev => ({ ...prev, [gameId]: true }))
      
      const response = await fetch('/api/db/user-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          gameId, 
          hoursPlayed: newHours,
          // Keep existing status - we need to find it
          status: library.find(entry => entry.gameId === gameId)?.status || 'backlog'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update hours')
      }

      // Update local state
      setLibrary(prev => prev.map(entry => 
        entry.gameId === gameId 
          ? { ...entry, hoursPlayed: newHours }
          : entry
      ))
      
      setEditingHours(prev => ({ ...prev, [gameId]: false }))
      setTempHours(prev => ({ ...prev, [gameId]: '' }))
    } catch (err) {
      console.error('Error updating hours:', err)
    } finally {
      setUpdating(prev => ({ ...prev, [gameId]: false }))
    }
  }

  // Update game status
  const updateGameStatus = async (gameId: number, newStatus: 'backlog' | 'playing' | 'completed' | 'dropped') => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [gameId]: true }))
      
      const response = await fetch('/api/db/user-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          gameId, 
          status: newStatus,
          // Keep existing hours
          hoursPlayed: library.find(entry => entry.gameId === gameId)?.hoursPlayed || 0
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      // Update local state
      setLibrary(prev => prev.map(entry => 
        entry.gameId === gameId 
          ? { ...entry, status: newStatus }
          : entry
      ))
      
      setEditingStatus(prev => ({ ...prev, [gameId]: false }))
    } catch (err) {
      console.error('Error updating status:', err)
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [gameId]: false }))
    }
  }

  const startEditingHours = (gameId: number, currentHours: number) => {
    setEditingHours(prev => ({ ...prev, [gameId]: true }))
    setTempHours(prev => ({ ...prev, [gameId]: currentHours.toString() }))
  }

  const cancelEditingHours = (gameId: number) => {
    setEditingHours(prev => ({ ...prev, [gameId]: false }))
    setTempHours(prev => ({ ...prev, [gameId]: '' }))
  }

  const saveHours = (gameId: number) => {
    const newHours = parseFloat(tempHours[gameId] || '0')
    if (isNaN(newHours) || newHours < 0) {
      return // Invalid input
    }
    updateHoursPlayed(gameId, newHours)
  }

  const startEditingStatus = (gameId: number) => {
    setEditingStatus(prev => ({ ...prev, [gameId]: true }))
  }

  const cancelEditingStatus = (gameId: number) => {
    setEditingStatus(prev => ({ ...prev, [gameId]: false }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "backlog":
        return <Badge className="bg-blue-600 text-white cursor-pointer" title="Click to change status">Backlog</Badge>
      case "playing":
        return <Badge className="bg-green-600 text-white cursor-pointer" title="Click to change status">Playing</Badge>
      case "completed":
        return <Badge className="bg-purple-600 text-white cursor-pointer" title="Click to change status">Completed</Badge>
      case "dropped":
        return <Badge className="bg-red-600 text-white cursor-pointer" title="Click to change status">Dropped</Badge>
      default:
        return null
    }
  }

  const renderEditableStatus = (entry: LibraryEntry) => {
    const isEditing = editingStatus[entry.gameId]
    const isUpdating = updatingStatus[entry.gameId]
    
    if (isEditing) {
      return (
        <div className="flex flex-col gap-1">
          <select
            value={entry.status}
            onChange={(e) => {
              const newStatus = e.target.value as 'backlog' | 'playing' | 'completed' | 'dropped'
              updateGameStatus(entry.gameId, newStatus)
            }}
            onBlur={() => cancelEditingStatus(entry.gameId)}
            className="text-xs px-2 py-1 bg-zinc-800 border border-zinc-600 text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          >
            <option value="backlog">Backlog</option>
            <option value="playing">Playing</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
          </select>
        </div>
      )
    }
    
    return (
      <div 
        className="group/status" 
        onClick={() => startEditingStatus(entry.gameId)}
      >
        <div className="flex items-center gap-1">
          {isUpdating ? (
            <div className="bg-zinc-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Updating...
            </div>
          ) : (
            <>
              {getStatusBadge(entry.status)}
              <Edit3 className="w-3 h-3 text-zinc-400 opacity-0 group-hover/status:opacity-100 transition-opacity" />
            </>
          )}
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "backlog": return "text-blue-400"
      case "playing": return "text-green-400"
      case "completed": return "text-purple-400" 
      case "dropped": return "text-red-400"
      default: return "text-gray-400"
    }
  }

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/login')
    return null
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
          width: 300px;
          height: 300px;
          top: 15%;
          left: -100px;
          animation-delay: -2s;
        }
        .gradient-circle:nth-child(2) {
          width: 250px;
          height: 250px;
          top: -60px;
          left: 35%;
          animation-delay: -7s;
        }
        .gradient-circle:nth-child(3) {
          width: 200px;
          height: 200px;
          bottom: 20%;
          right: -80px;
          animation-delay: -12s;
        }
        .gradient-circle:nth-child(4) {
          width: 280px;
          height: 280px;
          top: 40%;
          right: 20%;
          animation-delay: -4s;
        }
        .gradient-circle:nth-child(5) {
          width: 160px;
          height: 160px;
          bottom: -40px;
          left: 20%;
          animation-delay: -9s;
        }
        .gradient-x {
          position: absolute;
          font-size: 40px;
          font-weight: bold;
          color: rgba(93, 74, 248, 0.2);
          filter: blur(1px);
          animation: floatX 25s ease-in-out infinite;
          font-family: monospace;
        }
        .gradient-o {
          position: absolute;
          font-size: 35px;
          font-weight: bold;
          color: rgba(124, 58, 237, 0.2);
          filter: blur(1px);
          animation: floatO 22s ease-in-out infinite;
          font-family: monospace;
        }
        .gradient-x:nth-child(6) {
          top: 25%;
          left: 10%;
          animation-delay: -6s;
        }
        .gradient-x:nth-child(7) {
          bottom: 30%;
          right: 8%;
          animation-delay: -14s;
        }
        .gradient-x:nth-child(8) {
          top: 60%;
          left: 45%;
          animation-delay: -3s;
        }
        .gradient-o:nth-child(9) {
          top: 10%;
          right: 25%;
          animation-delay: -9s;
        }
        .gradient-o:nth-child(10) {
          bottom: 15%;
          left: 35%;
          animation-delay: -16s;
        }
        .gradient-o:nth-child(11) {
          top: 45%;
          left: 5%;
          animation-delay: -5s;
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
        @keyframes floatX {
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
        @keyframes floatO {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg) scale(1);
          }
          25% {
            transform: translateY(-12px) translateX(6px) rotate(-4deg) scale(1.1);
          }
          50% {
            transform: translateY(8px) translateX(-10px) rotate(6deg) scale(0.9);
          }
          75% {
            transform: translateY(-6px) translateX(12px) rotate(-3deg) scale(1.05);
          }
        }
      `}</style>
      
      <div className="min-h-screen bg-black">
        {/* Decorative gradient circles and X/O elements */}
        <div className="gradient-circles">
          <div className="gradient-circle"></div>
          <div className="gradient-circle"></div>
          <div className="gradient-circle"></div>
          <div className="gradient-circle"></div>
          <div className="gradient-circle"></div>
          <div className="gradient-x">✕</div>
          <div className="gradient-x">✕</div>
          <div className="gradient-x">✕</div>
          <div className="gradient-o">◯</div>
          <div className="gradient-o">◯</div>
          <div className="gradient-o">◯</div>
        </div>
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Game Library</h1>
          <p className="text-zinc-400">
            Manage and organize your gaming collection
          </p>
          
          {/* Library Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
              <div className="text-2xl font-bold text-white">{libraryStats.totalGames}</div>
              <div className="text-sm text-zinc-400">Total Games</div>
            </div>
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
              <div className="text-2xl font-bold text-green-400">{libraryStats.playing}</div>
              <div className="text-sm text-zinc-400">Playing</div>
            </div>
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
              <div className="text-2xl font-bold text-purple-400">{libraryStats.completed}</div>
              <div className="text-sm text-zinc-400">Completed</div>
            </div>
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
              <div className="text-2xl font-bold text-blue-400">{libraryStats.backlog}</div>
              <div className="text-sm text-zinc-400">Backlog</div>
            </div>
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
              <div className="text-2xl font-bold text-orange-400">{libraryStats.totalHours.toFixed(1)}</div>
              <div className="text-sm text-zinc-400">Hours Played</div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="mb-8 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Search and Add Game */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
              <Input
                placeholder="Search your library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-400"
              />
            </div>
            <Button 
              className="bg-[#5d4af8] hover:bg-[#5d4af8]/80 text-white"
              onClick={() => router.push('/browse')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Game to Library
            </Button>
          </div>

          {/* View and Filter Controls */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm" 
              className={viewMode === 'grid' 
                ? "bg-[#5d4af8] text-white hover:bg-[#5d4af8]/80" 
                : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              }
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm" 
              className={viewMode === 'list' 
                ? "bg-[#5d4af8] text-white hover:bg-[#5d4af8]/80" 
                : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              }
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon
              const statusKey = category.name === "All Games" ? "all" : category.name.toLowerCase()
              return (
                <Button
                  key={category.name}
                  variant={category.active ? "default" : "outline"}
                  onClick={() => setActiveStatus(statusKey)}
                  className={`flex items-center gap-2 ${
                    category.active
                      ? "bg-[#5d4af8] text-white hover:bg-[#5d4af8]/80"
                      : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {category.count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Expanded Filters Panel */}
        {showFilters && (
          <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Filters & Sorting</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="addedAt">Date Added</option>
                  <option value="name">Name</option>
                  <option value="hoursPlayed">Hours Played</option>
                  <option value="rating">Rating</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Min Rating</label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={0}>Any Rating</option>
                  <option value={5}>5+ Stars</option>
                  <option value={6}>6+ Stars</option>
                  <option value={7}>7+ Stars</option>
                  <option value={8}>8+ Stars</option>
                  <option value={9}>9+ Stars</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSortBy('addedAt')
                    setSortOrder('desc')
                    setMinRating(0)
                    setSelectedGenres([])
                  }}
                  className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Genres Filter */}
            {availableGenres.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Genres</label>
                <div className="flex flex-wrap gap-2">
                  {availableGenres.map((genre) => (
                    <Button
                      key={genre}
                      variant={selectedGenres.includes(genre) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (selectedGenres.includes(genre)) {
                          setSelectedGenres(prev => prev.filter(g => g !== genre))
                        } else {
                          setSelectedGenres(prev => [...prev, genre])
                        }
                      }}
                      className={`text-xs ${
                        selectedGenres.includes(genre)
                          ? "bg-[#5d4af8] text-white hover:bg-[#5d4af8]/80"
                          : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      {genre}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Games Grid or Loading/Error/Empty State */}
        <div className="mb-8">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-white animate-spin mx-auto mb-4" />
                <p className="text-zinc-400">Loading your library...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="mx-auto max-w-md">
                <div className="bg-red-900/20 border border-red-800 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Archive className="h-10 w-10 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Error loading library</h3>
                <p className="text-zinc-400 mb-4">{error}</p>
                <Button 
                  onClick={() => window.location.reload()}
                  className="bg-[#5d4af8] hover:bg-[#5d4af8]/80 text-white"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : filteredLibrary.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {activeStatus === "all" ? "All Games" : categories.find(c => c.name.toLowerCase() === activeStatus)?.name || "Games"}
                </h2>
                <div className="text-sm text-zinc-400">
                  Showing {paginatedLibrary.length} of {filteredLibrary.length} games
                  {filteredLibrary.length !== libraryStats.totalGames && ` (${libraryStats.totalGames} total)`}
                </div>
              </div>

              {/* Grid View */}
              {viewMode === 'grid' ? (
                <div className="px-4 md:px-6 lg:px-8 xl:px-12 pb-8">
                  <div className="flex flex-wrap gap-4 justify-center">
                    {paginatedLibrary.map((entry) => (
                    <div key={entry.id} className="relative group/card w-[280px] flex-shrink-0">
                      <div className="relative rounded-lg overflow-hidden bg-zinc-900/50 transition-all duration-300 group-hover/card:shadow-2xl group-hover/card:shadow-purple-500/20 group-hover/card:bg-zinc-800/80">
                        {/* Game Card */}
                        <div className="flex-shrink-0 relative">
                          <div className="relative w-[280px] cursor-pointer rounded-lg overflow-hidden focus:outline-none group/card">
                            <img
                              src={entry.game.coverUrl?.replace('t_thumb', 't_cover_big') || 'https://placehold.co/400x600/1f1f2b/5d4af8?text=No+Cover'}
                              alt={entry.game.name}
                              className="w-full h-[400px] object-cover"
                            />
                           
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            
                            {/* Game info overlay */}
                            <div className="absolute inset-0 p-4 flex flex-col justify-end opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                              <div className="space-y-3">
                                <h3 className="text-white font-bold text-lg leading-tight">
                                  {entry.game.name}
                                </h3>
                                
                                {/* Rating and Hours */}
                                <div className="flex items-center space-x-3 flex-wrap">
                                  {entry.game.rating && (
                                    <div className="flex items-center space-x-1 bg-green-600/20 px-2 py-1 rounded-full">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-green-400 text-sm font-medium">
                                        {Math.round(entry.game.rating / 10)}/10
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Hours Played - Editable */}
                                  <div className="flex items-center space-x-1 bg-blue-600/20 px-2 py-1 rounded-full group">
                                    <Clock className="w-3 h-3 text-blue-400" />
                                    {editingHours[entry.gameId] ? (
                                      <div className="flex items-center space-x-1">
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.1"
                                          value={tempHours[entry.gameId] || ''}
                                          onChange={(e) => setTempHours(prev => ({ 
                                            ...prev, 
                                            [entry.gameId]: e.target.value 
                                          }))}
                                          className="w-16 h-6 px-1 text-xs bg-blue-700 border-blue-600 text-white"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveHours(entry.gameId)
                                            if (e.key === 'Escape') cancelEditingHours(entry.gameId)
                                          }}
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => saveHours(entry.gameId)}
                                          disabled={updating[entry.gameId]}
                                          className="w-4 h-4 flex items-center justify-center text-green-400 hover:text-green-300"
                                        >
                                          {updating[entry.gameId] ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <Check className="w-3 h-3" />
                                          )}
                                        </button>
                                        <button
                                          onClick={() => cancelEditingHours(entry.gameId)}
                                          className="w-4 h-4 flex items-center justify-center text-red-400 hover:text-red-300"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-1">
                                        <span className="text-blue-400 text-sm font-medium">
                                          {entry.hoursPlayed}h
                                        </span>
                                        <button
                                          onClick={() => startEditingHours(entry.gameId, entry.hoursPlayed)}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity w-3 h-3 text-blue-300 hover:text-blue-200"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Genres */}
                                {entry.game.genres && entry.game.genres.length > 0 && (
                                  <div className="flex gap-1 flex-wrap">
                                    {entry.game.genres.slice(0, 2).map((genre: any, index: number) => (
                                      <span 
                                        key={index}
                                        className="bg-gray-600/30 text-gray-300 text-xs px-2 py-1 rounded-full"
                                      >
                                        {typeof genre === 'string' ? genre : genre.name || genre}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                          {renderEditableStatus(entry)}
                        </div>
                        
                        {/* Action buttons on hover */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 z-10">
                          <div className="flex flex-col gap-1">
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="h-8 w-8 p-0"
                              onClick={() => removeFromLibrary(entry.gameId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              ) : (
                /* List View */
                <div className="space-y-4">
                  {paginatedLibrary.map((entry) => (
                    <div key={entry.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        {/* Game Cover */}
                        <div className="flex-shrink-0">
                          <img
                            src={entry.game.coverUrl?.replace('t_thumb', 't_cover_small') || 'https://placehold.co/100x140/1f1f2b/5d4af8?text=No+Cover'}
                            alt={entry.game.name}
                            className="w-16 h-20 object-cover rounded"
                          />
                        </div>
                        
                        {/* Game Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white truncate mb-1">
                            {entry.game.name}
                          </h3>
                          
                          <div className="flex items-center gap-4 mb-2">
                            {/* Status */}
                            <div>{renderEditableStatus(entry)}</div>
                            
                            {/* Hours */}
                            <div className="flex items-center space-x-1 text-blue-400">
                              <Clock className="w-4 h-4" />
                              {editingHours[entry.gameId] ? (
                                <div className="flex items-center space-x-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={tempHours[entry.gameId] || ''}
                                    onChange={(e) => setTempHours(prev => ({ 
                                      ...prev, 
                                      [entry.gameId]: e.target.value 
                                    }))}
                                    className="w-20 h-8 px-2 text-sm bg-zinc-800 border-zinc-600 text-white"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveHours(entry.gameId)
                                      if (e.key === 'Escape') cancelEditingHours(entry.gameId)
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => saveHours(entry.gameId)}
                                    disabled={updating[entry.gameId]}
                                    className="text-green-400 hover:text-green-300"
                                  >
                                    {updating[entry.gameId] ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Check className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => cancelEditingHours(entry.gameId)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startEditingHours(entry.gameId, entry.hoursPlayed)}
                                  className="flex items-center space-x-1 hover:text-blue-300"
                                >
                                  <span className="text-sm">{entry.hoursPlayed}h</span>
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            
                            {/* Rating */}
                            {entry.game.rating && (
                              <div className="flex items-center space-x-1 text-green-400">
                                <Star className="w-4 h-4" />
                                <span className="text-sm">{Math.round(entry.game.rating / 10)}/10</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Genres */}
                          {entry.game.genres && entry.game.genres.length > 0 && (
                            <div className="flex gap-1 flex-wrap mb-2">
                              {entry.game.genres.slice(0, 3).map((genre: any, index: number) => (
                                <span 
                                  key={index}
                                  className="bg-zinc-700 text-zinc-300 text-xs px-2 py-1 rounded"
                                >
                                  {typeof genre === 'string' ? genre : genre.name || genre}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Added Date */}
                          <div className="text-xs text-zinc-400">
                            Added {new Date(entry.addedAt).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex-shrink-0">
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="h-8 w-8 p-0"
                            onClick={() => removeFromLibrary(entry.gameId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="mx-auto max-w-md">
                <div className="bg-zinc-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Grid3X3 className="h-10 w-10 text-zinc-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {searchQuery || activeStatus !== "all" 
                    ? `No games found`
                    : "Your library is empty"
                  }
                </h3>
                <p className="text-zinc-400 mb-4">
                  {searchQuery 
                    ? `No games match "${searchQuery}"`
                    : activeStatus !== "all"
                    ? `You don't have any games in "${categories.find(c => c.name.toLowerCase() === activeStatus)?.name}" status`
                    : "Start building your game collection by adding games to your library."
                  }
                </p>
                <Button 
                  className="bg-[#5d4af8] hover:bg-[#5d4af8]/80 text-white"
                  onClick={() => router.push('/browse')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {searchQuery || activeStatus !== "all" ? "Browse Games" : "Add Your First Game"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              
              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage = page === 1 || page === totalPages || 
                                Math.abs(page - currentPage) <= 1
                
                if (!showPage) {
                  // Show ellipsis
                  if (page === 2 && currentPage > 4) {
                    return <span key={page} className="px-2 text-zinc-500">...</span>
                  }
                  if (page === totalPages - 1 && currentPage < totalPages - 3) {
                    return <span key={page} className="px-2 text-zinc-500">...</span>
                  }
                  return null
                }
                
                return (
                  <Button 
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    className={currentPage === page 
                      ? "bg-[#5d4af8] text-white hover:bg-[#5d4af8]/80" 
                      : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    }
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              })}
              
              <Button 
                variant="outline" 
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
