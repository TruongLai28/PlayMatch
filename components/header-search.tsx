"use client"

import * as React from "react"
import { Search, Gamepad2 } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function HeaderSearch() {
  const [searchInput, setSearchInput] = React.useState('')
  const router = useRouter()

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
