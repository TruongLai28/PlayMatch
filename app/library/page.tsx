"use client"

import React from "react"
import { Search, Filter, Grid3X3, List, Clock, Star, Play, Plus, Heart, Archive, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GameCard } from "@/features/game/components/GameCard"

export default function LibraryPage() {
  // Mock data for template - replace with real data later
  const mockGames = [
    {
      id: 1942,
      name: "The Witcher 3: Wild Hunt",
      cover: { url: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.webp" },
      rating: 94,
      first_release_date: 1431993600,
      genres: [{ name: "RPG" }, { name: "Adventure" }],
      platforms: [{ name: "PC" }, { name: "PlayStation" }],
      status: "played",
      playtime: "120 hours",
      dateAdded: "2024-01-15"
    },
    {
      id: 1020,
      name: "Grand Theft Auto V",
      cover: { url: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.webp" },
      rating: 96,
      first_release_date: 1379376000,
      genres: [{ name: "Action" }, { name: "Adventure" }],
      platforms: [{ name: "PC" }, { name: "PlayStation" }],
      status: "played",
      playtime: "85 hours",
      dateAdded: "2024-02-20"
    },
    {
      id: 1877,
      name: "Cyberpunk 2077",
      cover: { url: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2rpf.webp" },
      rating: 86,
      first_release_date: 1607558400,
      genres: [{ name: "RPG" }, { name: "Action" }],
      platforms: [{ name: "PC" }],
      status: "wishlist",
      playtime: "0 hours",
      dateAdded: "2024-03-10"
    }
  ]

  const libraryStats = {
    totalGames: 156,
    played: 12,
    wishlist: 23
  }

  const categories = [
    { name: "All Games", count: libraryStats.totalGames, icon: Grid3X3, active: true },
    { name: "Played", count: libraryStats.played, icon: Play, active: false },
    { name: "Wishlist", count: libraryStats.wishlist, icon: Heart, active: false }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "played":
        return <Badge className="bg-green-600 text-white">Played</Badge>
      case "wishlist":
        return <Badge className="bg-purple-600 text-white">Wishlist</Badge>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Game Library</h1>
          <p className="text-zinc-400">Manage and organize your gaming collection</p>
          
          {/* Library Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
              <div className="text-2xl font-bold text-white">{libraryStats.totalGames}</div>
              <div className="text-sm text-zinc-400">Total Games</div>
            </div>
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
              <div className="text-2xl font-bold text-green-400">{libraryStats.played}</div>
              <div className="text-sm text-zinc-400">Played</div>
            </div>
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
              <div className="text-2xl font-bold text-purple-400">{libraryStats.wishlist}</div>
              <div className="text-sm text-zinc-400">Wishlist</div>
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
                className="pl-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-400"
              />
            </div>
            <Button className="bg-[#5d4af8] hover:bg-[#5d4af8]/80 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Game to Library
            </Button>
          </div>

          {/* View and Filter Controls */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <Button
                  key={category.name}
                  variant={category.active ? "default" : "outline"}
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

        {/* Games Grid */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">All Games</h2>
            <div className="text-sm text-zinc-400">
              Showing {mockGames.length} of {libraryStats.totalGames} games
            </div>
          </div>

          {/* Grid View */}
          <div className="px-4 md:px-6 lg:px-8 xl:px-12 pb-8">
            <div className="flex flex-wrap gap-4 justify-center">
              {mockGames.map((game) => (
                <div key={game.id} className="relative group/card w-[280px] flex-shrink-0">
                  <div className="relative rounded-lg overflow-hidden bg-zinc-900/50 transition-all duration-300 group-hover/card:shadow-2xl group-hover/card:shadow-purple-500/20 group-hover/card:bg-zinc-800/80">
                    {/* Custom GameCard without plus/thumbs up buttons */}
                    <div className="flex-shrink-0 relative">
                      <div className="relative w-[280px] cursor-pointer rounded-lg overflow-hidden focus:outline-none group/card">
                        <img
                          src={game.cover?.url?.replace('t_thumb', 't_cover_big') || 'https://placehold.co/400x600/1f1f2b/5d4af8?text=No+Cover'}
                          alt={game.name}
                          className="w-full h-[400px] object-cover"
                        />
                       
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        
                        {/* Game info overlay without action buttons */}
                        <div className="absolute inset-0 p-4 flex flex-col justify-end opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                          <div className="space-y-3">
                            <h3 className="text-white font-bold text-lg leading-tight">
                              {game.name}
                            </h3>
                            
                            {/* Rating and Genres */}
                            <div className="flex items-center space-x-3 flex-wrap">
                              {game.rating && (
                                <div className="flex items-center space-x-1 bg-green-600/20 px-2 py-1 rounded-full">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-green-400 text-sm font-medium">
                                    {Math.round(game.rating / 10)}/10
                                  </span>
                                </div>
                              )}
                              {game.genres && game.genres.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {game.genres.slice(0, 2).map((genre) => (
                                    <span 
                                      key={genre.name}
                                      className="bg-gray-600/30 text-gray-300 text-xs px-2 py-1 rounded-full"
                                    >
                                      {genre.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Library-specific overlays */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                      {getStatusBadge(game.status)}
                    </div>
                    
                    {/* Action buttons on hover */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 z-10">
                      <div className="flex flex-col gap-1">
                        <Button size="sm" variant="destructive" className="h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Empty State (when no games match filters) */}
        <div className="hidden text-center py-16">
          <div className="mx-auto max-w-md">
            <div className="bg-zinc-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Grid3X3 className="h-10 w-10 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No games found</h3>
            <p className="text-zinc-400 mb-4">
              Try adjusting your search terms or filters to find more games.
            </p>
            <Button className="bg-[#5d4af8] hover:bg-[#5d4af8]/80 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Game
            </Button>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-8">
          <div className="flex gap-2">
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Previous
            </Button>
            <Button variant="outline" className="border-zinc-700 bg-[#5d4af8] text-white hover:bg-[#5d4af8]/80">
              1
            </Button>
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              2
            </Button>
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              3
            </Button>
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
