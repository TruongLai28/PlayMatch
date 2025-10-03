import { NextRequest, NextResponse } from 'next/server'
import { igdbClient } from '../../../lib/igdb'
import { supabase } from '../../../lib/supabase'
import { request } from 'http'

/**
 * @swagger
 * /api/sync-games:
 *   post:
 *     tags:
 *       - Database Sync
 *     summary: Sync top popular games from IGDB to Supabase
 *     description: Fetches the most popular/highly-rated games from IGDB and inserts them into the Supabase games table
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Number of games to sync (default 50, max 500)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 *         description: Offset for pagination (default 0)
 *     responses:
 *       200:
 *         description: Games synced successfully
 *       500:
 *         description: Sync failed
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const validatedLimit = Math.min(Math.max(limit, 1), 500)

    const igdbGames = await igdbClient.getPopularReleasedGames(validatedLimit, offset)
    
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
      message: `Successfully synced ${gamesToInsert.length} popular games`,
      inserted: data?.length || 0,
      games: data?.map(game => ({ id: game.id, name: game.name, rating: game.rating })) || [],
      tip: `To sync more games, use offset parameter. Example: offset=${offset + validatedLimit}`
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
      count,
      tip: 'Target: 10,000 games for recommendation engine'
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * @swagger
 * /api/sync-games:
 *   delete:
 *     tags:
 *       - Database Sync
 *     summary: Clear all games from database (TESTING ONLY)
 *     description: Deletes all games from the Supabase games table. Use with caution!
 *     parameters:
 *       - in: query
 *         name: confirm
 *         schema:
 *           type: string
 *         description: Must be set to "yes" to confirm deletion
 *         required: true
 *     responses:
 *       200:
 *         description: All games deleted successfully
 *       400:
 *         description: Confirmation required
 *       500:
 *         description: Deletion failed
 */
export async function DELETE(request: NextRequest){
  try {
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm');

    if (confirm !== 'yes') {
      return NextResponse.json({ 
        error: 'Confirmation required',
        message: 'Add ?confirm=yes to the URL to confirm deletion of all games'
      }, { status: 400 })
    }
    const { error } = await supabase
      .from('games')
      .delete()
      .neq('id', 0) // This matches all rows (id is never 0)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ 
        error: 'Failed to delete games from database',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Successfully deleted all games from database',
      warning: 'Database is now empty. Use POST to sync games again.'
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete games',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}