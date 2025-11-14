import { NextRequest, NextResponse } from 'next/server'
import { igdbClient } from '../../../../lib/igdb'
import { supabase } from '../../../../lib/supabase'

// Generate embedding using local Ollama
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'all-minilm:l6-v2',
        prompt: text,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.embedding as number[]
  } catch (error) {
    console.error('Failed to generate embedding:', error)
    throw error
  }
}

// Helper function to create rich text from game attributes
function createGameEmbeddingText(game: any): string {
  const parts = []
  
  // Add game name
  if (game.name) {
    parts.push(`Game: ${game.name}`)
  }
  
  // Add summary/description
  if (game.summary) {
    parts.push(`Description: ${game.summary}`)
  }
  
  // Add genres
  if (game.genres && Array.isArray(game.genres) && game.genres.length > 0) {
    const genreNames = game.genres.map((g: any) => g.name || g).filter(Boolean)
    if (genreNames.length > 0) {
      parts.push(`Genres: ${genreNames.join(', ')}`)
    }
  }
  
  // Add themes
  if (game.themes && Array.isArray(game.themes) && game.themes.length > 0) {
    const themeNames = game.themes.map((t: any) => t.name || t).filter(Boolean)
    if (themeNames.length > 0) {
      parts.push(`Themes: ${themeNames.join(', ')}`)
    }
  }
  
  // Add keywords
  if (game.keywords && Array.isArray(game.keywords) && game.keywords.length > 0) {
    const keywordNames = game.keywords.map((k: any) => k.name || k).filter(Boolean)
    if (keywordNames.length > 0) {
      parts.push(`Keywords: ${keywordNames.join(', ')}`)
    }
  }
  
  // Add game modes
  if (game.game_modes && Array.isArray(game.game_modes) && game.game_modes.length > 0) {
    const modeNames = game.game_modes.map((m: any) => m.name || m).filter(Boolean)
    if (modeNames.length > 0) {
      parts.push(`Game Modes: ${modeNames.join(', ')}`)
    }
  }
  
  // Add platforms
  if (game.platforms && Array.isArray(game.platforms) && game.platforms.length > 0) {
    const platformNames = game.platforms.map((p: any) => p.name || p).filter(Boolean).slice(0, 5) // Limit to 5 platforms
    if (platformNames.length > 0) {
      parts.push(`Platforms: ${platformNames.join(', ')}`)
    }
  }
  
  return parts.join('. ')
}

/**
 * @swagger
 * /api/db/auto-sync-games:
 *   post:
 *     tags:
 *       - Database Sync
 *     summary: Automatically sync large batches of popular games with embeddings
 *     description: Automatically fetches and syncs games in batches with AI embeddings until target is reached
 *     parameters:
 *       - in: query
 *         name: target
 *         schema:
 *           type: number
 *         description: Target number of games to sync (default 10000, max 20000)
 *       - in: query
 *         name: batchSize
 *         schema:
 *           type: number
 *         description: Number of games per batch (default 500, max 500)
 *     responses:
 *       200:
 *         description: Auto-sync completed successfully
 *       500:
 *         description: Auto-sync failed
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const target = parseInt(searchParams.get('target') || '10000')
    const batchSize = parseInt(searchParams.get('batchSize') || '250') // Changed from 500 to 250
    
    const validatedTarget = Math.min(Math.max(target, 100), 20000)
    const validatedBatchSize = Math.min(Math.max(batchSize, 50), 250) // Changed max from 500 to 250

    const batches = Math.ceil(validatedTarget / validatedBatchSize)
    let totalSynced = 0
    let totalInserted = 0
    const syncResults = []

    console.log(`Starting auto-sync: Target=${validatedTarget}, Batches=${batches}, BatchSize=${validatedBatchSize}`)
    console.log(`Using local Ollama model: all-minilm:l6-v2 with enriched game attributes`)

    for (let i = 0; i < batches; i++) {
      const offset = i * validatedBatchSize
      
      try {
        // Fetch games from IGDB
        const igdbGames = await igdbClient.getPopularReleasedGames(validatedBatchSize, offset)
        
        if (!igdbGames || igdbGames.length === 0) {
          console.log(`No more games available at offset ${offset}`)
          break
        }

        console.log(`Batch ${i + 1}/${batches}: Generating ${igdbGames.length} embeddings...`)

        // Transform IGDB data and generate embeddings
        const gamesToInsert = await Promise.all(
          igdbGames.map(async (game: any) => {
            // Create rich text from multiple game attributes
            const embeddingText = createGameEmbeddingText(game)
            let embedding = null

            if (embeddingText.trim()) {
              try {
                embedding = await generateEmbedding(embeddingText)
              } catch (embError) {
                console.error(`Failed to generate embedding for game ${game.id}:`, embError)
              }
            }

            return {
              id: game.id,
              name: game.name,
              summary: game.summary || null,
              rating: game.rating || null,
              cover_url: game.cover?.url ? `https:${game.cover.url}` : null,
              first_release_date: game.first_release_date || null,
              genres: game.genres || null,
              platforms: game.platforms || null,
              themes: game.themes || null,
              keywords: game.keywords || null,
              game_modes: game.game_modes || null,
              player_perspectives: game.player_perspectives || null,
              age_ratings: game.age_ratings || null,
              companies: game.involved_companies || null,
              similar_games: game.similar_games || null,
              screenshots: game.screenshots || null,
              embedding: embedding
            }
          })
        )

        console.log(`Batch ${i + 1}/${batches}: Inserting ${gamesToInsert.length} games into Supabase...`)

        // Insert into Supabase with smaller batches to avoid timeout
        const insertBatchSize = 100 // Split into smaller chunks for Supabase
        let batchInserted = 0
        
        for (let j = 0; j < gamesToInsert.length; j += insertBatchSize) {
          const chunk = gamesToInsert.slice(j, j + insertBatchSize)
          
          const { data, error } = await supabase
            .from('games')
            .upsert(chunk, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            })
            .select()

          if (error) {
            console.error(`Batch ${i + 1} chunk ${Math.floor(j/insertBatchSize) + 1} error:`, error)
            throw error
          }
          
          batchInserted += data?.length || 0
        }

        totalSynced += gamesToInsert.length
        totalInserted += batchInserted

        syncResults.push({
          batch: i + 1,
          offset,
          fetched: gamesToInsert.length,
          inserted: batchInserted,
          withEmbeddings: gamesToInsert.filter(g => g.embedding).length,
          status: 'success'
        })

        console.log(`Batch ${i + 1}/${batches} completed: ${totalSynced}/${validatedTarget} games synced`)

      } catch (batchError) {
        console.error(`Batch ${i + 1} failed:`, batchError)
        syncResults.push({
          batch: i + 1,
          offset,
          status: 'failed',
          error: batchError instanceof Error ? batchError.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({ 
      message: `Auto-sync completed!`,
      summary: {
        target: validatedTarget,
        totalFetched: totalSynced,
        totalInserted: totalInserted,
        batchesCompleted: syncResults.filter(r => r.status === 'success').length,
        batchesFailed: syncResults.filter(r => r.status === 'failed').length
      },
      batches: syncResults
    })

  } catch (error) {
    console.error('Auto-sync error:', error)
    return NextResponse.json({ 
      error: 'Auto-sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}