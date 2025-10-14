import type { Metadata } from 'next'
import './globals.css'
import { ConditionalLayout } from '@/components/conditional-layout'
import { AuthProvider } from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: 'PlayMatch',
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
        <AuthProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AuthProvider>
      </body>
    </html>
  )
}