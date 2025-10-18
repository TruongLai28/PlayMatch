'use client'

import { GameCard } from './GameCard'

interface Game {
  id: number
  name: string
  cover?: {
    url: string
  }
  summary?: string
  rating?: number
  genres?: Array<{ name: string }>
}

interface GameGridProps {
  games: Game[]
  title?: string
}

export function GameGrid({ games, title }: GameGridProps) {
  return (
    <div className="px-4 md:px-8 lg:px-12">
      {title && (
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white">
          {title}
        </h2>
      )}
     
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  )
}