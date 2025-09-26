import type { Metadata } from 'next'
import './globals.css'
import { SidebarProvider, SidebarInset, SidebarFloatingTrigger } from '@/components/ui/sidebar'
import { HeaderSearch } from '@/components/header-search'
import { AppSidebar } from '@/components/app-sidebar'
import { PinnedCardProvider } from '@/components/pinned-card-context'
import { CategoryBar } from '@/components/CategoryBar'

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
          <PinnedCardProvider>
            <AppSidebar />

            {/* Put header inside the inset so it's not pushed by the sidebar gap */}
            {/* Collapsed toggle icon in the top-left corner */}
            <SidebarFloatingTrigger />
            <SidebarInset>
              <header className="z-20 w-full bg-transparent">
                <div className="mx-auto w-full max-w-3xl px-4 py-3">
                  <div className="mx-auto bg-background border border-sidebar-border/40 rounded-xl shadow-sm">
                    <div className="flex items-center gap-4 p-3">
                      <HeaderSearch />
                    </div>
                  </div>
                </div>
              </header>

              <CategoryBar />

              {children}
            </SidebarInset>
          </PinnedCardProvider>
        </SidebarProvider>
      </body>
    </html>
  )
}
