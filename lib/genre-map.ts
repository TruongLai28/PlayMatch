// Genre ID to Name mapping based on IGDB standard genres
export const GENRE_MAP: Record<number, string> = {
  2: 'Point-and-click',
  4: 'Fighting',
  5: 'Shooter',
  7: 'Music',
  8: 'Platformer',
  9: 'Puzzle',
  10: 'Racing',
  11: 'Real Time Strategy (RTS)',
  12: 'RPG',
  13: 'Simulator',
  14: 'Sport',
  15: 'Strategy',
  16: 'Turn-based Strategy (TBS)',
  19: 'Horror', // Adding Horror genre
  24: 'Tactical',
  25: 'Hack and slash/Beat \'em up',
  26: 'Quiz/Trivia',
  30: 'Pinball',
  31: 'Adventure',
  32: 'Indie',
  33: 'Arcade',
  34: 'Visual Novel',
  35: 'Card & Board Game',
  36: 'MOBA'
}

// Reverse mapping: Name to ID
export const GENRE_NAME_TO_ID: Record<string, number> = Object.fromEntries(
  Object.entries(GENRE_MAP).map(([id, name]) => [name, parseInt(id)])
)

// Common genre names used in the UI mapped to their IDs
export const UI_GENRE_MAP: Record<string, number> = {
  'RPG': 12,
  'Action': 25, // Using Hack and slash/Beat 'em up as closest match
  'Adventure': 31,
  'Strategy': 15,
  'Simulation': 13,
  'Sports': 14,
  'Racing': 10,
  'Puzzle': 9,
  'Horror': 19,
  'Platformer': 8,
  'Shooter': 5,
  'Fighting': 4,
  'Open World': 31, // Using Adventure as closest match
  'Indie': 32,
  'Fantasy': 12, // Using RPG as closest match
  'Sci-Fi': 12, // Using RPG as closest match
  'Co-op': 31, // Using Adventure as closest match
  'Multiplayer': 36 // Using MOBA as closest match
}

export function getGenreIdByName(name: string): number | null {
  return UI_GENRE_MAP[name] || GENRE_NAME_TO_ID[name] || null
}

export function getGenreNameById(id: number): string | null {
  return GENRE_MAP[id] || null
}

export function translateGenreNamesToIds(genreNames: string[]): number[] {
  return genreNames
    .map(name => getGenreIdByName(name))
    .filter((id): id is number => id !== null)
}