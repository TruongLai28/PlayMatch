import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

/**
 * @swagger
 * /api/add-user:
 *   post:
 *     tags:
 *       - User Stuff
 *     summary: Add a user to the users table (TESTING)
 *     description: Inserts a user’s id and email into the users table using their access token. Get token from running frontend and signing in. Use web dev tools to find token in local storage.
 *     parameters:
 *       - in: query
 *         name: access_token
 *         schema:
 *           type: string
 *         required: true
 *         description: The access token from the frontend login
 *     responses:
 *       200:
 *         description: User added successfully
 *       401:
 *         description: Invalid or missing access token
 *       500:
 *         description: Unexpected server error
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const access_token = searchParams.get('access_token')

    if (!access_token) {
      return NextResponse.json({ error: 'Missing access_token' }, { status: 401 })
    }

    // get user info from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(access_token)
    if (!user || userError) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // put into users table
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email
      })
      .select()

    if (error) {
      return NextResponse.json({ error: 'Failed to add user', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: data?.[0] })
  } catch (err) {
    return NextResponse.json(
      { error: 'Unexpected server error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
