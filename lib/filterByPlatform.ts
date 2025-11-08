export function filterByPlatform<T extends { platforms?: any }>(
  games: T[],
  platformIds?: number[]
): { filteredGames: T[]; logString: string } {
  if (!platformIds || platformIds.length === 0) {
    return { filteredGames: games, logString: '(none)' }
  }

  const filteredGames = games.filter((game) => {
    if (!game.platforms) return false

    let platforms: any[] = []
    if (typeof game.platforms === 'string') {
      try {
        platforms = JSON.parse(game.platforms)
      } catch {
        return false
      }
    } else if (Array.isArray(game.platforms)) {
      platforms = game.platforms
    }

    // Check that game contains ALL selected platforms
    return platformIds.every((id) => platforms.some((p: any) => p.id === id))
  })

  const platformNames = platformIds
    .map((id) => {
      const match = filteredGames
        .flatMap((g) =>
          typeof g.platforms === 'string' ? JSON.parse(g.platforms) : g.platforms
        )
        .find((p: any) => p.id === id)
      return match ? `${match.id}(${match.name})` : id
    })
    .join(', ')

  return { filteredGames, logString: platformNames || '(none)' }
}
