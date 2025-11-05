import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { igdbClient } from '../../../lib/igdb'
import fs from 'fs'
import path from 'path'

/**
 * @swagger
 * /api/rec_engine_multi_input:
 *   post:
 *     tags:
 *       - Recommendation
 *     summary: (UNDER CONSTRUCTION) Multi-game recommendation engine - Input 1 or more game IDs. 
 *              Score games from supabase and get top ten. Also get some games outside of the supabase
 *     description: Accept multiple seed game IDs, aggregates their attributes, and scores all Supabase games against the combined profile. Also fetches top rated IGDB games by genre of seed game. For now, scoring is ONLY for SUPABASE.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seedGameIds:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Array of game IDs the user likes (e.g., [123, 456, 789])
 *               limit:
 *                 type: number
 *                 description: Number of recommendations to return (default 10)
 *     responses:
 *       200:
 *         description: Recommendation Pool fetched successfully
 *       400:
 *         description: Missing or invalid seedGameId array
 *       404:
 *         description: Seed game not found
 *       500:
 *         description: Failed to fetch recommendations, DAMN :(
 */
export async function POST(request: NextRequest) {
  try {
    // Accept JSON body with array of game IDs instead of URL params
    const body = await request.json()
    const seedGameIds = body.seedGameIds || [] // Array of game IDs
    const limit = body.limit || 10

    //const { searchParams } = new URL(request.url)
    //const seedGameId = parseInt(searchParams.get('seedGameId') || '')
    //const testGameId = parseInt(searchParams.get('testGameId') || '')
    
    
    // Validate array input
    if (!Array.isArray(seedGameIds) || seedGameIds.length === 0){
      return NextResponse.json(
        { error: 'seedGameIds array required with at least one game ID'},
        { status: 400 }
      )
    }

    //if (!seedGameId)
    //  return NextResponse.json({ error: 'seedGameId required' }, { status: 400 })

    const parseJSON = (field: any) => {
      if (!field) return []
      if (typeof field === 'string') return JSON.parse(field)
      return field 
    }

    // Fetch all seed games from Supabase first
    const { data: supabaseGames, error: supabaseError } = await supabase
      .from('games')
      .select('*')
      .in('id', seedGameIds) // Fetch multiple games at once

    let seedGames = supabaseGames || []
  

    // fetch seed game
    //let { data: seedGame, error: seedError } = await supabase
    //  .from('games')
    //  .select('*')
    //  .eq('id', seedGameId)
    //  .single()

    // Find which games are missing from Supabase
    const missingIds = seedGameIds.filter(
      id => !seedGames.find(game => game.id === id)
    )

    // Fetch missing games from IGDB (if any)
    if (missingIds.length > 0) {
      console.log(`Fetching ${missingIds.length} seed games from IGDB:`, missingIds)

      const igdbSeedBody = `
        fields id,name,genres.id,genres.name,rating,platforms.id,platforms.name,cover.url,involved_companies.company.id,involved_companies.company.name,keywords.id,keywords.name,themes.id,themes.name;
        where id = (${missingIds.join(',')});
      `
      const igdbResult = await igdbClient.apiRequest('games', igdbSeedBody)

      if (igdbResult?.length) {
        seedGames = [...seedGames, ...igdbResult]
      }
    }

    // fallback to igdb if game not in supabase 
    //if (!seedGame) {
    //  const igdbSeedBody = `
    //    fields id,name,genres.id,genres.name,rating,cover.url,involved_companies.company.id,involved_companies.company.name;
    //    where id = ${seedGameId};
    //    limit 1;
    //  `
    //  const igdbResult = await igdbClient.apiRequest('games', igdbSeedBody)
    //  console.log('Getting data of game from IGDB API')

    //  if (!igdbResult?.length)
    //    return NextResponse.json({ error: 'Seed game not found!' }, { status: 404 })
    //  seedGame = igdbResult[0]
    //}

    if (seedGames.length === 0) {
      return NextResponse.json(
        { error: 'No seed games found in Supabase or IGDB' },
        { status: 404 }
      )
    }

    // Parse JSON for all seed games
    seedGames.forEach(game => {
      game.genres = parseJSON(game.genres)
      game.companies = parseJSON(game.companies || game.involved_companies)
      game.keywords = parseJSON(game.keywords)
      game.themes = parseJSON(game.themes)
      game.platforms = parseJSON(game.platforms)
    })

    console.log(`Successfully loaded ${seedGames.length} seed games:`, seedGames.map(g => g.name))

    //seedGame.genres = parseJSON(seedGame.genres)
    //seedGame.companies = parseJSON(seedGame.companies || seedGame.involved_companies)
    //seedGame.keywords = parseJSON(seedGame.keywords)
    //seedGame.themes = parseJSON(seedGame.themes)
    //if (!seedGame.genres.length)
    //  return NextResponse.json({ error: 'Seed game has no genres?' }, { status: 404 })

// --------------------------------------------------------------------------------------------------------------------------

    // AGGREGATE ATTRIBUTES FROM ALL SEED GAMES
    const aggregatedProfile = {
      genres: new Map<number, { id: number; name?: string; count: number }>(),
      companies: new Map<number, { id: number; name?: string; count: number }>(),
      keywords: new Map<number, { id: number; name?: string; count: number }>(),
      themes: new Map<number, { id: number; name?: string; count: number }>(),
      platforms: new Map<number, { id: number; name?: string; count: number }>(),
      avgRating: 0,
    }

    let totalRating = 0
    let ratingCount = 0

    // Aggregate data from all seed games
    seedGames.forEach(game => {
      // Genres
      game.genres?.forEach((g: any) => {
        const existing = aggregatedProfile.genres.get(g.id) || { id: g.id, name: g.name, count: 0 }
        aggregatedProfile.genres.set(g.id, { ...existing, count: existing.count + 1 })
      })

      // Companies
      game.companies?.forEach((c: any) => {
        const id = c.company?.id || c.id
        if (id) {
          const existing = aggregatedProfile.companies.get(id) || { id, name: c.company?.name || c.name, count: 0 }
          aggregatedProfile.companies.set(id, { ...existing, count: existing.count + 1 })
        }
      })

      // Keywords
      game.keywords?.forEach((k: any) => {
        const existing = aggregatedProfile.keywords.get(k.id) || { id: k.id, name: k.name, count: 0 }
        aggregatedProfile.keywords.set(k.id, { ...existing, count: existing.count + 1 })
      })

      // Themes
      game.themes?.forEach((t: any) => {
        const existing = aggregatedProfile.themes.get(t.id) || { id: t.id, name: t.name, count: 0 }
        aggregatedProfile.themes.set(t.id, { ...existing, count: existing.count + 1 })
      })

      // Platforms
      game.platforms?.forEach((p: any) => {
        const id = p.id || p.platform?.id
        if (id) {
          const existing = aggregatedProfile.platforms.get(id) || { id, name: p.name || p.platform?.name, count: 0 }
          aggregatedProfile.platforms.set(id, { ...existing, count: existing.count + 1 })
        }
      })

      // Rating
      if (game.rating) {
        totalRating += game.rating
        ratingCount++
      }
    })

    aggregatedProfile.avgRating = ratingCount > 0 ? totalRating / ratingCount : 0

// --------------------------------------------------------------------------------------------------------------------------

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

    const keywordOverlapScore = (seedKeywords: any[], candidateKeywords: any[]) => {
      if (!seedKeywords?.length || !candidateKeywords?.length) return 0
      const seedIds = new Set(seedKeywords.map(k => k.id))
      return candidateKeywords.filter(k => seedIds.has(k.id)).length / seedIds.size
    }

    const themeOverlapScore = (seedThemes: any[], candidateThemes: any[]) => {
      if (!seedThemes?.length || !candidateThemes?.length) return 0
      const seedIds = new Set(seedThemes.map(t => t.id))
      return candidateThemes.filter(t => seedIds.has(t.id)).length / seedIds.size
    }

    // Rating similarity score **************
    const ratingScore = (seedRating: number, candidateRating: number) => {
      if (!seedRating || !candidateRating) return 0
      const difference = Math.abs(seedRating - candidateRating)
      const score = Math.max(0, 1 - difference / 100)
      const highRatingBonus = candidateRating > 75 ? 0.2 : 0
      return score + highRatingBonus
    }

    // Platform overlap score **************
    const platformOverlapScore = (seedPlatforms: any[], candidatePlatforms: any[]) => {
      if (!seedPlatforms?.length || !candidatePlatforms?.length) return 0
      const seedIds = new Set(
        seedPlatforms.map(p => p.id || p.platform?.id || p).filter(Boolean)
      )
      const candidateIds = candidatePlatforms.map(
        p => p.id || p.platform?.id || p
      ).filter(Boolean)
      const matches = candidateIds.filter(id => seedIds.has(id)).length
      return matches / seedIds.size
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
    const dbScored = await Promise.all(allDbGames.map(async (game: any) => {
      const candidateGenres = parseJSON(game.genres)
      const candidateCompanies = parseJSON(game.companies || game.involved_companies)
      const candidateKeywords = parseJSON(game.keywords)
      const candidateThemes = parseJSON(game.themes)
      const candidatePlatforms = parseJSON(game.platforms)

      const genreScore = genreOverlapScore(seedGame.genres, candidateGenres)
      const companyScore = companyOverlapScore(seedGame.companies, candidateCompanies)
      const keywordScore = keywordOverlapScore(seedGame.keywords, candidateKeywords)
      const themeScore = themeOverlapScore(seedGame.themes, candidateThemes)
      const ratingScoreValue = ratingScore(seedGame.rating, game.rating)
      const platformScore = platformOverlapScore(parseJSON(seedGame.platforms), candidatePlatforms)

      const finalScore = 
        genreScore * 0.30 +       // 30% genre weight
        companyScore * 0.20 +     // 20% company weight
        keywordScore * 0.20 +     // 20% keyword weight 
        themeScore * 0.10 +       // 10% theme weight
        ratingScoreValue * 0.10 + // 10% rating weight
        platformScore * 0.10      // 10% platform weight

      return { ...game, genreScore, companyScore, keywordScore, themeScore, ratingScoreValue, platformScore, finalScore }
    }))

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
        const candidateKeywords = parseJSON(testGame.keywords)
        const candidateThemes = parseJSON(testGame.themes)
        const candidatePlatforms = parseJSON(testGame.platforms)

        const genreScore = genreOverlapScore(seedGame.genres, candidateGenres)
        const companyScore = companyOverlapScore(seedGame.companies, candidateCompanies)
        const keywordScore = keywordOverlapScore(seedGame.keywords, candidateKeywords)
        const themeScore = themeOverlapScore(seedGame.themes, candidateThemes)
        const ratingScoreValue = ratingScore(seedGame.rating, testGame.rating)
        const platformScore = platformOverlapScore(parseJSON(seedGame.platforms), candidatePlatforms)

        const finalScore = 
          genreScore * 0.30 + 
          companyScore * 0.20 + 
          keywordScore * 0.20 + 
          themeScore * 0.10 + 
          ratingScoreValue * 0.10 + 
          platformScore * 0.10

        dbScored.push({ ...testGame, genreScore, companyScore, keywordScore, themeScore, ratingScoreValue, platformScore, finalScore })
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
        `   Genre Score: ${g.genreScore.toFixed(3)} (30% weight → ${(g.genreScore * 0.3).toFixed(3)})\n` +
        `   Company Score: ${g.companyScore.toFixed(3)} (20% weight → ${(g.companyScore * 0.2).toFixed(3)})\n` + 
        `   Keyword Score: ${g.keywordScore.toFixed(3)} (20% weight → ${(g.keywordScore * 0.2).toFixed(3)})\n` +
        `   Theme Score: ${g.themeScore.toFixed(3)} (10% weight → ${(g.themeScore * 0.1).toFixed(3)})\n` + 
        `   Rating Score: ${g.ratingScoreValue.toFixed(3)} (10% weight → ${(g.ratingScoreValue * 0.1).toFixed(3)})\n` + 
        `   Platform Score: ${g.platformScore.toFixed(3)} (10% weight → ${(g.platformScore * 0.1).toFixed(3)})\n` + 
        `   Final Score: ${(g.finalScore).toFixed(3)}\n`
      )
    })

    // get games outside of supabase based on genre of seed + top rating
    const igdbResultsMap: Record<number, any> = {}
    await Promise.all(seedGame.genres.map(async (genre: { id: number; name: string }) => {
      const igdbBody = `
        fields id,name,genres.id,genres.name,rating,total_rating,cover.url,involved_companies.company.id,involved_companies.company.name;
        where genres = (${genre.id}) & id != ${seedGameId};
        sort total_rating desc;
        limit 10;
      `
      const igdbGames = await igdbClient.apiRequest('games', igdbBody)
      if (igdbGames?.length) {
        igdbGames.forEach((g: any) => { if (!igdbResultsMap[g.id]) igdbResultsMap[g.id] = g })
      }
    }))

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
