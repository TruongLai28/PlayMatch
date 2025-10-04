import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { igdbClient } from '../../../../lib/igdb'

/**
 * @swagger
 * /api/games/search:
 *   get:
 *     tags:
 *       - Games
 *     summary: Search for games by name
 *     description: Search for games by name in both Supabase and IGDB
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Game name to search for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Maximum number of results (default 10)
 *     responses:
 *       200:
 *         description: Search results from both databases
 *       400:
 *         description: Missing search query
 *       500:
 *         description: Search failed
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 })
    }

    console.log(`Searching for games with name: "${query}"`)

    // Search in Supabase first
    const { data: supabaseGames, error: supabaseError } = await supabase
      .from('games')
      .select('id, name, rating, genres, summary')
      .ilike('name', `%${query}%`)
      .order('rating', { ascending: false })
      .limit(limit)

    if (supabaseError) {
      console.error('Supabase search error:', supabaseError)
    }

    // Search in IGDB
    let igdbGames: any[] = []
    try {
      const igdbQuery = `
        fields id,name,genres.id,genres.name,rating,total_rating,cover.url,summary;
        search "${query}";
        where rating > 50 & category = 0;
        limit ${limit};
      `
      igdbGames = await igdbClient.apiRequest('games', igdbQuery) || []
    } catch (igdbError) {
      console.error('IGDB search error:', igdbError)
    }

    // Combine and deduplicate results
    const combinedResults = []
    const seenIds = new Set()

    // Add Supabase results first (they might be more accurate)
    if (supabaseGames) {
      for (const game of supabaseGames) {
        if (!seenIds.has(game.id)) {
          combinedResults.push({
            ...game,
            source: 'database',
            cover: null // Supabase games don't have covers
          })
          seenIds.add(game.id)
        }
      }
    }

    // Add IGDB results
    if (igdbGames) {
      for (const game of igdbGames) {
        if (!seenIds.has(game.id)) {
          combinedResults.push({
            ...game,
            source: 'igdb'
          })
          seenIds.add(game.id)
        }
      }
    }

    console.log(`Found ${combinedResults.length} games matching "${query}"`)

    return NextResponse.json({
      query,
      results: combinedResults,
      total: combinedResults.length
    })

  } catch (err) {
    console.error('Game search error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}