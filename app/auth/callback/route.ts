import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import pkg from 'pg'
const { Client } = pkg

export async function GET(request: Request) {
  console.log('🔵 Auth callback route HIT')
  
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  console.log('🔵 Code from URL:', code ? 'EXISTS' : 'MISSING')

  if (code) {
    console.log('🔵 Exchanging code for session...')
    
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('🔵 Session exchange result:', { 
      hasSession: !!data.session, 
      hasUser: !!data.user,
      userId: data.user?.id,
      email: data.user?.email,
      error: error?.message 
    })
    
    // Register user directly in database
    if (data.session && data.user) {
      console.log('🔵 Starting user registration...')
      
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      })

      try {
        console.log('🔵 Connecting to database...')
        await client.connect()
        console.log('🔵 Database connected')
        
        const userId = data.user.id
        const email = data.user.email
        const username = data.user.user_metadata?.name || email?.split('@')[0]

        console.log('🔵 Inserting user:', { userId, email, username })

        const result = await client.query(`
          INSERT INTO users (id, email, username, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
          RETURNING *
        `, [userId, email, username])

        console.log('✅ User registered:', result.rows[0] || 'User already exists')
      } catch (error) {
        console.error('❌ Registration error:', error)
      } finally {
        await client.end()
        console.log('🔵 Database connection closed')
      }
    } else {
      console.log('🔴 No session or user found!')
    }
  } else {
    console.log('🔴 No code in URL!')
  }

  console.log('🔵 Redirecting to /home')
  return NextResponse.redirect(new URL('/home', request.url))
}