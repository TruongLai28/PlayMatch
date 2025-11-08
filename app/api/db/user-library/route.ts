import { NextRequest, NextResponse } from 'next/server'
import pkg from 'pg'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
const { Client } = pkg

// Helper to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

/**
 * @swagger
 * /api/db/user-library:
 *   get:
 *     tags:
 *       - User Library
 *     summary: Get user's game library
 *     description: Retrieves all games in the authenticated user's library with their status and metadata
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [backlog, playing, completed, dropped]
 *         description: Filter by game status
 *     responses:
 *       200:
 *         description: User library retrieved successfully
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Failed to fetch library
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Unauthorized - Please log in' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50') // Add pagination
    const offset = parseInt(searchParams.get('offset') || '0')

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    await client.connect()

    try {
      // Optimized query with indexes and limited fields
      let query = `
        SELECT 
          ul.id,
          ul.game_id,
          ul.status,
          ul.hours_played,
          ul.added_at,
          ul.updated_at,
          g.name,
          g.rating,
          g.cover_url,
          g.genres,
          g.platforms
        FROM user_library ul
        INNER JOIN games g ON ul.game_id = g.id
        WHERE ul.user_id = $1
      `
      
      const params = [user.id]
      let paramCount = 1

      if (statusFilter) {
        paramCount++
        query += ` AND ul.status = $${paramCount}`
        params.push(statusFilter)
      }

      query += ` ORDER BY ul.added_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
      params.push(limit.toString(), offset.toString())

      // Use Promise.all for parallel queries if count is needed
      const [result, countResult] = await Promise.all([
        client.query(query, params),
        statusFilter 
          ? client.query('SELECT COUNT(*) FROM user_library WHERE user_id = $1 AND status = $2', [user.id, statusFilter])
          : client.query('SELECT COUNT(*) FROM user_library WHERE user_id = $1', [user.id])
      ])

      const totalCount = parseInt(countResult.rows[0].count)

      const response = NextResponse.json({
        message: 'Library retrieved successfully',
        userId: user.id,
        count: result.rows.length,
        totalCount,
        hasMore: offset + limit < totalCount,
        library: result.rows.map(row => ({
          id: row.id,
          gameId: row.game_id,
          status: row.status,
          hoursPlayed: parseFloat(row.hours_played) || 0,
          addedAt: row.added_at,
          updatedAt: row.updated_at,
          game: {
            id: row.game_id,
            name: row.name,
            rating: parseFloat(row.rating) || null,
            coverUrl: row.cover_url,
            genres: (() => {
              try {
                if (Array.isArray(row.genres)) return row.genres;
                if (row.genres && typeof row.genres === 'string') return JSON.parse(row.genres);
                return [];
              } catch (e) {
                console.warn('Failed to parse genres for game', row.game_id, e);
                return [];
              }
            })(),
            platforms: (() => {
              try {
                if (Array.isArray(row.platforms)) return row.platforms;
                if (row.platforms && typeof row.platforms === 'string') return JSON.parse(row.platforms);
                return [];
              } catch (e) {
                console.warn('Failed to parse platforms for game', row.game_id, e);
                return [];
              }
            })()
          }
        }))
      })

      // Add cache headers to improve performance
      response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300')
      
      return response

    } finally {
      await client.end()
    }

  } catch (error) {
    console.error('Error fetching library:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch library',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * @swagger
 * /api/db/user-library:
 *   post:
 *     tags:
 *       - User Library
 *     summary: Add game to user's library
 *     description: Adds a game to the authenticated user's library or updates existing entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gameId
 *             properties:
 *               gameId:
 *                 type: number
 *                 description: IGDB game ID
 *                 example: 1942
 *               status:
 *                 type: string
 *                 enum: [backlog, playing, completed, dropped]
 *                 default: backlog
 *                 description: Game status
 *               hoursPlayed:
 *                 type: number
 *                 default: 0
 *                 description: Hours played
 *     responses:
 *       200:
 *         description: Game added/updated in library
 *       400:
 *         description: Invalid request
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Failed to add game
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Unauthorized - Please log in' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { gameId, status, hoursPlayed } = body

    if (!gameId) {
      return NextResponse.json({ 
        error: 'gameId is required' 
      }, { status: 400 })
    }

    const finalStatus = status || 'backlog'
    const finalHours = hoursPlayed || 0

    const validStatuses = ['backlog', 'playing', 'completed', 'dropped']
    if (!validStatuses.includes(finalStatus)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: backlog, playing, completed, dropped' 
      }, { status: 400 })
    }

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    await client.connect()

    try {
      // Check if game exists in games table
      const gameCheck = await client.query(
        'SELECT id FROM games WHERE id = $1',
        [gameId]
      )

      if (gameCheck.rows.length === 0) {
        return NextResponse.json({ 
          error: 'Game not found in database. Please sync game data first.' 
        }, { status: 404 })
      }

      // Insert or update library entry
      const result = await client.query(`
        INSERT INTO user_library (user_id, game_id, status, hours_played)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, game_id) 
        DO UPDATE SET 
          status = EXCLUDED.status,
          hours_played = EXCLUDED.hours_played,
          updated_at = NOW()
        RETURNING *
      `, [user.id, gameId, finalStatus, finalHours])

      const libraryEntry = result.rows[0]

      return NextResponse.json({
        message: 'Game added to library successfully',
        entry: {
          id: libraryEntry.id,
          userId: libraryEntry.user_id,
          gameId: libraryEntry.game_id,
          status: libraryEntry.status,
          hoursPlayed: parseFloat(libraryEntry.hours_played),
          addedAt: libraryEntry.added_at,
          updatedAt: libraryEntry.updated_at
        }
      })

    } finally {
      await client.end()
    }

  } catch (error) {
    console.error('Error adding to library:', error)
    return NextResponse.json({ 
      error: 'Failed to add game to library',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * @swagger
 * /api/db/user-library:
 *   delete:
 *     tags:
 *       - User Library
 *     summary: Remove game from user's library
 *     description: Removes a game from the authenticated user's library
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gameId
 *             properties:
 *               gameId:
 *                 type: number
 *                 description: IGDB game ID to remove
 *                 example: 1942
 *     responses:
 *       200:
 *         description: Game removed from library
 *       400:
 *         description: Invalid request
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Game not found in library
 *       500:
 *         description: Failed to remove game
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Unauthorized - Please log in' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { gameId } = body

    if (!gameId) {
      return NextResponse.json({ 
        error: 'gameId is required' 
      }, { status: 400 })
    }

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    await client.connect()

    try {
      const result = await client.query(`
        DELETE FROM user_library
        WHERE user_id = $1 AND game_id = $2
        RETURNING *
      `, [user.id, gameId])

      if (result.rows.length === 0) {
        return NextResponse.json({ 
          error: 'Game not found in your library' 
        }, { status: 404 })
      }

      return NextResponse.json({
        message: 'Game removed from library successfully',
        removed: {
          gameId: result.rows[0].game_id,
          status: result.rows[0].status
        }
      })

    } finally {
      await client.end()
    }

  } catch (error) {
    console.error('Error removing from library:', error)
    return NextResponse.json({ 
      error: 'Failed to remove game from library',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}