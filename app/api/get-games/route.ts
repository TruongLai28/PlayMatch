import { NextRequest, NextResponse } from 'next/server'
import { igdbClient } from '../../../lib/igdb'

/**
 * @swagger
 * /api/get-data:
 *   get:
 *     description: Fetch all games from IGDB
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Number of games to fetch (default 50, max 500)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 *         description: Offset for pagination (default 0)
 *     responses:
 *       200:
 *         description: Successful response
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate limit to prevent excessive requests
    const validatedLimit = Math.min(Math.max(limit, 1), 500)

    const games = await igdbClient.getAllGames(validatedLimit, offset)
    return NextResponse.json(games)

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}