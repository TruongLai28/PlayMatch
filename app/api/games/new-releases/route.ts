// File: app/api/games/new-releases/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { igdbClient } from '../../../../lib/igdb'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('New Releases API: Attempting to fetch from database first...')
    
    // Try to get new releases from database first
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    
    const { data: dbGames, error } = await supabase
      .from('games')
      .select('*')
      .gte('first_release_date', Math.floor(oneYearAgo.getTime() / 1000))
      .order('first_release_date', { ascending: false })
      .limit(12)
    
    let games
    
    if (!error && dbGames && dbGames.length > 0) {
      console.log('New Releases API: Found', dbGames.length, 'games in database')
      games = dbGames.map(game => ({
        ...game,
        cover: game.cover_url ? { url: game.cover_url } : undefined
      }))
    } else {
      console.log('New Releases API: Database returned no results or error, falling back to IGDB...')
      
      // Fallback to IGDB API
      try {
        games = await igdbClient.getNewReleases()
        
        // If IGDB also returns no results, use subset of popular games
        if (!games || games.length === 0) {
          console.log('New Releases API: IGDB also returned no results, using popular games subset...')
          
          const { data: popularGames } = await supabase
            .from('games')
            .select('*')
            .order('rating', { ascending: false })
            .range(5, 16) // Get games 6-17 from popular list
          
          games = popularGames?.map(game => ({
            ...game,
            cover: game.cover_url ? { url: game.cover_url } : undefined
          })) || []
        }
      } catch (igdbError) {
        console.error('IGDB API error:', igdbError)
        
        // Final fallback: return subset of popular games
        const { data: popularGames } = await supabase
          .from('games')
          .select('*')
          .order('rating', { ascending: false })
          .range(5, 16)
        
        games = popularGames?.map(game => ({
          ...game,
          cover: game.cover_url ? { url: game.cover_url } : undefined
        })) || []
      }
    }
    
    console.log('New Releases API: Returning', games.length, 'games')
    return NextResponse.json(games)
  } catch (error) {
    console.error('Error fetching new releases:', error)
    
    // Final fallback: return subset of popular games
    try {
      const { data: fallbackGames } = await supabase
        .from('games')
        .select('*')
        .order('rating', { ascending: false })
        .range(5, 16)
      
      const transformedGames = fallbackGames?.map(game => ({
        ...game,
        cover: game.cover_url ? { url: game.cover_url } : undefined
      })) || []
      
      return NextResponse.json(transformedGames)
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
      return NextResponse.json({ error: 'Failed to fetch new releases' }, { status: 500 })
    }
  }
}
