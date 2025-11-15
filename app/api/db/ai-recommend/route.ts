import { NextRequest, NextResponse } from 'next/server'
import { InferenceClient } from '@huggingface/inference'
import pkg from 'pg'
const { Client } = pkg

// Initialize HuggingFace Inference client
const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY)

// Generate embedding using HuggingFace Inference API
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    console.log('🔄 Generating embedding with HF Inference API...')
    
    const result = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: text,
    })
    
    const embedding = Array.isArray(result) ? result : Array.from(result as any)
    
    if (!Array.isArray(embedding) || embedding.length === 0) {
      console.error('Invalid embedding format:', result)
      throw new Error('Invalid embedding format received from HuggingFace')
    }
    
    console.log('✅ Embedding generated:', embedding.length, 'dimensions')
    return embedding as number[]
  } catch (error) {
    console.error('❌ HuggingFace API error:', error)
    throw error
  }
}


/**
 * @swagger
 * /api/db/ai-recommend:
 *   post:
 *     tags:
 *       - AI Recommendations
 *     summary: Get game recommendations using vector similarity search
 *     description: Finds similar games based on user preferences using AI embeddings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameIds:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Array of game IDs the user likes
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Preferred genres
 *               themes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Preferred themes
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Keywords to search for
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Preferred platforms
 *               limit:
 *                 type: number
 *                 description: Number of recommendations to return (default 10)
 *               minRating:
 *                 type: number
 *                 description: Minimum game rating (default 70)
 *     responses:
 *       200:
 *         description: Recommendations generated successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Recommendation generation failed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      gameIds = [],
      genres = [],
      themes = [],
      keywords = [],
      platforms = [],
      limit = 10,
      minRating = 0
    } = body

    console.log('Generating recommendations with:', { gameIds, genres, themes, keywords, platforms, limit, minRating })

    // Build a query description from user preferences
    const queryParts = []
    
    if (genres.length > 0 && genres[0]) queryParts.push(`genres: ${genres.join(', ')}`)
    if (themes.length > 0 && themes[0]) queryParts.push(`themes: ${themes.join(', ')}`)
    if (keywords.length > 0 && keywords[0]) queryParts.push(`keywords: ${keywords.join(', ')}`)
    if (platforms.length > 0 && platforms[0]) queryParts.push(`platforms: ${platforms.join(', ')}`)

    // Create a more detailed query for better embedding matching
    const queryText = `
      A ${genres.length > 0 ? genres.join(', ') : 'video'} game with ${themes.length > 0 ? themes.join(', ') : 'engaging'} themes.
      Game modes: ${keywords.length > 0 ? keywords.join(', ') : 'various gameplay options'}.
      Available on ${platforms.length > 0 ? platforms.join(', ') : 'multiple platforms'}.
      ${gameIds.length > 0 ? `Similar to games with IDs: ${gameIds.join(', ')}.` : ''}
      Gameplay style focuses on ${keywords.filter((k: string) => !['Multiplayer', 'Single Player'].includes(k)).join(', ') || 'immersive experience'}.
    `.trim()

    console.log('Query text:', queryText)

    // Generate embedding using HuggingFace Inference API
    const queryEmbedding = await generateEmbedding(queryText)
    console.log('Generated embedding with', queryEmbedding.length, 'dimensions')

    // Connect to database for vector search
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    await client.connect()

    try {
      // First, check how many games have embeddings
      const countResult = await client.query(
        'SELECT COUNT(*) as total, COUNT(embedding) as with_embeddings FROM games WHERE rating >= $1',
        [minRating]
      )
      console.log('Games in database:', countResult.rows[0])

      // Simplified SQL query - remove strict JSONB filters, rely on vector similarity
      let sqlQuery = `
        SELECT 
          id,
          name,
          summary,
          rating,
          cover_url,
          genres,
          themes,
          platforms,
          keywords,
          screenshots,
          1 - (embedding <=> $1::vector) as similarity
        FROM games
        WHERE embedding IS NOT NULL
      `

      const params: any[] = [JSON.stringify(queryEmbedding)]
      let paramIndex = 2

      // Add minimum rating filter
      if (minRating > 0) {
        sqlQuery += ` AND rating >= $${paramIndex}`
        params.push(minRating)
        paramIndex++
      }

      // Exclude games the user already likes
      if (gameIds.length > 0 && gameIds[0] !== 0) {
        sqlQuery += ` AND id != ALL($${paramIndex}::int[])`
        params.push(gameIds)
        paramIndex++
      }

      // Order by similarity and limit
      sqlQuery += `
        ORDER BY embedding <=> $1::vector ASC
        LIMIT $${paramIndex}
      `
      params.push(Math.max(limit, 1))

      console.log('Executing vector search with params:', params.length - 1, 'filters')
      console.log('SQL:', sqlQuery)
      const result = await client.query(sqlQuery, params)

      console.log(`Found ${result.rows.length} recommendations`)

      // Transform results to match frontend format
      const recommendations = result.rows.map(game => ({
        ...game,
        cover: game.cover_url ? { url: game.cover_url } : undefined,
        screenshots: typeof game.screenshots === 'string' ? JSON.parse(game.screenshots) : game.screenshots || [],
        similarity_score: Math.round(game.similarity * 100) / 100
      }))

      return NextResponse.json({
        message: 'Recommendations generated successfully',
        count: recommendations.length,
        query: queryText,
        debug: {
          ...countResult.rows[0],
          filters_applied: params.length - 1
        },
        recommendations
      })

    } finally {
      await client.end()
    }

  } catch (error) {
    console.error('Recommendation error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}