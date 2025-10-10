import type { Metadata } from 'next'
import './globals.css'
import { ConditionalLayout } from '@/components/conditional-layout'


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
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </body>
    </html>
  )
}
