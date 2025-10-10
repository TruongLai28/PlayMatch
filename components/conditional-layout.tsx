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
  
  // Landing page layout - no sidebar
  if (pathname === '/') {
    return (
      <PinnedCardProvider>
        {children}
      </PinnedCardProvider>
    )
  }

  // Other pages layout - with sidebar
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