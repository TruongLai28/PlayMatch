'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Gamepad2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Game {
  id: number
  name: string
  cover?: { url: string } | string
  total_rating?: number
  rating?: number
}

// Data for the features section
const features = [
  {
    title: 'Recommendations',
    description: 'Get accurate recommendations based on games you play!'
  },
  {
    title: 'Rate?',
    description: 'Rate everything you play to build your taste profile.'
  },
  {
    title: 'Track',
    description: 'Keep track of what you play with your library.'
  },
  {
    title: 'Collections',
    description: 'Create your own private collections of games.'
  }
]

export default function HomePage() {
  const [featuredGames, setFeaturedGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchFeaturedGames()
  }, [])

  const fetchFeaturedGames = async () => {
    try {
      console.log('Fetching featured games...')
      const response = await fetch('/api/games/popular?limit=6')
      console.log('API Response status:', response.status)
      
      if (response.ok) {
        const games = await response.json()
        console.log('Games received:', games)
        console.log('Number of games:', games?.length)
        setFeaturedGames(games || [])
      } else {
        console.error('API Response not ok:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching featured games:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCoverUrl = (cover?: { url: string } | string) => {
    if (!cover) {
      return 'https://placehold.co/400x600/1f1f2b/5d4af8?text=No+Cover'
    }
    
    const url = typeof cover === 'string' ? cover : cover.url
    if (!url) {
      return 'https://placehold.co/400x600/1f1f2b/5d4af8?text=No+Cover'
    }
    
    // IGDB URLs come in different formats, let's handle them properly
    if (url.startsWith('//')) {
      return 'https:' + url.replace('t_thumb', 't_cover_big')
    }
    
    return url.replace('t_thumb', 't_cover_big')
  }

  const getRating = (game: Game) => {
    const rating = game.total_rating || game.rating
    return rating ? Math.round(rating / 10) : null
  }

  const handleGetStarted = () => {
    router.push('/login')
  }

  const handleRecommendations = () => {
    router.push('/recommendations')
  }

  const handleExplore = () => {
    router.push('/home')
  }

  const handlePopularGames = () => {
    router.push('/home?category=popular')
  }

  const handleSearch = async () => {
    if (!searchInput.trim()) return

    try {
      const seedId = parseInt(searchInput)
      if (isNaN(seedId)) {
        alert('Please enter a valid game ID number')
        return
      }

      const response = await fetch(`/api/games/search?seedId=${seedId}`)
      const data = await response.json()

      if (response.ok && data.results?.length > 0) {
        router.push(`/recommendations?seedId=${searchInput}`)
      } else {
        alert(data.error || 'No game found with that ID')
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Search failed. Please try again.')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleNewReleases = () => {
    router.push('/home?category=new-releases')
  }

  const handleTopRated = () => {
    router.push('/home?category=top-rated')
  }

  // Use real games for posters if available, otherwise use placeholders
  const realGames = featuredGames.length > 0 
    ? featuredGames.slice(0, 6).map((game) => ({
        rating: getRating(game)?.toString(),
        src: getCoverUrl(game.cover),
        alt: game.name
      }))
    : []

  // Fill remaining slots with placeholders if needed
  const placeholderGames = [
    { rating: '96', src: 'https://placehold.co/400x600/e8e8e8/000?text=GAME+1', alt: 'Game 1' },
    { rating: '77', src: 'https://placehold.co/400x600/cccccc/000?text=GAME+2', alt: 'Game 2' },
    { src: 'https://placehold.co/400x600/a0a0a0/000?text=GAME+3', alt: 'Game 3' },
    { rating: '73', src: 'https://placehold.co/400x600/d9d9d9/000?text=GAME+4', alt: 'Game 4' },
    { rating: '88', src: 'https://placehold.co/400x600/b3b3b3/000?text=GAME+5', alt: 'Game 5' },
    { rating: '70', src: 'https://placehold.co/400x600/f0f0f0/000?text=GAME+6', alt: 'Game 6' },
  ]

  const posters = realGames.length > 0 
    ? [...realGames, ...placeholderGames].slice(0, 6)
    : placeholderGames

  console.log('Featured games:', featuredGames)
  console.log('Real games:', realGames)
  console.log('Final posters:', posters)

  return (
    <>
      <style jsx>{`
        :root {
          --background-color: #14141c;
          --secondary-bg-color: #1f1f2b;
          --text-color: #ffffff;
          --text-muted-color: #a0a0b0;
          --primary-color: #5d4af8;
          --border-color: rgba(255, 255, 255, 0.1);
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Inter', sans-serif;
          background-color: var(--background-color);
          color: var(--text-color);
        }
        main {
          outline: none;
          border: none;
        }
        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 40px;
          outline: none;
          border: none;
        }
        .header-container {
          max-width: none;
          margin: 0;
          padding: 0 20px;
        }
        .main-header {
          padding: 20px 0;
          border-bottom: 1px solid var(--border-color);
        }
        .main-nav {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: 30px;
          width: 100%;
        }
        .nav-left, .nav-center {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .nav-left {
          margin-right: 0;
        }
        .nav-center {
          margin-right: auto;
        }
        .nav-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
          font-size: 2.2rem;
          letter-spacing: -1px;
          color: var(--text-color);
        }
        .logo svg {
          color: var(--primary-color);
        }
        .nav-link {
          color: var(--text-muted-color);
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.2s;
          cursor: pointer;
        }
        .nav-link:hover {
          color: var(--text-color);
        }
        .search-container {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 300px;
        }
        .search-input {
          flex: 1;
          height: 36px !important;
          font-size: 0.9rem;
          background-color: var(--secondary-bg-color);
          border: 1px solid var(--border-color);
          color: var(--text-color);
        }
        .search-input::placeholder {
          color: var(--text-muted-color);
        }
        .search-button {
          height: 36px;
          width: 36px;
          padding: 0;
          color: var(--primary-color);
        }
        .search-button:hover {
          background-color: var(--primary-color);
          color: white;
        }
        .hero-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
          padding: 100px 0;
          outline: none;
          border: none;
        }
        .hero-content h1 {
          font-size: 5rem;
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 30px;
          letter-spacing: -2px;
        }
        .hero-content p {
          font-size: 1.4rem;
          color: var(--text-muted-color);
          margin-bottom: 40px;
          line-height: 1.5;
        }
        .poster-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          transform: rotate(-5deg);
        }
        .poster-card {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          transform-style: preserve-3d;
          perspective: 1000px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
          transform: rotateX(5deg) rotateY(-5deg);
        }
        .poster-card:hover {
          transform: rotateX(0deg) rotateY(0deg) translateY(-10px) scale(1.05);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        .poster-card img {
          width: 100%;
          height: auto;
          display: block;
          transition: transform 0.3s ease;
        }
        .poster-card:hover img {
          transform: scale(1.02);
        }
        .poster-rating {
          position: absolute;
          top: 12px;
          right: 12px;
          background: linear-gradient(135deg, rgba(93, 74, 248, 0.9), rgba(124, 58, 237, 0.9));
          color: white;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 15px rgba(93, 74, 248, 0.3);
          z-index: 2;
          transition: transform 0.3s ease;
        }
        .poster-card:hover .poster-rating {
          transform: scale(1.1);
        }
        .features-section {
          background-color: var(--secondary-bg-color);
          padding: 60px 0;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 30px;
        }
        .feature-card {
          background: linear-gradient(135deg, #5d4af8 0%, #7c3aed 100%);
          padding: 24px;
          border-radius: 12px;
          border: 1px solid rgba(93, 74, 248, 0.3);
          box-shadow: 0 4px 20px rgba(93, 74, 248, 0.2);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(93, 74, 248, 0.3);
        }
        .feature-card h3 {
          font-size: 1.2rem;
          margin-bottom: 10px;
          color: #ffffff;
          font-weight: 600;
        }
        .feature-card p {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.5;
        }
        .scrolling-banner {
          background-color: var(--primary-color);
          padding: 20px 0;
          overflow: hidden;
          white-space: nowrap;
          position: relative;
        }
        .scrolling-container {
          display: flex;
          animation: scroll 30s linear infinite;
        }
        .scrolling-text {
          display: inline-block;
          font-size: 2.5rem;
          font-weight: 900;
          color: white;
          text-transform: uppercase;
          letter-spacing: 4px;
          white-space: nowrap;
          padding-right: 2rem;
        }
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @media (max-width: 992px) {
          .container {
            padding: 0 30px;
          }
          .header-container {
            padding: 0 15px;
          }
          .hero-section {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 40px;
            padding: 80px 0;
          }
          .hero-content h1 {
            font-size: 4rem;
          }
          .poster-grid {
            grid-template-columns: repeat(4, 1fr);
            margin-top: 40px;
            transform: rotate(0deg);
          }
          .poster-card {
            transform: rotateX(3deg) rotateY(-3deg);
          }
          .poster-card:hover {
            transform: rotateX(0deg) rotateY(0deg) translateY(-5px) scale(1.03);
          }
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .search-container {
            min-width: 200px;
          }
          .nav-link {
            display: none;
          }
          .main-nav {
            gap: 15px;
          }
          .logo {
            font-size: 2rem;
          }
          .scrolling-text {
            font-size: 2rem;
          }
        }
        @media (max-width: 768px) {
          .container {
            padding: 0 20px;
          }
          .header-container {
            padding: 0 10px;
          }
          .logo {
            font-size: 1.8rem;
            gap: 10px;
          }
          .hero-content h1 { 
            font-size: 3rem; 
          }
          .hero-content p {
            font-size: 1.2rem;
          }
          .features-grid {
            grid-template-columns: 1fr;
          }
          .poster-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .poster-card {
            transform: rotateX(2deg) rotateY(-2deg);
          }
          .poster-card:hover {
            transform: rotateX(0deg) rotateY(0deg) translateY(-3px) scale(1.02);
          }
          .search-container {
            min-width: 150px;
          }
          .main-nav {
            gap: 10px;
          }
          .scrolling-text {
            font-size: 1.5rem;
            letter-spacing: 2px;
          }
        }
      `}</style>
      
      <header className="main-header">
        <div className="header-container">
          <nav className="main-nav">
            <div className="nav-left">
              <div className="logo">
                <Gamepad2 className="h-8 w-8" />
                <span>PlayMatch</span>
              </div>
            </div>
            <div className="nav-center">
              <div className="search-container">
                <Input 
                  placeholder="Enter game ID (e.g. 1942)" 
                  className="search-input"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  type="number"
                />
                <Button variant="ghost" size="sm" onClick={handleSearch} className="search-button">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="nav-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <span className="nav-link">Recommendations</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[var(--secondary-bg-color)] border-[var(--border-color)]">
                  <DropdownMenuItem onClick={handleRecommendations} className="text-[var(--text-color)] hover:bg-[var(--primary-color)]/20">
                    Personal Recommendations
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePopularGames} className="text-[var(--text-color)] hover:bg-[var(--primary-color)]/20">
                    Popular Games
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleTopRated} className="text-[var(--text-color)] hover:bg-[var(--primary-color)]/20">
                    Top Rated
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleNewReleases} className="text-[var(--text-color)] hover:bg-[var(--primary-color)]/20">
                    New Releases
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="nav-link" onClick={handleExplore}>Explore</span>
              <span className="nav-link" onClick={() => router.push('/login')} >Sign In</span>
              <Button className="bg-[#5d4af8] hover:bg-[#5d4af8]/90" onClick={() => router.push('/login')}>
                Sign Up
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero-section container">
          <div className="hero-content">
            <h1>Play Your Way!</h1>
            <p>Personalized recommendations for games.</p>
            <Button 
              onClick={handleGetStarted}
              className="bg-[#5d4af8] hover:bg-[#5d4af8]/90"
              style={{ padding: '15px 30px', fontSize: '1.1rem' }}
            >
              Get started for free!
            </Button>
          </div>
          <div className="poster-grid">
            {posters.map((poster, index) => (
              <div className="poster-card" key={index}>
                {poster.rating && <span className="poster-rating">{poster.rating}</span>}
                <img 
                  src={poster.src} 
                  alt={poster.alt || `Game Poster ${index + 1}`} 
                  width={400} 
                  height={600}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-game.svg'
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="scrolling-banner">
          <div className="scrolling-container">
            <div className="scrolling-text">
              PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH •
            </div>
            <div className="scrolling-text">
              PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH • PLAYMATCH •
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="container features-grid">
            {features.map((feature, index) => (
              <div className="feature-card" key={index}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
