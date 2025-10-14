'use client'

import { usePathname } from 'next/navigation'
import { HeaderSearch } from '@/components/header-search'

export function ConditionalHeader() {
  const pathname = usePathname()
  const noHeaderPages = ['/', '/login', '/auth/callback']
  
  if (noHeaderPages.includes(pathname)) {
    return null
  }

  return (
    <header className="z-20 w-full bg-transparent">
      <div className="mx-auto w-full max-w-3xl px-4 py-3">
        <div className="mx-auto bg-background border border-sidebar-border/40 rounded-xl shadow-sm">
          <div className="flex items-center gap-4 p-3">
            <HeaderSearch />
          </div>
        </div>
      </div>
    </header>
  )
}