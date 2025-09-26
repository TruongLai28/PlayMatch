import { NextRequest, NextResponse } from 'next/server'
import { igdbClient } from '../../../lib/igdb'
import { supabase } from '../../../lib/supabase'

/**
 * @swagger
 * /api/sync-popular:
 *   post:
 *     tags:
 *       - Database Sync
 *     summary: Sync popular & relevant released games from IGDB to Supabase
 *     description: Fetches only popular, relevant, already released games based on Played list from IGDB and inserts them into the Supabase games table
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Number of popular games to sync (default 5, max 50)
 *     responses:
 *       200:
 *         description: Popular games synced successfully
 *       500:
 *         description: Sync failed
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    
    const limit = parseInt(searchParams.get("limit") || "5")
    const validatedLimit = Math.min(Math.max(limit, 1), 50) 

    //offset for rotation if left 0 then it will get top 5 pop games then offset 5 will be the next 5 pop games
    const offset = parseInt(searchParams.get("offset") || "0")

    // get popular released games from IGDB
    const igdbPopularGames = await igdbClient.getPopularReleasedGames(validatedLimit, offset)

    if (!igdbPopularGames || igdbPopularGames.length === 0) {
      return NextResponse.json({ error: "No popular games fetched from IGDB" }, { status: 400 })
    }

    // Transform IGDB data to match our database schema
    const popularGamesToInsert = igdbPopularGames.map((game: any) => ({
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
      screenshots: game.screenshots || null,
    }))

    // Insert into Supabase
    const { data, error } = await supabase
      .from("games")
      .upsert(popularGamesToInsert, {
        onConflict: "id",
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      console.error("Supabase insert error:", error)
      return NextResponse.json(
        { error: "Failed to insert popular games into database", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Successfully synced ${popularGamesToInsert.length} popular games`,
      inserted: data?.length || 0,
      games: data?.map((game) => ({ id: game.id, name: game.name })) || [],
    })
  } catch (error) {
    console.error("Popular sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync popular games", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
