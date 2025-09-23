// Create these as separate files:

// File 1: app/api/games/popular/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { igdbClient } from '../../../../lib/igdb'

export async function GET(request: NextRequest) {
  try {
    const games = await igdbClient.getPopularGames()
    return NextResponse.json(games)
  } catch (error) {
    console.error('Error fetching popular games:', error)
    return NextResponse.json({ error: 'Failed to fetch popular games' }, { status: 500 })
  }
}
