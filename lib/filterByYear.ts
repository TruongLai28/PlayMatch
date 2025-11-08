export function filterByYear<T extends { first_release_date?: string | null }>(
  games: T[],
  year?: number
): { filteredGames: T[]; logString: string } {
  if (!year) {
    return { filteredGames: games, logString: '(none)' }
  }

  const filteredGames = games.filter((game) => {
    if (!game.first_release_date) return false

    try {
      const gameYear = new Date(game.first_release_date).getFullYear()
      return gameYear === year
    } catch {
      return false
    }
  })

  const logString = filteredGames.length > 0 ? `${year}` : '(none)'

  return { filteredGames, logString }
}
