'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronRight, Target, Zap, Sparkles, Search, TrendingUp } from 'lucide-react'

interface GamifiedQuizProps {
  selectedGames: any[]
  selectedGenres: string[]
  selectedKeywords: string[]
  selectedThemes: string[]
  selectedPlatforms: string[]
  onGenreToggle: (genre: string) => void
  onKeywordToggle: (keyword: string) => void
  onThemeToggle: (theme: string) => void
  onPlatformToggle: (platform: string) => void
  onGetRecommendations: () => void
  loading: boolean
  matchingGamesCount: number | null
  maxGames: number
  maxGenres: number
  maxKeywords: number
  maxThemes: number
  maxPlatforms: number
  genres: string[]
  keywords: string[]
  themes: string[]
  platforms: string[]
  gamerProfile: string | null
  recommendations: any
  // Game search props
  searchInput: string
  setSearchInput: (value: string) => void
  searchSuggestions: any[]
  showSuggestions: boolean
  isSearching: boolean
  selectedSuggestionIndex: number
  handleKeyPress: (e: React.KeyboardEvent) => void
  selectGameFromSuggestion: (game: any) => void
  removeGame: (gameId: number) => void
}

const genreVisuals: Record<string, { emoji: string; color: string; description: string }> = {
  'Shooter': { emoji: '🎯', color: 'from-red-500 to-orange-500', description: 'Fast-paced action' },
  'Role-playing (RPG)': { emoji: '⚔️', color: 'from-purple-500 to-pink-500', description: 'Epic adventures' },
  'Strategy': { emoji: '🧠', color: 'from-blue-500 to-cyan-500', description: 'Tactical thinking' },
  'Adventure': { emoji: '🗺️', color: 'from-green-500 to-emerald-500', description: 'Explore worlds' },
  'Puzzle': { emoji: '🧩', color: 'from-yellow-500 to-amber-500', description: 'Brain teasers' },
  'Racing': { emoji: '🏎️', color: 'from-orange-500 to-red-500', description: 'High-speed thrills' },
  'Sport': { emoji: '⚽', color: 'from-green-600 to-lime-500', description: 'Athletic competition' },
  'Fighting': { emoji: '🥊', color: 'from-red-600 to-rose-500', description: 'Combat masters' },
  'Platform': { emoji: '🦘', color: 'from-cyan-500 to-blue-500', description: 'Jump & run' },
  'Simulator': { emoji: '✈️', color: 'from-slate-500 to-zinc-500', description: 'Real-world sim' },
  'Horror': { emoji: '👻', color: 'from-gray-700 to-gray-900', description: 'Spine-chilling' },
  'Indie': { emoji: '💎', color: 'from-violet-500 to-purple-500', description: 'Hidden gems' },
  'MOBA': { emoji: '🏰', color: 'from-indigo-500 to-purple-600', description: 'Team battles' },
  'Music': { emoji: '🎵', color: 'from-pink-500 to-rose-500', description: 'Rhythm games' },
}

export function GamifiedQuiz(props: GamifiedQuizProps) {
  const [currentStep, setCurrentStep] = useState(1)

  // Calculate progress percentage
  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  // Step completion checks
  const isStep1Complete = props.selectedGames.length > 0
  const isStep2Complete = props.selectedGenres.length > 0
  const isStep3Complete = props.selectedKeywords.length > 0 || props.selectedThemes.length > 0
  const isStep4Complete = props.selectedPlatforms.length > 0

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Progress Bar */}
      <div className="max-w-2xl mx-auto px-2 sm:px-0">
        <div className="flex items-center justify-between mb-2 text-xs sm:text-sm">
          <span className="text-zinc-400">Your Progress</span>
          <span className="text-purple-400 font-semibold">{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-2 sm:h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-[#5d4af8] transition-all duration-500 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
        
        {/* Step indicators */}
        <div className="flex justify-center sm:justify-between mt-3 sm:mt-4">
          <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
            <div className={`flex items-center gap-1 sm:gap-2 ${currentStep >= 1 ? 'text-purple-400' : 'text-zinc-600'}`}>
              <div className={`w-5 h-5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all text-xs ${
                isStep1Complete ? 'bg-purple-500 border-purple-500' : currentStep === 1 ? 'border-purple-500' : 'border-zinc-700'
              }`}>
                {isStep1Complete ? '✓' : '1'}
              </div>
              <span className="text-xs font-medium hidden sm:inline">Games</span>
            </div>
            <div className={`flex items-center gap-1 sm:gap-2 ${currentStep >= 2 ? 'text-purple-400' : 'text-zinc-600'}`}>
              <div className={`w-5 h-5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all text-xs ${
                isStep2Complete ? 'bg-purple-500 border-purple-500' : currentStep === 2 ? 'border-purple-500' : 'border-zinc-700'
              }`}>
                {isStep2Complete ? '✓' : '2'}
              </div>
              <span className="text-xs font-medium hidden sm:inline">Genres</span>
            </div>
            <div className={`flex items-center gap-1 sm:gap-2 ${currentStep >= 3 ? 'text-purple-400' : 'text-zinc-600'}`}>
              <div className={`w-5 h-5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all text-xs ${
                isStep3Complete ? 'bg-purple-500 border-purple-500' : currentStep === 3 ? 'border-purple-500' : 'border-zinc-700'
              }`}>
                {isStep3Complete ? '✓' : '3'}
              </div>
              <span className="text-xs font-medium hidden sm:inline">Style</span>
            </div>
            <div className={`flex items-center gap-1 sm:gap-2 ${currentStep >= 4 ? 'text-purple-400' : 'text-zinc-600'}`}>
              <div className={`w-5 h-5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all text-xs ${
                isStep4Complete ? 'bg-purple-500 border-purple-500' : currentStep === 4 ? 'border-purple-500' : 'border-zinc-700'
              }`}>
                {isStep4Complete ? '✓' : '4'}
              </div>
              <span className="text-xs font-medium hidden sm:inline">Platform</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time feedback */}
      {props.matchingGamesCount !== null && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-emerald-500/30 animate-fade-in">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
            <p className="text-emerald-300 font-medium text-sm sm:text-base">
              ~{props.matchingGamesCount} games match your preferences
            </p>
          </div>
        </div>
      )}

      {/* Main Quiz Container */}
      <div className="relative max-w-[1600px] mx-auto overflow-visible rounded-xl border-2 border-sidebar-border shadow-lg shadow-[hsl(var(--sidebar-border))] bg-gradient-to-r from-transparent to-sidebar-accent/10 p-4 sm:p-6 md:p-8">{}
        
        {/* Step 1: Select Games */}
        {currentStep === 1 && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 bg-purple-500/20 px-3 sm:px-4 py-2 rounded-full mb-4">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                <span className="text-purple-300 font-medium text-sm sm:text-base">Step 1 of 4</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Which games do you love?
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base px-2">
                Search for games you've enjoyed. We'll use these to understand your taste.
              </p>
            </div>

            {/* Game Search */}
            <div className="relative max-w-2xl mx-auto search-container px-2 sm:px-0">
              <Search className="absolute left-6 sm:left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4 sm:h-5 sm:w-5 z-10" />
              <Input
                type="text"
                placeholder={props.selectedGames.length >= props.maxGames ? "Maximum games reached" : "Search for a game..."}
                value={props.searchInput}
                onChange={(e) => {
                  props.setSearchInput(e.target.value)
                }}
                onKeyDown={props.handleKeyPress}
                disabled={props.selectedGames.length >= props.maxGames}
                className="pl-10 sm:pl-12 pr-4 py-2 sm:py-3 text-base sm:text-lg bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              
              {/* Loading indicator */}
              {props.isSearching && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-purple-500"></div>
                </div>
              )}
              
              {/* Autocomplete suggestions - VISUAL */}
              {props.showSuggestions && props.searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg z-50 max-h-80 sm:max-h-96 overflow-y-auto">
                  <div className="p-2 space-y-2">
                    {props.searchSuggestions.map((game: any, index: number) => (
                      <button
                        key={game.id}
                        onClick={() => props.selectGameFromSuggestion(game)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                          index === props.selectedSuggestionIndex 
                            ? 'bg-purple-500 bg-opacity-20 border-2 border-purple-500 scale-105 shadow-lg' 
                            : 'hover:bg-zinc-700 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex-shrink-0 w-12 h-16 sm:w-16 sm:h-24 bg-zinc-700 rounded-lg overflow-hidden shadow-md">
                          {game.cover?.url ? (
                            <img
                              src={game.cover.url}
                              alt={game.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
                              ?
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-grow min-w-0">
                          <div className="font-semibold text-white text-sm sm:text-lg truncate">{game.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {game.rating && (
                              <span className="text-purple-400 text-xs sm:text-sm font-medium bg-purple-500/20 px-2 py-0.5 rounded">
                                {Math.round(game.rating)}/100
                              </span>
                            )}
                            {game.genres && game.genres.length > 0 && (
                              <span className="text-zinc-400 text-xs sm:text-sm truncate">
                                {game.genres.slice(0, 2).map((g: any) => g.name).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Games Display - VISUAL */}
            {props.selectedGames.length > 0 && (
              <div className="mt-6 sm:mt-8 px-2 sm:px-0">
                <p className="text-zinc-400 text-center mb-4 text-sm sm:text-base">Your Selected Games ({props.selectedGames.length}/{props.maxGames})</p>
                <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
                  {props.selectedGames.map((game: any) => (
                    <div
                      key={game.id}
                      className="relative group"
                    >
                      <div className="w-20 h-28 sm:w-24 sm:h-32 bg-zinc-800 rounded-lg overflow-hidden border-2 border-purple-500/50 hover:border-purple-500 transition-all shadow-lg hover:scale-105">
                        {game.cover?.url ? (
                          <img
                            src={game.cover.url}
                            alt={game.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-purple-400">
                            ?
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => props.removeGame(game.id)}
                        className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs sm:text-sm flex items-center justify-center shadow-lg transition-all hover:scale-110"
                      >
                        ×
                      </button>
                      <p className="text-xs text-zinc-400 text-center mt-2 max-w-[80px] sm:max-w-[96px] truncate">{game.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-center mt-6 sm:mt-8">
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={props.selectedGames.length === 0}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold disabled:opacity-50 text-sm sm:text-base"
              >
                Continue <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        )}
        {/* Step 2: Select Genres - VISUAL */}
        {currentStep === 2 && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 bg-purple-500/20 px-3 sm:px-4 py-2 rounded-full mb-4">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                <span className="text-purple-300 font-medium text-sm sm:text-base">Step 2 of 4</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                What genres do you enjoy?
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base px-2">
                Pick up to {props.maxGenres} genres. Choose what excites you!
              </p>
            </div>

            {/* VISUAL Genre Selection with Emojis */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto px-2 sm:px-0">
              {props.genres.filter(g => genreVisuals[g]).map((genre) => {
                const visual = genreVisuals[genre]
                const isSelected = props.selectedGenres.includes(genre)
                const isDisabled = !isSelected && props.selectedGenres.length >= props.maxGenres
                
                return (
                  <button
                    key={genre}
                    onClick={() => !isDisabled && props.onGenreToggle(genre)}
                    disabled={isDisabled}
                    className={`relative p-3 sm:p-6 rounded-2xl border-2 transition-all duration-200 ${
                      isSelected
                        ? `bg-gradient-to-br ${visual.color} border-white shadow-xl scale-105`
                        : isDisabled
                        ? "bg-zinc-800 border-zinc-700 opacity-40 cursor-not-allowed"
                        : "bg-zinc-800 border-zinc-700 hover:border-zinc-600 hover:scale-105"
                    }`}
                  >
                    <div className="text-3xl sm:text-5xl mb-2 sm:mb-3 filter drop-shadow-lg">{visual.emoji}</div>
                    <div className="font-semibold text-white mb-1 text-xs sm:text-sm">{genre}</div>
                    <div className="text-xs text-zinc-300">{visual.description}</div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-bold text-xs sm:text-sm">✓</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="text-center text-zinc-400 text-xs sm:text-sm mt-4">
              {props.selectedGenres.length}/{props.maxGenres} selected
            </div>

            {/* Navigation */}
            <div className="flex justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 px-2 sm:px-0">
              <Button
                onClick={() => setCurrentStep(1)}
                variant="outline"
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base"
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={props.selectedGenres.length === 0}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold disabled:opacity-50 text-sm sm:text-base"
              >
                Continue <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Keywords & Themes */}
        {currentStep === 3 && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 bg-purple-500/20 px-3 sm:px-4 py-2 rounded-full mb-4">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                <span className="text-purple-300 font-medium text-sm sm:text-base">Step 3 of 4</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                What's your play style?
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base px-2">
                Choose features and themes that appeal to you
              </p>
            </div>

            {/* Keywords */}
            <div className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 text-center">Game Features</h3>
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center max-w-4xl mx-auto px-2 sm:px-0">
                {props.keywords.map((keyword) => {
                  const isSelected = props.selectedKeywords.includes(keyword)
                  const isDisabled = !isSelected && props.selectedKeywords.length >= props.maxKeywords
                  
                  return (
                    <button
                      key={keyword}
                      onClick={() => !isDisabled && props.onKeywordToggle(keyword)}
                      disabled={isDisabled}
                      className={`px-3 sm:px-5 py-2 sm:py-3 rounded-full font-medium transition-all duration-200 text-sm sm:text-base ${
                        isSelected
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg scale-110"
                          : isDisabled
                          ? "bg-zinc-800 text-zinc-600 border border-zinc-700 opacity-40 cursor-not-allowed"
                          : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-600 hover:scale-105"
                      }`}
                    >
                      {keyword}
                    </button>
                  )
                })}
              </div>
              <div className="text-center text-zinc-400 text-xs sm:text-sm mt-2 sm:mt-3">
                {props.selectedKeywords.length}/{props.maxKeywords} selected
              </div>
            </div>

            {/* Themes */}
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 text-center">Themes & Moods</h3>
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center max-w-4xl mx-auto px-2 sm:px-0">
                {props.themes.map((theme) => {
                  const isSelected = props.selectedThemes.includes(theme)
                  const isDisabled = !isSelected && props.selectedThemes.length >= props.maxThemes
                  
                  return (
                    <button
                      key={theme}
                      onClick={() => !isDisabled && props.onThemeToggle(theme)}
                      disabled={isDisabled}
                      className={`px-3 sm:px-5 py-2 sm:py-3 rounded-full font-medium transition-all duration-200 text-sm sm:text-base ${
                        isSelected
                          ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg scale-110"
                          : isDisabled
                          ? "bg-zinc-800 text-zinc-600 border border-zinc-700 opacity-40 cursor-not-allowed"
                          : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-600 hover:scale-105"
                      }`}
                    >
                      {theme}
                    </button>
                  )
                })}
              </div>
              <div className="text-center text-zinc-400 text-xs sm:text-sm mt-2 sm:mt-3">
                {props.selectedThemes.length}/{props.maxThemes} selected
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 px-2 sm:px-0">
              <Button
                onClick={() => setCurrentStep(2)}
                variant="outline"
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base"
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                disabled={props.selectedKeywords.length === 0 && props.selectedThemes.length === 0}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold disabled:opacity-50 text-sm sm:text-base"
              >
                Continue <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Platform Selection */}
        {currentStep === 4 && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 bg-purple-500/20 px-3 sm:px-4 py-2 rounded-full mb-4">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                <span className="text-purple-300 font-medium text-sm sm:text-base">Step 4 of 4</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Where do you play?
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base px-2">
                Select your gaming platforms (optional)
              </p>
            </div>

            {/* Platform Selection */}
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center max-w-4xl mx-auto px-2 sm:px-0">
              {props.platforms.map((platform) => {
                const isSelected = props.selectedPlatforms.includes(platform)
                const isDisabled = !isSelected && props.selectedPlatforms.length >= props.maxPlatforms
                
                return (
                  <button
                    key={platform}
                    onClick={() => !isDisabled && props.onPlatformToggle(platform)}
                    disabled={isDisabled}
                    className={`px-3 sm:px-5 py-2 sm:py-3 rounded-full font-medium transition-all duration-200 text-sm sm:text-base ${
                      isSelected
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-110"
                        : isDisabled
                        ? "bg-zinc-800 text-zinc-600 border border-zinc-700 opacity-40 cursor-not-allowed"
                        : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-600 hover:scale-105"
                    }`}
                  >
                    {platform}
                  </button>
                )
              })}
            </div>
            <div className="text-center text-zinc-400 text-xs sm:text-sm mt-2 sm:mt-3">
              {props.selectedPlatforms.length}/{props.maxPlatforms} selected
            </div>

            {/* Final CTA */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-4 sm:p-8 border border-purple-500/30 mt-6 sm:mt-8 mx-2 sm:mx-0">
              <div className="text-center">
                <Sparkles className="h-8 w-8 sm:h-12 sm:w-12 text-purple-400 mx-auto mb-3 sm:mb-4 animate-pulse" />
                <h3 className="text-lg sm:text-2xl font-bold text-white mb-2">Ready to discover your perfect games?</h3>
                <p className="text-zinc-300 mb-4 sm:mb-6 text-sm sm:text-base px-2">We've learned your preferences. Time to find your next favorite!</p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                  <Button
                    onClick={() => setCurrentStep(3)}
                    variant="outline"
                    className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={props.onGetRecommendations}
                    disabled={props.loading}
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50"
                  >
                    {props.loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                        <span className="text-sm sm:text-base">Analyzing...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-sm sm:text-base">Get My Recommendations!</span>
                      </span>
                    )}
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
