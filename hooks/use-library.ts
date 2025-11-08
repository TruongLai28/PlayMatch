import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'

export interface AddToLibraryParams {
  gameId: number
  status: 'backlog' | 'playing' | 'completed' | 'dropped' // Make status required
  hoursPlayed?: number
}

export interface LibraryEntry {
  id: number
  gameId: number
  status: 'backlog' | 'playing' | 'completed' | 'dropped'
  hoursPlayed: number
  addedAt: string
  updatedAt: string
  game: {
    id: number
    name: string
    summary?: string
    rating?: number
    coverUrl?: string
    genres: string[]
    platforms: string[]
  }
}

export function useLibrary() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [library, setLibrary] = useState<LibraryEntry[]>([])
  const [libraryLoaded, setLibraryLoaded] = useState(false)

  // Fetch user's library
  const fetchLibrary = useCallback(async () => {
    if (!user) {
      setLibrary([])
      setLibraryLoaded(true)
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/db/user-library', {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch library')
      }

      const data = await response.json()
      setLibrary(data.library || [])
      setLibraryLoaded(true)
    } catch (error) {
      console.error('Error fetching library:', error)
      setLibrary([])
      setLibraryLoaded(true)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Check if a game is in the library and return its status
  const getGameStatus = useCallback((gameId: number) => {
    const entry = library.find(item => item.gameId === gameId)
    return entry?.status || null
  }, [library])

  // Load library when user changes
  useEffect(() => {
    setLibraryLoaded(false)
    fetchLibrary()
  }, [fetchLibrary])

  const addToLibrary = useCallback(async (params: AddToLibraryParams) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    setIsLoading(true)
    try {
      const requestBody = {
        gameId: params.gameId,
        status: params.status, // Remove fallback - status should always be provided
        hoursPlayed: params.hoursPlayed || 0
      }

      const response = await fetch('/api/db/user-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add game to library')
      }

      const data = await response.json()
      
      // Update local library state
      await fetchLibrary()
      
      return data
    } catch (error) {
      console.error('Error adding to library:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const removeFromLibrary = useCallback(async (gameId: number) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    setIsLoading(true)
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
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove game from library')
      }

      const data = await response.json()
      
      // Update local library state
      await fetchLibrary()
      
      return data
    } catch (error) {
      console.error('Error removing from library:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Function to ensure game exists in database before adding to library
  const ensureGameInDatabase = useCallback(async (game: any) => {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync_game',
          gameId: game.id,
          gameData: {
            id: game.id,
            name: game.name,
            summary: game.summary || null,
            rating: game.rating || game.total_rating || null,
            cover_url: game.cover?.url || game.cover_url || null,
            genres: game.genres ? game.genres.map((g: any) => g.name) : [],
            platforms: game.platforms ? game.platforms.map((p: any) => p.name) : [],
            release_date: game.first_release_date 
              ? new Date(game.first_release_date * 1000).toISOString().split('T')[0]
              : null
          }
        })
      })

      if (!response.ok) {
        console.warn('Failed to sync game to database, but continuing with library add')
      }

      return true
    } catch (error) {
      console.warn('Error syncing game to database:', error)
      return false
    }
  }, [])

  const addGameToLibrary = useCallback(async (game: any, status: 'backlog' | 'playing' | 'completed' | 'dropped', hoursPlayed: number = 0) => {
    try {
      // Try to ensure the game exists in our database
      try {
        await ensureGameInDatabase(game)
      } catch (syncError) {
        console.warn('Failed to sync game to database, but continuing with library add using status:', status)
        // Continue even if sync fails - we'll try to add to library anyway
      }
      
      // Add to user's library with the correct status
      const result = await addToLibrary({
        gameId: game.id,
        status, // Use the status from the dropdown selection
        hoursPlayed
      })

      return result
    } catch (error) {
      // If the library add also fails due to missing game, throw a more specific error
      if (error instanceof Error && error.message.includes('Game not found in database')) {
        throw new Error(`Cannot add game "${game.name}" to library. Game sync failed and game doesn't exist in database.`)
      }
      throw error
    }
  }, [ensureGameInDatabase, addToLibrary])

  return {
    addToLibrary,
    addGameToLibrary,
    removeFromLibrary,
    fetchLibrary,
    getGameStatus,
    library,
    libraryLoaded,
    isLoading
  }
}