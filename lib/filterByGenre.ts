export function filterByGenre<T extends { genres?: any }>(
  games: T[],
  genreIds?: number[]
): { filteredGames: T[]; logString: string } {
  if (!genreIds || genreIds.length === 0) {
    return { filteredGames: games, logString: '(none)' }
  }

  const filteredGames = games.filter((game) => {
    if (!game.genres) return false

    let genres: any[] = []
    if (typeof game.genres === 'string') {
      try {
        genres = JSON.parse(game.genres)
      } catch {
        return false
      }
    } else if (Array.isArray(game.genres)) {
      genres = game.genres
    }

    // Check that game contains ALL selected genres
    return genreIds.every((id) => genres.some((g: any) => g.id === id))
  })

const genreNames = genreIds
  .map((id) => {
    const match = filteredGames
      .flatMap(g => typeof g.genres === 'string' ? JSON.parse(g.genres) : g.genres)
      .find((g: any) => g.id === id)
    return match ? `${match.id}(${match.name})` : id
  })
  .join(', ')

  return { filteredGames, logString: genreNames || '(none)' }
}
