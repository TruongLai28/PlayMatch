'use client'

import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Footer } from './Footer'
// Sidebar removed per request: no SidebarProvider or AppSidebar rendered

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  
  const noLayoutPages = ['/', '/login', '/auth/callback']
  const shouldShowLayout = !noLayoutPages.includes(pathname)

  // No sidebar/header for landing, login, and auth pages
  if (!shouldShowLayout) {
    return children
  }

  // Authenticated pages - with header and footer
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}