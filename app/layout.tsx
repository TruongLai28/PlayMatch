import type { Metadata } from 'next'
import './globals.css'
import { Layout } from '@/components/layout'
import { AuthProvider } from '@/features/auth'
import { Toaster } from 'sonner'

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
        <Toaster 
          theme="dark" 
          position="top-right"
          toastOptions={{
            style: {
              background: 'hsl(0 0% 9%)',
              border: '1px solid hsl(240 3.7% 15.9%)',
              color: 'hsl(0 0% 98%)',
            },
          }}
        />
      </body>
    </html>
  )
}