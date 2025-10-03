import { NextRequest, NextResponse } from 'next/server'
import { igdbClient } from '../../../lib/igdb'
import { supabase } from '../../../lib/supabase'

/**
 * @swagger
 * /api/rec_engine_p1:
 *   post:
 *     tags:
 *       - Recommendation
 *     summary: UNDER CONSTRUCTION! Get a pool of games (<=20 DB + 20 IGDB)
 *     description: Returns 20 or less games from the database and 20 from IGDB outside of the database. Also returns along with JSON data but is very messy rn..
 *     parameters:
 *       - in: query
 *         name: GameId
 *         schema:
 *           type: number
 *         description: ID of the game to base recommendations on
 *     responses:
 *       200:
 *         description: Pool fetched successfully
 *       400:
 *         description: Missing GameId
 *       404:
 *         description: game not found
 *       500:
 *         description: Failed to fetch pool! DAMN!
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const seedGameId = parseInt(searchParams.get('seedGameId') || '')

    if (!seedGameId) return NextResponse.json({ error: 'seedGameId required' }, { status: 400 })

    
    //scoring functions
    const overlapScore = (seedArr: any[] = [], gameArr: any[] = []) => {
      if (!seedArr?.length || !gameArr?.length) return 0
      const seedIds = seedArr.map(x => x.id)
      const matches = gameArr.filter(x => seedIds.includes(x.id))
      return matches.length / seedArr.length
    }

    const developerScore = (seedDevs: any[] = [], gameDevs: any[] = []) => {
      if (!seedDevs?.length || !gameDevs?.length) return 0
      const seedNames = seedDevs.map(d => d.company.name)
      const matches = gameDevs.filter(d => seedNames.includes(d.company.name))
      return matches.length ? 0.5 : 0 // boost if same dev
    }

    const collectionScore = (seedCollection: any, gameCollection: any) => {
      if (!seedCollection || !gameCollection) return 0
      return seedCollection.name === gameCollection.name ? 0.7 : 0 // boost if same franchise
    }

    //get game from DB, fallback on IGDB API if not there
    let { data: seedGame } = await supabase
      .from('games')
      .select('*')
      .eq('id', seedGameId)
      .single()

    if (!seedGame) {
      const igdbSeedBody = `
        fields id,name,summary,rating,genres.name,keywords.name,themes.name,
        platforms.name,involved_companies.company.name,cover.url,collection.name;
        where id = ${seedGameId};
        limit 1;
      `
      const igdbResult: any[] = await igdbClient.apiRequest('games', igdbSeedBody)
      if (!igdbResult?.length) return NextResponse.json({ error: 'Seed game not found anywhere' }, { status: 404 })
      seedGame = igdbResult[0]
    }

    
    //get pool of 20 games from db only
    const { data: dbGames } = await supabase
      .from('games')
      .select('*')
      .neq('id', seedGameId)
      .order('rating', { ascending: false })
      .limit(20)

    const dbPool = dbGames || []

    //scoring shit for db
    const boostedDB = dbPool.map(g => {
      const overlapBoost =
        overlapScore(seedGame.genres, g.genres) +
        developerScore(seedGame.involved_companies, g.involved_companies) +
        collectionScore(seedGame.collection, g.collection)
      return {
        ...g,
        score: ((g.rating || 0) / 100) + overlapBoost // boost all games
      }
    })

    //sort by updated score
    boostedDB.sort((a, b) => b.score - a.score)
    const topDBPool = boostedDB.slice(0, 20)

    
    //IGDB pool outside db
    const igdbBody = `
      fields id, name, cover.url, first_release_date, total_rating, summary,
        genres.name, themes.name, keywords.name,
        platforms.name, involved_companies.company.name, collection.name, url;
      where id != ${seedGameId};
      sort total_rating desc;
      limit 40;
    `
    let igdbGames: any[] = await igdbClient.apiRequest('games', igdbBody)
    const dbIds = new Set(topDBPool.map((g: any) => g.id))
    igdbGames = igdbGames.filter(g => !dbIds.has(g.id)).slice(0, 20)

    //scoring shit again IGDB
    let scoredIGDB = igdbGames.map((g: any) => ({
      ...g,
      score:
        (g.total_rating || 0) / 100 +
        overlapScore(seedGame.genres, g.genres) +
        overlapScore(seedGame.keywords, g.keywords) +
        overlapScore(seedGame.themes, g.themes) +
        developerScore(seedGame.involved_companies, g.involved_companies) +
        collectionScore(seedGame.collection, g.collection)
    }))

    //boosting score with developer and franchise overlap
    const boostedIGDB = scoredIGDB.map(g => {
      const overlapBoost =
        overlapScore(seedGame.genres, g.genres) +
        developerScore(seedGame.involved_companies, g.involved_companies) +
        collectionScore(seedGame.collection, g.collection)
      return {
        ...g,
        score: g.score + overlapBoost // boost all
      }
    })

    //sort by updated score
    boostedIGDB.sort((a, b) => b.score - a.score)
    const topIGDBPool = boostedIGDB.slice(0, 20)

    
    //return full 40 game pool
    return NextResponse.json({
      seed: seedGame,
      dbPool: topDBPool,
      igdbPool: topIGDBPool
    })
  } catch (err) {
    console.error('Recommendation pool error:', err)
    return NextResponse.json({ error: 'Failed to fetch game pool' }, { status: 500 })
  }
}
