// File: app/api/games/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { igdbClient } from '../../../../lib/igdb'

export async function GET(request: NextRequest) {
  try {
    // For now, return popular games as recommendations
    // Later, implement actual recommendation logic based on user preferences
    const games = await igdbClient.getRecommendations()
    return NextResponse.json(games)
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}
