'use client'

import { usePathname } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarFloatingTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { PinnedCardProvider } from '@/components/pinned-card-context'
import { ConditionalHeader } from '@/components/conditional-header'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
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
          <ConditionalHeader />
          {children}
        </SidebarInset>
      </PinnedCardProvider>
    </SidebarProvider>
  )
}