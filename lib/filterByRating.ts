export function filterByRating<T extends { rating?: number | null }>(
  games: T[],
  minRating?: number,
  maxRating?: number
): { filteredGames: T[]; logString: string } {
  if (minRating === undefined && maxRating === undefined) {
    return { filteredGames: games, logString: '(none)' }
  }

  const filteredGames = games.filter((game) => {
    if (game.rating == null) return false;
  
    let min = minRating;
    let max = maxRating;
  
    if (min !== undefined && max !== undefined && min === max) {
      // allow a ±0.5 buffer so user input 90 matches 89.5–90.5
      min = min - 0.5;
      max = max + 0.5;
    }
  
    if (min !== undefined && max !== undefined) {
      return game.rating >= min && game.rating <= max;
    } else if (min !== undefined) {
      return game.rating >= min;
    } else if (max !== undefined) {
      return game.rating <= max;
    }
  
    return true;
  });


  const logString =
    filteredGames.length > 0
      ? `min=${minRating ?? '-∞'} max=${maxRating ?? '+∞'}`
      : '(none)'

  return { filteredGames, logString }
}
