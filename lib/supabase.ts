import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Database types (add more as needed)
export interface Game {
  id: number
  name: string
  cover?: {
    url: string
  }
  summary?: string
  rating?: number
  total_rating?: number
  genres?: Array<{ id: number; name: string }>
  created_at?: string
  updated_at?: string
  // Similarity score from recommendation engine
  similarity_score?: number
  scoreInfo?: {
    similarity?: number
  }
}

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}