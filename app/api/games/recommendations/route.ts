// File: app/api/games/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { igdbClient } from '../../../../lib/igdb'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('Recommendations API: Attempting to fetch from IGDB...')
    
    // Try to get recommendations from IGDB first
    let games = await igdbClient.getRecommendations()
    
    // If IGDB returns no results, fallback to database
    if (!games || games.length === 0) {
      console.log('Recommendations API: IGDB returned no results, falling back to database...')
      
      // Get a mix of high-rated games from different genres as recommendations
      const { data: dbGames, error } = await supabase
        .from('games')
        .select('*, screenshots')
        .gte('rating', 75)
        .order('rating', { ascending: false })
        .range(10, 21) // Get games 11-22 from the high-rated list (different from popular)
      
      if (error) {
        console.error('Database error:', error)
        // If database also fails, return a different subset of popular games
        const { data: popularGames } = await supabase
          .from('games')
          .select('*, screenshots')
          .order('rating', { ascending: false })
          .range(12, 23) // Get games 13-24 from popular list
        
        games = popularGames?.map(game => ({
          ...game,
          cover: game.cover_url ? { url: game.cover_url } : undefined,
          screenshots: typeof game.screenshots === 'string' ? JSON.parse(game.screenshots) : game.screenshots || []
        })) || []
      } else {
        games = dbGames?.map(game => ({
          ...game,
          cover: game.cover_url ? { url: game.cover_url } : undefined,
          screenshots: typeof game.screenshots === 'string' ? JSON.parse(game.screenshots) : game.screenshots || []
        })) || []
      }
    }
    
    console.log('Recommendations API: Returning', games.length, 'games')
    return NextResponse.json(games)
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    
    // Final fallback: return different subset of popular games
    try {
      const { data: fallbackGames } = await supabase
        .from('games')
        .select('*, screenshots')
        .order('rating', { ascending: false })
        .range(12, 23)
      
      const transformedGames = fallbackGames?.map(game => ({
        ...game,
        cover: game.cover_url ? { url: game.cover_url } : undefined,
        screenshots: typeof game.screenshots === 'string' ? JSON.parse(game.screenshots) : game.screenshots || []
      })) || []
      
      return NextResponse.json(transformedGames)
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
      return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
    }
  }
}
