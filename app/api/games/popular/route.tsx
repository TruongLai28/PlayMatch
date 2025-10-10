import { NextRequest, NextResponse } from 'next/server'
import { igdbClient } from '../../../../lib/igdb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    console.log('API: Fetching popular released games with limit:', limit, 'offset:', offset)
    const games = await igdbClient.getPopularReleasedGames(limit, offset)
    console.log('API: Games fetched:', games?.length || 0)
    return NextResponse.json(games)
  } catch (error) {
    console.error('Error fetching popular games:', error)
    return NextResponse.json({ error: 'Failed to fetch popular games' }, { status: 500 })
  }
}
