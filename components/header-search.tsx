"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function HeaderSearch() {
  return (
    <div className="flex w-full items-center gap-4">
      {/* Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">PlayMatch</h1>
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
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-[min(520px,60vw)] rounded-md bg-background p-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <Input placeholder="Search games, genres, platforms..." className="h-9" />
                  <Button variant="default">Search</Button>
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
