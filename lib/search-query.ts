

export interface Game {
  id: number
  name: string
  summary?: string
  cover_url?: string | null
  first_release_date?: string | null
  genres?: string[]
  platforms?: string[]
}

/**
 * Normalize a string for accent-, punctuation-, and space-insensitive comparisons.
 */
export const normalize = (str: string): string =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/gi, '')     // remove spaces/punctuation
    .toLowerCase()

/**
 * Filter games by genre (case-insensitive).
 * Matches if the game has *any* of the requested genres.
 */

/**
 * Clean up a search string (used for IGDB queries).
 */
export const cleanSearchQuery = (query: string): string =>
  query.replace(/[^a-z0-9 ]/gi, ' ').trim()
