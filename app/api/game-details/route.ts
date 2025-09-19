import { NextRequest, NextResponse } from 'next/server'
import { igdbClient } from '../../../lib/igdb'

//200 = success
//400 = bad request
//404 = not found
//500 = server error 


// feel free to add more endpoints that can help with the recommendation engine.

/**
 * @swagger
 * /api/game-details:
 *   post:
 *     summary: get detailed game info by name or ID
 *     description: grabs genre, platforms, developers, description, game modes, themes, series, and keywords for a given game. do id to get the right game bc searching by name suckkkkkks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameName:
 *                 type: string
 *                 description: name of the game
 *               gameId:
 *                 type: number
 *                 description: ID of the game
 *     responses:
 *       200:
 *         description: yeah it works
 *       400:
 *         description: bad request (missing gameName/gameId)
 *       404:
 *         description: game not found
 *       500:
 *         description: Server error
 */
export async function POST(req: NextRequest) {
  try {
    const { gameName, gameId } = await req.json()

    if (!gameName && !gameId) {
      return NextResponse.json({ error: 'Please put gameName or gameId' }, { status: 400 })
    }

    let id = gameId

    if (!id && gameName) {
      const searchBody = `search "${gameName}"; fields id; limit 1;`
      const searchResults = await igdbClient.apiRequest('games', searchBody)

      if (!searchResults || !searchResults.length) {
        return NextResponse.json({ error: 'ggame not found' }, { status: 404 })
      }

      id = searchResults[0].id
    }

    const detailsBody = `
      fields
        name,
        summary,
        genres.name,
        platforms.name,
        involved_companies.company.name,
        game_modes.name,
        themes.name,
        collection.name,
        keywords.name;
      where id = ${id};
      limit 1;
    `
    const gameDetails = await igdbClient.apiRequest('games', detailsBody)

    if (!gameDetails || !gameDetails.length) {
      return NextResponse.json({ error: 'game details not found' }, { status: 404 })
    }

    return NextResponse.json(gameDetails[0])
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'failed to fetch game details' }, { status: 500 })
  }
}
