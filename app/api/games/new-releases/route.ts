// File: app/api/games/new-releases/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { igdbClient } from '../../../../lib/igdb'

export async function GET(request: NextRequest) {
  try {
    const games = await igdbClient.getNewReleases()
    return NextResponse.json(games)
  } catch (error) {
    console.error('Error fetching new releases:', error)
    return NextResponse.json({ error: 'Failed to fetch new releases' }, { status: 500 })
  }
}
