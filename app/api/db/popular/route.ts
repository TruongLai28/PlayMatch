import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    console.log('DB API: Fetching popular games from database with limit:', limit, 'offset:', offset)
    
    const { data: games, error } = await supabase
      .from('games')
      .select('*, screenshots')
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch games from database' }, { status: 500 })
    }
    
    // Transform data to match frontend Game interface
    const transformedGames = games?.map(game => ({
      ...game,
      cover: game.cover_url ? { url: game.cover_url } : undefined,
      screenshots: typeof game.screenshots === 'string' ? JSON.parse(game.screenshots) : game.screenshots || []
    })) || []
    
    console.log('DB API: Games fetched:', transformedGames.length)
    return NextResponse.json(transformedGames)
  } catch (error) {
    console.error('Error fetching popular games from database:', error)
    return NextResponse.json({ error: 'Failed to fetch popular games' }, { status: 500 })
  }
}