import { NextRequest, NextResponse } from 'next/server'
import { igdbClient } from '../../../lib/igdb'
import { supabase } from '../../../lib/supabase'
import { pipeline } from '@xenova/transformers'

// Initialize the embedding model (runs once)
let generateEmbedding: any = null

async function getEmbeddingModel() {
  if (!generateEmbedding) {
    console.log('Loading embedding model...')
    generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small')
    console.log('Embedding model loaded!')
  }
  return generateEmbedding
}

/**
 * @swagger
 * /api/auto-sync-games:
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
    const batchSize = parseInt(searchParams.get('batchSize') || '500')
    
    const validatedTarget = Math.min(Math.max(target, 100), 20000)
    const validatedBatchSize = Math.min(Math.max(batchSize, 100), 500)

    const batches = Math.ceil(validatedTarget / validatedBatchSize)
    let totalSynced = 0
    let totalInserted = 0
    const syncResults = []

    console.log(`Starting auto-sync: Target=${validatedTarget}, Batches=${batches}, BatchSize=${validatedBatchSize}`)

    // Load embedding model
    const embeddingModel = await getEmbeddingModel()

    for (let i = 0; i < batches; i++) {
      const offset = i * validatedBatchSize
      
      try {
        // Fetch games from IGDB
        const igdbGames = await igdbClient.getPopularReleasedGames(validatedBatchSize, offset)
        
        if (!igdbGames || igdbGames.length === 0) {
          console.log(`No more games available at offset ${offset}`)
          break
        }

        // Transform IGDB data and generate embeddings
        const gamesToInsert = await Promise.all(
          igdbGames.map(async (game: any) => {
            // Generate embedding from summary (or fallback to name if no summary)
            const textToEmbed = game.summary || game.name || ''
            let embedding = null

            if (textToEmbed.trim()) {
              try {
                const output = await embeddingModel(textToEmbed, {
                  pooling: 'mean',
                  normalize: true,
                })
                embedding = Array.from(output.data)
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

        // Insert into Supabase
        const { data, error } = await supabase
          .from('games')
          .upsert(gamesToInsert, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
          .select()

        if (error) {
          console.error(`Batch ${i + 1} error:`, error)
          syncResults.push({
            batch: i + 1,
            offset,
            status: 'failed',
            error: error.message
          })
          continue
        }

        totalSynced += gamesToInsert.length
        totalInserted += data?.length || 0

        syncResults.push({
          batch: i + 1,
          offset,
          fetched: gamesToInsert.length,
          inserted: data?.length || 0,
          withEmbeddings: gamesToInsert.filter(g => g.embedding).length,
          status: 'success'
        })

        console.log(`Batch ${i + 1}/${batches} completed: ${totalSynced}/${validatedTarget} games synced`)

        // Add a small delay to avoid rate limiting
        if (i < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

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

/**
 * @swagger
 * /api/auto-sync-games:
 *   get:
 *     tags:
 *       - Database Sync
 *     summary: Get auto-sync information
 *     description: Returns information about the auto-sync endpoint
 *     responses:
 *       200:
 *         description: Auto-sync information
 */
export async function GET() {
  try {
    const { count, error } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to count games',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Auto-sync endpoint ready',
      currentGamesCount: count,
      targetGamesCount: 10000,
      remaining: Math.max(0, 10000 - (count || 0)),
      usage: {
        default: 'POST /api/auto-sync-games - syncs 10,000 games',
        custom: 'POST /api/auto-sync-games?target=5000&batchSize=500',
        parameters: {
          target: 'Number of games to sync (default: 10000, max: 20000)',
          batchSize: 'Games per batch (default: 500, max: 500)'
        }
      }
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to get sync info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}