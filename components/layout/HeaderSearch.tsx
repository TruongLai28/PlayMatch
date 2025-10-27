"use client"

import * as React from "react"
import { Search, Gamepad2, User, X, LogOut } from "lucide-react"
import { usePathname, useRouter } from 'next/navigation'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export function HeaderSearch() {
  const [searchInput, setSearchInput] = React.useState('')
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [userEmail, setUserEmail] = React.useState<string | null>(null)
  const [genres, setGenres] = React.useState<Array<{ id?: number; name: string }>>([])
  const [genresLoading, setGenresLoading] = React.useState(false)
  const pathname = usePathname() ?? '/'
  const router = useRouter()

  // Lazy-load genres when the modal is first opened
  React.useEffect(() => {
    const loadGenres = async () => {
      if (!isSearchOpen || genres.length > 0) return
      try {
        setGenresLoading(true)
        const res = await fetch('/api/games/genres')
        const json = await res.json()
        if (res.ok && Array.isArray(json.genres)) {
          setGenres(json.genres)
        } else {
          console.warn('Genres response not OK:', json)
          setGenres([])
        }
      } catch (e) {
        console.error('Failed to load genres', e)
        setGenres([])
      } finally {
        setGenresLoading(false)
      }
    }
    loadGenres()
  }, [isSearchOpen, genres.length])

  // Lazy-load basic user info when profile modal opens
  React.useEffect(() => {
    const loadUser = async () => {
      if (!isProfileOpen) return
      try {
        const { data } = await supabase.auth.getUser()
        setUserEmail(data.user?.email ?? null)
      } catch (e) {
        console.warn('Failed to load user', e)
        setUserEmail(null)
      }
    }
    loadUser()
  }, [isProfileOpen])

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

  // Show the pill navigation on all pages except the landing page '/'
  if (`${pathname}` !== '/') {
    const NavItem = ({
      href,
      children,
    }: {
      href: string
      children: React.ReactNode
    }) => {
  const currentPath = `${pathname}`
  const isActive = href === '/' ? currentPath === '/' : currentPath.startsWith(href)
      return (
        <button
          onClick={() => router.push(href)}
          className={`px-3 py-1 rounded-full text-sm transition-colors duration-150 ${isActive ? 'bg-[#5d4af8] text-white font-semibold' : 'text-[#a0a0b0] hover:bg-[#5d4af8]/10'} focus:outline-none focus:ring-0`}
          aria-current={isActive ? 'page' : undefined}
        >
          {children}
        </button>
      )
    }

    return (
      <div className="flex w-full items-center">
        <div className="mx-auto">
          <nav className="inline-flex items-center gap-2 text-sm rounded-full px-2 py-1 bg-[#5d4af8]/15 backdrop-blur-md shadow-sm">
            {/* Brand inside the pill */}
            <button
              onClick={() => router.push('/home')}
              className="mr-1 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm text-[#e6e6ff] hover:bg-[#5d4af8]/10 focus:outline-none focus:ring-0"
              aria-label="PlayMatch Home"
            >
              <Gamepad2 className="h-4 w-4 text-[#cfd6ff]" />
              <span className="font-semibold tracking-tight">PlayMatch</span>
            </button>
            <NavItem href="/home">Home</NavItem>
            <NavItem href="/home">Games</NavItem>

            {/* inline search input inside the pill */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="ml-1 p-1 rounded-full bg-transparent hover:bg-[#5d4af8]/10 focus:outline-none focus:ring-0"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-[#cfd6ff]" />
            </button>


            {/* Profile icon inside the pill */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="ml-1 p-1 rounded-full bg-transparent hover:bg-[#5d4af8]/10 focus:outline-none focus:ring-0"
              aria-label="Profile"
            >
              <User className="h-5 w-5 text-[#cfd6ff]" />
            </button>
          </nav>
          {/* Search Modal Overlay (UI only, no functional search) */}
          {isSearchOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setIsSearchOpen(false)}
                aria-hidden="true"
              />
              {/* Modal Panel */}
              <div className="relative w-full max-w-5xl rounded-2xl border border-white/10 bg-[#0f1220]/90 shadow-2xl">
                {/* Close button */}
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-3 top-3 rounded-full p-2 text-zinc-300 hover:bg-white/10 focus:outline-none"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="p-4 sm:p-6">
                  {/* Top search input */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 border-b border-white/20 pb-3">
                      <Search className="h-5 w-5 text-zinc-300" />
                      <input
                        type="text"
                        placeholder="Search games…"
                        className="w-full bg-transparent text-zinc-200 placeholder:text-zinc-400 outline-none"
                      />
                    </div>
                  </div>

                  {/* Filters row */}
                  <div className="mb-3 text-sm text-zinc-300">Filters:</div>
                  <div className="mb-5 flex flex-wrap items-center gap-3">
                    <button className="rounded-md bg-white/10 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/15">All Types</button>
                    <button className="rounded-md bg-white/10 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/15">Most Popular ▾</button>
                    <button className="rounded-md bg-white/10 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/15">Year ▾</button>
                    <button className="rounded-md bg-red-600/90 px-3 py-1.5 text-sm text-white hover:bg-red-600">× Clear</button>
                  </div>

                  {/* Genres grid (chips) */}
                  <div className="mb-3 text-sm text-zinc-300">Filter by Genre</div>
                  <div className="flex flex-wrap gap-2">
                    {genresLoading && (
                      <span className="select-none rounded-full bg-white/10 px-3 py-1 text-sm text-zinc-400">Loading…</span>
                    )}
                    {!genresLoading && genres.length === 0 && (
                      <span className="select-none rounded-full bg-white/10 px-3 py-1 text-sm text-zinc-400">No genres found</span>
                    )}
                    {!genresLoading && genres.map((g) => (
                      <span
                        key={g.id ?? g.name}
                        className="select-none rounded-full bg-white/10 px-3 py-1 text-sm text-zinc-200 hover:bg-white/15"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Profile Modal Overlay */}
          {isProfileOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setIsProfileOpen(false)}
                aria-hidden="true"
              />
              {/* Modal Panel */}
              <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1220]/90 shadow-2xl">
                {/* Close button */}
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="absolute right-3 top-3 rounded-full p-2 text-zinc-300 hover:bg-white/10 focus:outline-none"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="p-5">
                  <div className="mb-4">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                        <User className="h-5 w-5 text-[#cfd6ff]" />
                      </div>
                      <div>
                        <div className="text-sm text-zinc-400">Signed in</div>
                        <div className="text-zinc-100 font-medium">{userEmail ?? 'Account'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 grid gap-2">
                    <button
                      onClick={() => { setIsProfileOpen(false); router.push('/profile') }}
                      className="w-full justify-start rounded-md bg-white/10 px-3 py-2 text-left text-zinc-200 hover:bg-white/15"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await supabase.auth.signOut()
                        } finally {
                          setIsProfileOpen(false)
                          router.push('/login')
                        }
                      }}
                      className="mt-2 inline-flex w-full items-center justify-between rounded-md bg-red-600/90 px-3 py-2 text-left text-white hover:bg-red-600"
                    >
                      <span>Sign out</span>
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full items-center gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Gamepad2 className="h-6 w-6 text-[#5d4af8]" />
      </div>

      {/* Search trigger placed directly alongside the title */}
      <div className="relative">
        <Collapsible asChild>
          <div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon">
                <Search />
                <span className="sr-only">Open search</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {/* Inline search bar that opens to the right of the trigger and is vertically centered */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-[min(520px,60vw)] rounded-md bg-background p-2 shadow-lg border">
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="Enter game ID (e.g. 1942)" 
                    className="h-9"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    type="number"
                  />
                  <Button variant="default" onClick={handleSearch}>
                    Search
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      <div className="ml-auto" />
    </div>
  )
}
