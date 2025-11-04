import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { igdbClient } from '../../../lib/igdb'
import { normalize, cleanSearchQuery, Game } from '../../../lib/search-query'
import { filterByGenre } from '../../../lib/filterByGenre'

/**
 * @swagger
 * /api/new-search-game:
 *   get:
 *     tags:
 *       - Search
 *     summary: Search games from Supabase and IGDB (rated only)
 *     description: >
 *       Searches the local Supabase database first. If fewer than 500 games are found, falls back
 *       to IGDB to fetch up to 500 rated games. Supports optional genre filtering by ID.
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Game name to search for
 *       - in: query
 *         name: genre_id
 *         schema:
 *           type: array
 *           items:
 *             type: integer
 *             enum: [2, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 24, 25, 26, 30, 31, 32, 33, 34, 35, 36]
 *           default: []
 *         style: form
 *         explode: true
 *         required: false
         description: >
           Filter by genre ID (can select multiple with ctrl + left click).  
           Point-and-click:2, Fighting:4, Shooter:5, Music:7, Platform:8, Puzzle:9, Racing:10, Real Time Strategy (RTS):11, Role-playing (RPG):12, Simulator:13, Sport:14, Strategy:15, Turn-based Strategy (TBS):16, Tactical:24, Hack & slash/Beat 'em up:25, Quiz/Trivia:26, Pinball:30, Adventure:31, Indie:32, Arcade:33, Visual Novel:34, Card & Board Game:35, MOBA:36
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Missing query parameter "q"
 *       500:
 *         description: Failed to fetch games
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const genreParam = searchParams.getAll('genre_id') || []
    const genreIds = genreParam.map((g) => Number(g.trim())).filter(Boolean)

    if (!query) {
      return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 })
    }

    console.log(`Query: ${query}`)
    console.log(`Genre IDs: ${genreIds.join(', ') || '(none)'}`)

    const queryNormalized = normalize(query)

    // --- Supabase search ---
    let localResults: Game[] = []
    try {
      const broadQuery = query.slice(0, 3)
      const { data, error } = await supabase
        .from('games')
        .select('id, name, summary, cover_url, first_release_date, genres, platforms')
        .ilike('name', `%${broadQuery}%`)

      if (error) throw error

      const parsed = (data || []).map((g) => ({
        ...g,
        genres:
          typeof g.genres === 'string'
            ? JSON.parse(g.genres)
            : Array.isArray(g.genres)
            ? g.genres
            : [],
        platforms:
          typeof g.platforms === 'string'
            ? JSON.parse(g.platforms)
            : Array.isArray(g.platforms)
            ? g.platforms
            : [],
      }))

      localResults = parsed.filter((g) => normalize(g.name).includes(queryNormalized))
      const { filteredGames, logString } = filterByGenre(localResults, genreIds)
      localResults = filteredGames

      console.log('[Supabase Game Names]:', localResults.map((g) => g.name))
      console.log(`[Supabase Results] (${localResults.length} found)`)
      console.log(`Genre Filter: ${logString}`)
    } catch (e) {
      console.error('Supabase query failed:', e)
    }

    // --- IGDB fallback ---
    let igdbResults: Game[] = []
    if (localResults.length < 500) {
      console.log('Falling back to IGDB')
      try {
        const igdbQuery = cleanSearchQuery(query).split(' ').slice(0, 5).join(' ')
        if (igdbQuery.length > 0) {
          const igdbRaw: any[] = await igdbClient.searchGames(igdbQuery)
          console.log('[IGDB Raw Game Names]:', igdbRaw.map((g) => g.name))

          igdbResults = igdbRaw.map((g: any) => ({
            id: g.id,
            name: g.name,
            summary: g.summary,
            cover_url: g.cover?.url || undefined,
            first_release_date: g.first_release_date
              ? new Date(g.first_release_date * 1000).toISOString().split('T')[0]
              : undefined,
            genres: g.genres?.map((x: any) => ({ id: x.id, name: x.name })) || [],
            platforms: g.platforms?.map((x: any) => ({ id: x.id, name: x.name })) || [],
          }))

          const { filteredGames, logString } = filterByGenre(igdbResults, genreIds)
          igdbResults = filteredGames

          console.log('[IGDB Processed Game Names]:', igdbResults.map((g) => g.name))
          console.log(`[IGDB Results] (${igdbResults.length} found)`)
          console.log(`Genre Filter: ${logString}`)
        }
      } catch (e) {
        console.error('IGDB request failed:', e)
      }
    }

    // --- Combine & deduplicate ---
    const seen = new Set<string>()
    const combined = [...localResults, ...igdbResults].filter((g) => {
      const key = g.name?.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    console.log('[Combined Game Names]:', combined.map((g) => g.name))
    console.log(`Combined Results: ${combined.length} games`)

    return NextResponse.json({
      results: combined.map((g) => ({
        id: g.id,
        name: g.name,
        summary: g.summary,
        cover_url: g.cover_url,
        release_date: g.first_release_date,
        genres: g.genres,
        platforms: g.platforms,
      })),
      total: combined.length,
    })
  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}
