'use client'

import { usePathname } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarFloatingTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './Sidebar'
import { PinnedCardProvider } from '@/features/game'
import { Header } from './Header'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  
  const noLayoutPages = ['/', '/login', '/auth/callback']
  const shouldShowLayout = !noLayoutPages.includes(pathname)

  // No sidebar/header for landing, login, and auth pages
  if (!shouldShowLayout) {
    return (
      <PinnedCardProvider>
        {children}
      </PinnedCardProvider>
    )
  }

  // Authenticated pages - with sidebar and header
  return (
    <SidebarProvider defaultOpen={true}>
      <PinnedCardProvider>
        <AppSidebar />
        <SidebarFloatingTrigger />
        <SidebarInset>
          <Header />
          {children}
        </SidebarInset>
      </PinnedCardProvider>
    </SidebarProvider>
  )
}