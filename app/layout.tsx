import type { Metadata } from 'next'
import './globals.css'
import { SidebarProvider, SidebarInset, SidebarFloatingTrigger } from '@/components/ui/sidebar'
import { HeaderSearch } from '@/components/header-search'
import { AppSidebar } from '@/components/app-sidebar'

export const metadata: Metadata = {
  title: 'PlayMatch - Game Recommendations',
  description: 'Discover your next favorite game with personalized recommendations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white font-netflix antialiased">
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />

          {/* Put header inside the inset so it's not pushed by the sidebar gap */}
          {/* Collapsed toggle icon in the top-left corner */}
          <SidebarFloatingTrigger />
          <SidebarInset>
            <header className="z-20 w-full border-b border-sidebar-border bg-background/60 backdrop-blur-sm">
              <div className="mx-auto flex max-w-7xl items-center gap-4 p-3">
                <HeaderSearch />
              </div>
            </header>

            {children}
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  )
}
