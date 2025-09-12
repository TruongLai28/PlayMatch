import { NextRequest, NextResponse } from 'next/server'
import { igdbClient } from '../../../lib/igdb'

//400 = bad request
//404 = not found
//500 = server error 

export async function POST(req: NextRequest) {
  try {
    const { gameName } = await req.json()
    if (!gameName) {
      return NextResponse.json({ error: 'type a game name' }, { status: 400 })
    }

    // get genre of game 
    const body = `search "${gameName}"; fields genres; limit 1;`
    const games = await igdbClient.apiRequest('games', body)
    if (!games || !games[0]?.genres?.length) {
      return NextResponse.json({ error: 'Um no game with that name exits?' }, { status: 404 })
    }

    const genreId = games[0].genres[0]

    // get 5 games of same genre
    const recBody = `fields name,total_rating; where genres = (${genreId}) & version_parent = null; sort total_rating desc; limit 5;`
    const candidates = await igdbClient.apiRequest('games', recBody)


    return NextResponse.json({ genre: genreId, candidates })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'ffailed to generate list' }, { status: 500 })
  }
}
