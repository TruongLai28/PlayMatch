import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Returns a unique, alphabetized list of game genres found in the `games` table
export async function GET() {
  try {
    // Fetch only the genres column to minimize payload
    const { data, error } = await supabase
      .from('games')
      .select('genres')

    if (error) {
      console.error('Supabase genres fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch genres' }, { status: 500 })
    }

    type Genre = { id?: number; name: string }

    const uniqueMap = new Map<string, Genre>()

    for (const row of data || []) {
      const genres: unknown = (row as any)?.genres
      if (Array.isArray(genres)) {
        for (const g of genres) {
          if (g && typeof g === 'object') {
            const id = (g as any)?.id as number | undefined
            const name = String((g as any)?.name || '').trim()
            if (!name) continue
            const key = name.toLowerCase()
            if (!uniqueMap.has(key)) {
              uniqueMap.set(key, { id, name })
            }
          }
        }
      }
    }

    const genres = Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    return NextResponse.json({ genres, count: genres.length })
  } catch (err) {
    console.error('Genres API error:', err)
    return NextResponse.json({ error: 'Failed to load genres' }, { status: 500 })
  }
}
