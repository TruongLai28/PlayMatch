import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { igdbClient } from '../../../../lib/igdb'

/**
 * @swagger
 * /api/games/search:
 *   get:
 *     tags:
 *       - Games
 *     summary: Get game by seed ID
 *     description: Retrieve a specific game by seed ID from both Supabase and IGDB
 *     parameters:
 *       - in: query
 *         name: seedId
 *         schema:
 *           type: number
 *         required: true
 *         description: Specific game ID to retrieve
 *     responses:
 *       200:
 *         description: Game data retrieved successfully
 *       400:
 *         description: Missing seed ID
 *       404:
 *         description: Game not found
 *       500:
 *         description: Search failed
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const seedId = parseInt(searchParams.get('seedId') || '')

    if (!seedId) {
      return NextResponse.json({ error: 'seedId is required' }, { status: 400 })
    }

    console.log(`Getting game by seed ID: ${seedId}`)
    
    // Try Supabase first
    let { data: supabaseGame, error: supabaseError } = await supabase
      .from('games')
      .select('id, name, rating, genres, summary, companies, cover_url')
      .eq('id', seedId)
      .single()

    let seedGame: any = null

    // If not found in Supabase, try IGDB
    if (!supabaseGame) {
      try {
        const igdbQuery = `
          fields id,name,genres.id,genres.name,rating,total_rating,cover.url,summary,involved_companies.company.id,involved_companies.company.name;
          where id = ${seedId};
          limit 1;
        `
        const igdbResult = await igdbClient.apiRequest('games', igdbQuery)
        
        if (igdbResult?.length) {
          seedGame = {
            ...igdbResult[0],
            source: 'igdb'
          }
        }
      } catch (igdbError) {
        console.error('IGDB seed search error:', igdbError)
      }
    } else {
      seedGame = {
        ...supabaseGame,
        source: 'database',
        // Transform cover_url to cover.url format to match IGDB structure
        cover: supabaseGame.cover_url ? { url: supabaseGame.cover_url } : null
      }
    }

    if (!seedGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    return NextResponse.json({
      seedId,
      results: [seedGame],
      total: 1,
      isSeedSearch: true
    })

  } catch (err) {
    console.error('Game search error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}