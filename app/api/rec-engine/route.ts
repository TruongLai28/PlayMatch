import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { igdbClient } from '../../../lib/igdb'
import fs from 'fs'
import path from 'path'

/**
 * @swagger
 * /api/rec_engine_p1:
 *   post:
 *     tags:
 *       - Recommendation
 *     summary: (UNDER CONSTRUCTION) Input a game id. Score games from supabase and get top ten. Also get some games outside of the supabase
 *     description: Scores all Supabase games against the seed game by genre and company overlap. Also fetches top rated IGDB games by genre of seed game. For now, scoring is ONLY for SUPABASE.
 *     parameters:
 *       - in: query
 *         name: seedGameId
 *         schema:
 *           type: number
 *         required: true
 *         description: ID of the seed game
 *       - in: query
 *         name: testGameId
 *         schema:
 *           type: number
 *         required: false
 *         description: Optional game ID to force into the scored list
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
    const testGameId = parseInt(searchParams.get('testGameId') || '')

    if (!seedGameId)
      return NextResponse.json({ error: 'seedGameId required' }, { status: 400 })

    const parseJSON = (field: any) => {
      if (!field) return []
      if (typeof field === 'string') return JSON.parse(field)
      return field
    }

    // fetch seed game
    let { data: seedGame, error: seedError } = await supabase
      .from('games')
      .select('*')
      .eq('id', seedGameId)
      .single()
    //if (seedError) console.error('Supabase seed fetch error:', seedError)
    
    // fallback to igdb if game not in supabase 
    if (!seedGame) {
      const igdbSeedBody = `
        fields id,name,genres.id,genres.name,rating,cover.url,involved_companies.company.id,involved_companies.company.name;
        where id = ${seedGameId};
        limit 1;
      `
      const igdbResult = await igdbClient.apiRequest('games', igdbSeedBody)
      console.log('Getting data of game from IGDB API')

      if (!igdbResult?.length)
        return NextResponse.json({ error: 'Seed game not found!' }, { status: 404 })
      seedGame = igdbResult[0]
    }

    seedGame.genres = parseJSON(seedGame.genres)
    seedGame.companies = parseJSON(seedGame.companies || seedGame.involved_companies)
    if (!seedGame.genres.length)
      return NextResponse.json({ error: 'Seed game has no genres?' }, { status: 404 })

    const genreOverlapScore = (seedGenres: any[], candidateGenres: any[]) => {
      if (!seedGenres?.length || !candidateGenres?.length) return 0
      const seedIds = new Set(seedGenres.map(g => g.id))
      return candidateGenres.filter(g => seedIds.has(g.id)).length / seedIds.size
    }

    const companyOverlapScore = (seedCompanies: any[], candidateCompanies: any[]) => {
      if (!seedCompanies?.length || !candidateCompanies?.length) return 0
      const seedIds = new Set(seedCompanies.map(c => c.company?.id).filter(Boolean))
      return candidateCompanies.filter(c => seedIds.has(c.company?.id)).length / seedIds.size
    }

    // fetch all supabase games
    let allDbGames: any[] = []
    const pageSize = 1000
    let from = 0

    while (true) {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .neq('id', seedGameId)
        .range(from, from + pageSize - 1)

      if (error) {
        console.error('Supabase fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch Supabase games' }, { status: 500 })
      }
      if (!data || data.length === 0) break

      allDbGames.push(...data)
      from += pageSize
    }

    // write all scanned supabase game in json

    //try {
    //  const scannedGames = {
    //    total: allDbGames.length,
    //    games: allDbGames.map(g => ({ id: g.id, name: g.name })),
    //  }
    //  const filePath = path.join(process.cwd(), 'app', 'api', 'rec_engine_p1', 'scannedDbGames.json')
    //  fs.writeFileSync(filePath, JSON.stringify(scannedGames, null, 2))
    //  console.log(`Saved scanned DB games to ${filePath} (total: ${allDbGames.length})`)
    //} catch (writeErr) {
    //  console.error('Failed to write scanned DB games to JSON:', writeErr)
    //}

    // rec scoring supabase games
    const dbScored = allDbGames.map((game: any) => {
      const candidateGenres = parseJSON(game.genres)
      const candidateCompanies = parseJSON(game.companies || game.involved_companies)
      const genreScore = genreOverlapScore(seedGame.genres, candidateGenres)
      const companyScore = companyOverlapScore(seedGame.companies, candidateCompanies)
      const finalScore = genreScore * 0.7 + companyScore * 0.3 //70% for genre. 30% for companies for now. 
      return { ...game, genreScore, companyScore, finalScore }
    })

    // force a game in the list to be scored
    if (testGameId) {
      let testGame = allDbGames.find((g: any) => g.id === testGameId)
      if (!testGame) {
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('id', testGameId)
          .single()
        if (!error) testGame = data
      }
      if (testGame) {
        const candidateGenres = parseJSON(testGame.genres)
        const candidateCompanies = parseJSON(testGame.companies || testGame.involved_companies)
        const genreScore = genreOverlapScore(seedGame.genres, candidateGenres)
        const companyScore = companyOverlapScore(seedGame.companies, candidateCompanies)
        const finalScore = genreScore * 0.7 + companyScore * 0.3
        dbScored.push({ ...testGame, genreScore, companyScore, finalScore })
      }
    }

    dbScored.sort((a, b) => b.finalScore - a.finalScore)

    console.log('\n-Seed Game Info-')
    console.log(`Name: ${seedGame.name}`)
    console.log(
      `Genres: ${seedGame.genres.map((g: any) => g.name || g.id).join(', ') || 'None'}`
    )
    console.log(
      `Companies: ${seedGame.companies
        .map((c: any) => c.company?.name || c.name || c.company?.id)
        .join(', ') || 'None'} \n`
    )

    console.log('-Top 10 Rec Scored Supabase Games-')
    dbScored.slice(0, 10).forEach((g, idx) => {
      console.log(
        `${idx + 1}. ${g.name}\n` +
        `   Genre Score: ${g.genreScore.toFixed(3)} (70% weight → ${(g.genreScore * 0.7).toFixed(3)})\n` +
        `   Company Score: ${g.companyScore.toFixed(3)} (30% weight → ${(g.companyScore * 0.3).toFixed(3)})\n` +
        `   Final Score: ${(g.finalScore).toFixed(3)}\n`
      )
    })

    // get games outside of supabase based on genre of seed + top rating
    const igdbResultsMap: Record<number, any> = {}
    for (const genre of seedGame.genres) {
      const igdbBody = `
        fields id,name,genres.id,genres.name,rating,total_rating,cover.url,involved_companies.company.id,involved_companies.company.name;
        where genres = (${genre.id}) & id != ${seedGameId};
        sort total_rating desc;
        limit 10;
      `
      const igdbGames = await igdbClient.apiRequest('games', igdbBody)
      if (igdbGames?.length) {
        igdbGames.forEach((g: any) => { 
          if (!igdbResultsMap[g.id]) igdbResultsMap[g.id] = g 
        })
      }
    }

  
    console.log('-IGDB Games by Seed Genre + Ratings-')
    Object.values(igdbResultsMap).forEach((g: any) => {
      const genres = g.genres?.map((gen: any) => gen.name).join(', ') || 'Unknown'
      console.log(`Genre(s): ${genres} - ${g.name}`)
    })

    return NextResponse.json({
      seed: seedGame,
      dbScored: dbScored.slice(0, 10),
      igdbPool: Object.values(igdbResultsMap),
    })
  } catch (err) {
    console.error('Error in recommendation engine WTF:', err)
    return NextResponse.json({ error: 'Failed to fetch recommendation pool DAMN' }, { status: 500 })
  }
}