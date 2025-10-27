'use client'

import { usePathname } from 'next/navigation'
import { HeaderSearch } from './HeaderSearch'

export function Header() {
  const pathname = usePathname()
  const noHeaderPages = ['/', '/login', '/auth/callback', '/docs']
  
  if (noHeaderPages.includes(pathname)) {
    return null
  }

  return (
    <header className={`sticky top-3 z-40 w-full bg-transparent`}>
      <div className="mx-auto w-full max-w-3xl px-4 py-3">
        <div className="mx-auto flex items-center justify-center gap-4 p-3">
          <HeaderSearch />
        </div>
      </div>
    </header>
  )
}