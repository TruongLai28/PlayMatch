import { NextRequest, NextResponse } from 'next/server'
import { igdbClient } from '../../../lib/igdb'

/**
 * @swagger
 * /api/search-games:
 *   get:
 *     description: Search games from IGDB
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Game search query
 *     responses:
 *       200:
 *         description: Successful response
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' })
    }

    const games = await igdbClient.searchGames(query)
    return NextResponse.json(games)

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}