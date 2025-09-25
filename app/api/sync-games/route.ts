import { NextRequest, NextResponse } from 'next/server'
import { igdbClient } from '../../../lib/igdb'
import { supabase } from '../../../lib/supabase'

/**
 * @swagger
 * /api/sync-games:
 *   post:
 *     tags:
 *       - Database Sync
 *     summary: Sync games from IGDB to Supabase
 *     description: Fetches games from IGDB and inserts them into the Supabase games table
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Number of games to sync (default 10, max 50)
 *     responses:
 *       200:
 *         description: Games synced successfully
 *       500:
 *         description: Sync failed
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const validatedLimit = Math.min(Math.max(limit, 1), 50)

    // Fetch games from IGDB
    const igdbGames = await igdbClient.getAllGames(validatedLimit, 0)
    
    if (!igdbGames || igdbGames.length === 0) {
      return NextResponse.json({ error: 'No games fetched from IGDB' }, { status: 400 })
    }

    // Transform IGDB data to match our database schema
    const gamesToInsert = igdbGames.map((game: any) => ({
      id: game.id,
      name: game.name,
      summary: game.summary || null,
      rating: game.rating || null,
      cover_url: game.cover?.url ? `https:${game.cover.url}` : null,
      first_release_date: game.first_release_date || null,
      genres: game.genres || null,
      platforms: game.platforms || null,
      themes: game.themes || null,
      keywords: game.keywords || null,
      game_modes: game.game_modes || null,
      player_perspectives: game.player_perspectives || null,
      age_ratings: game.age_ratings || null,
      companies: game.involved_companies || null,
      similar_games: game.similar_games || null,
      screenshots: game.screenshots || null
    }))

    // Insert into Supabase using upsert to handle duplicates
    const { data, error } = await supabase
      .from('games')
      .upsert(gamesToInsert, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ 
        error: 'Failed to insert games into database',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `Successfully synced ${gamesToInsert.length} games`,
      inserted: data?.length || 0,
      games: data?.map(game => ({ id: game.id, name: game.name })) || []
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ 
      error: 'Failed to sync games',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * @swagger
 * /api/sync-games:
 *   get:
 *     tags:
 *       - Database Sync
 *     summary: Check games in database
 *     description: Returns count of games currently in the database
 *     responses:
 *       200:
 *         description: Games count returned
 */
export async function GET() {
  try {
    const { count, error } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to count games',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `Database currently has ${count} games`,
      count
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}