import { NextRequest, NextResponse } from 'next/server'
import { igdbClient } from '../../../../lib/igdb'

/**
 * @swagger
 * /api/games/details:
 *   get:
 *     tags:
 *       - Games
 *     summary: Get detailed game information including screenshots
 *     description: Fetches comprehensive game details including screenshots from IGDB API
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: IGDB Game ID
 *     responses:
 *       200:
 *         description: Game details retrieved successfully
 *       400:
 *         description: Missing or invalid game ID
 *       404:
 *         description: Game not found
 *       500:
 *         description: Failed to fetch game details
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('id')

    if (!gameId || isNaN(Number(gameId))) {
      return NextResponse.json({ error: 'Valid game ID is required' }, { status: 400 })
    }

    const id = Number(gameId)

    // Fetch detailed game information including screenshots
    const token = await (igdbClient as any).getAccessToken()
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': process.env.IGDB_CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain'
      },
      body: `
        fields name, cover.url, summary, rating, total_rating, genres.name, platforms.name, 
               release_dates.date, screenshots.url, videos.video_id, themes.name, keywords.name,
               involved_companies.company.name, involved_companies.developer, involved_companies.publisher,
               similar_games.name, similar_games.cover.url;
        where id = ${id};
      `
    })

    if (!response.ok) {
      throw new Error(`IGDB API error: ${response.status}`)
    }

    const games = await response.json()
    
    if (!games || games.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const game = games[0]

    // Transform the data to match our expected format
    const gameDetails = {
      id: game.id,
      name: game.name,
      cover: game.cover ? { url: game.cover.url } : undefined,
      summary: game.summary,
      rating: game.rating,
      total_rating: game.total_rating,
      genres: game.genres || [],
      platforms: game.platforms || [],
      themes: game.themes || [],
      keywords: game.keywords || [],
      screenshots: game.screenshots?.map((screenshot: any) => ({
        id: screenshot.id || Math.random(),
        url: screenshot.url
      })) || [],
      videos: game.videos?.map((video: any) => ({
        id: video.id || Math.random(),
        video_id: video.video_id
      })) || [],
      companies: game.involved_companies?.map((ic: any) => ({
        id: ic.id || Math.random(),
        name: ic.company?.name || 'Unknown',
        developer: ic.developer || false,
        publisher: ic.publisher || false
      })) || [],
      similar_games: game.similar_games?.slice(0, 6).map((sg: any) => ({
        id: sg.id,
        name: sg.name,
        cover: sg.cover ? { url: sg.cover.url } : undefined
      })) || [],
      release_dates: game.release_dates?.map((rd: any) => ({
        date: rd.date
      })) || [],
      first_release_date: game.release_dates?.[0]?.date
    }

    return NextResponse.json(gameDetails)
  } catch (error) {
    console.error('Error fetching game details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game details' },
      { status: 500 }
    )
  }
}