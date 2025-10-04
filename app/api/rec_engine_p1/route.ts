import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { igdbClient } from '../../../lib/igdb'

/**
 * @swagger
 * /api/rec_engine_p1:
 *   post:
 *     tags:
 *       - Recommendation
 *     summary:(UNDER CONSTRUCTION) Get top games per genre from DB + IGDB
 *     description: For each genre of the seed game, fetch top 10 DB games and top 10 IGDB games.
 *     parameters:
 *       - in: query
 *         name: seedGameId
 *         schema:
 *           type: number
 *         required: true
 *         description: ID of the seed game
 *     responses:
 *       200:
 *         description: Recommendation Pool fetched successfully
 *       400:
 *         description: Missing seedGameId
 *       404:
 *         description: Seed game not found
 *       500:
 *         description: Failed to fetch recommendations, DAMN
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const seedGameId = parseInt(searchParams.get('seedGameId') || '')
    if (!seedGameId) return NextResponse.json({ error: 'seedGameId required' }, { status: 400 })

    console.log('Incoming seedGameId:', seedGameId)

    //fetch seed game DB
    let { data: seedGame } = await supabase
      .from('games')
      .select('*')
      .eq('id', seedGameId)
      .single()

    if (!seedGame) {
      //fallback to IGDB
      const igdbSeedBody = `
        fields id,name,genres.id,genres.name,rating,cover.url;
        where id = ${seedGameId};
        limit 1;
      `
      const igdbResult = await igdbClient.apiRequest('games', igdbSeedBody)
      if (!igdbResult?.length) return NextResponse.json({ error: 'Seed game not found' }, { status: 404 })
      seedGame = igdbResult[0]
      console.log('Seed game fetched from IGDB:', seedGame.name)
    } else {
      console.log('Seed game found in DB:', seedGame.name)
    }

    const genres = seedGame.genres || []
    if (!genres.length) return NextResponse.json({ error: 'Seed game has no genres' }, { status: 404 })
    console.log('Seed game genres:', genres.map((g: any) => g.name))

    //maps for removing dups
    const dbResultsMap: Record<number, any> = {}
    const igdbResultsMap: Record<number, any> = {}

    for (const genre of genres) {
      console.log(`Fetching top DB games for genre ID: ${genre.id}`)

      //db top 10 per genre
      let { data: dbGames, error: dbError } = await supabase
        .from('games')
        .select('*')
        .neq('id', seedGameId)
        .filter('genres', 'cs', JSON.stringify([{ id: genre.id }]))
        .order('rating', { ascending: false })
        .limit(10)

      if (dbError) console.error('Supabase error:', dbError)
      dbGames = dbGames || []
      dbGames.forEach((g: any) => { if (!dbResultsMap[g.id]) dbResultsMap[g.id] = g })

      console.log(
        `DB games for genre ${genre.id}:`,
        JSON.stringify(dbGames.map((g: any) => ({ id: g.id, name: g.name, rating: g.rating })), null, 2)
      )

      //IGDB top 10 per genre, excluding DB games already fetched
      const dbIds = new Set(Object.keys(dbResultsMap).map(id => parseInt(id)))
      const igdbBody = `
        fields id,name,genres.id,genres.name,rating,total_rating,cover.url;
        where genres = (${genre.id}) & id != ${seedGameId} ${dbIds.size ? `& id != (${[...dbIds].join(',')})` : ''};
        sort total_rating desc;
        limit 10;
      `
      const igdbGames = await igdbClient.apiRequest('games', igdbBody)
      if (igdbGames?.length) {
        igdbGames.forEach((g: any) => { if (!igdbResultsMap[g.id]) igdbResultsMap[g.id] = g })

        console.log(
          `IGDB games for genre ${genre.id}:`,
          JSON.stringify(igdbGames.map((g: any) => ({ id: g.id, name: g.name, total_rating: g.total_rating })), null, 2)
        )
      }
    }

    const dbResultsFinal = Object.values(dbResultsMap)
    const igdbResultsFinal = Object.values(igdbResultsMap)

    console.log(
      'Total DB recommended games:',
      JSON.stringify(dbResultsFinal.map(g => ({ id: g.id, name: g.name, rating: g.rating })), null, 2)
    )
    console.log(
      'Total IGDB recommended games:',
      JSON.stringify(igdbResultsFinal.map(g => ({ id: g.id, name: g.name, total_rating: g.total_rating })), null, 2)
    )

    return NextResponse.json({
      seed: seedGame,
      dbPool: dbResultsFinal,
      igdbPool: igdbResultsFinal
    })
  } catch (err) {
    console.error('Error fetching recommendation pool:', err)
    return NextResponse.json({ error: 'Failed to fetch recommendation pool' }, { status: 500 })
  }
}
