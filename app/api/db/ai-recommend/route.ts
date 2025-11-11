import { NextRequest, NextResponse } from 'next/server'
import pkg from 'pg'
const { Client } = pkg

// Use Hugging Face Inference API instead of local transformer
async function generateEmbedding(text: string) {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/Supabase/gte-small',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    }
  )

  if (!response.ok) {
    throw new Error(`HF API error: ${response.statusText}`)
  }

  const result = await response.json()
  return result
}

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

    // Build query description
    const queryParts = []
    if (genres.length > 0 && genres[0]) queryParts.push(`genres: ${genres.join(', ')}`)
    if (themes.length > 0 && themes[0]) queryParts.push(`themes: ${themes.join(', ')}`)
    if (keywords.length > 0 && keywords[0]) queryParts.push(`keywords: ${keywords.join(', ')}`)
    if (platforms.length > 0 && platforms[0]) queryParts.push(`platforms: ${platforms.join(', ')}`)

    const queryText = queryParts.length > 0 
      ? `A game with ${queryParts.join('; ')}`
      : 'A highly rated video game'

    console.log('Query text:', queryText)

    // Generate embedding using HuggingFace API
    const queryEmbedding = await generateEmbedding(queryText)
    console.log('Generated embedding with', queryEmbedding.length, 'dimensions')

    // Rest of your code stays the same...
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    await client.connect()

    try {
      const countResult = await client.query(
        'SELECT COUNT(*) as total, COUNT(embedding) as with_embeddings FROM games WHERE rating >= $1',
        [minRating]
      )
      console.log('Games in database:', countResult.rows[0])

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
          1 - (embedding <=> $1::vector) as similarity
        FROM games
        WHERE embedding IS NOT NULL
      `

      const params: any[] = [JSON.stringify(queryEmbedding)]
      let paramIndex = 2

      if (minRating > 0) {
        sqlQuery += ` AND rating >= $${paramIndex}`
        params.push(minRating)
        paramIndex++
      }

      if (gameIds.length > 0 && gameIds[0] !== 0) {
        sqlQuery += ` AND id != ALL($${paramIndex}::int[])`
        params.push(gameIds)
        paramIndex++
      }

      sqlQuery += `
        ORDER BY embedding <=> $1::vector ASC
        LIMIT $${paramIndex}
      `
      params.push(Math.max(limit, 1))

      console.log('Executing vector search')
      const result = await client.query(sqlQuery, params)

      const recommendations = result.rows.map(game => ({
        ...game,
        cover: game.cover_url ? { url: game.cover_url } : undefined,
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