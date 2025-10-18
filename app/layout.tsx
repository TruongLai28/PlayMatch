import type { Metadata } from 'next'
import './globals.css'
import { Layout } from '@/components/layout'
import { AuthProvider } from '@/features/auth'

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
          <Layout>
            {children}
          </Layout>
        </AuthProvider>
      </body>
    </html>
  )
}