import { NextResponse } from 'next/server'
import pkg from 'pg'
const { Client } = pkg

/**
 * @swagger
 * /api/create-tables:
 *   post:
 *     tags:
 *       - Database Setup
 *     summary: Create database tables for the game recommender system
 *     description: Creates all necessary tables (users, games, user_preferences, user_ratings, recommendations) in the PostgreSQL database
 *     requestBody:
 *       required: false
 *     responses:
 *       200:
 *         description: All tables created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Database setup complete!"
 *                 results:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Table 1 created successfully", "Table 2 created successfully"]
 *       500:
 *         description: Database setup failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Database setup failed"
 *                 details:
 *                   type: string
 *                   example: "Connection string not provided"
 */
export async function POST() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    await client.connect()

    const tables = [
      // Enable pgvector extension first
      `CREATE EXTENSION IF NOT EXISTS vector`,
      
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR UNIQUE NOT NULL,
        username VARCHAR UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Games table with vector embedding
      `CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY,
        name VARCHAR NOT NULL,
        summary TEXT,
        rating DECIMAL,
        cover_url VARCHAR,
        first_release_date BIGINT,
        genres JSONB,
        platforms JSONB,
        themes JSONB,
        keywords JSONB,
        game_modes JSONB,
        player_perspectives JSONB,
        age_ratings JSONB,
        companies JSONB,
        similar_games JSONB,
        screenshots JSONB,
        embedding vector(384),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // User preferences table
      `CREATE TABLE IF NOT EXISTS user_preferences (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        preferred_genres JSONB,
        preferred_platforms JSONB,
        preferred_themes JSONB,
        preferred_game_modes JSONB,
        min_rating DECIMAL DEFAULT 0,
        max_rating DECIMAL DEFAULT 100,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      )`,
      
      // User ratings table
      `CREATE TABLE IF NOT EXISTS user_ratings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 10),
        review TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, game_id)
      )`,
      
      // Recommendations table
      `CREATE TABLE IF NOT EXISTS recommendations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
        score DECIMAL,
        reason VARCHAR,
        recommendation_type VARCHAR DEFAULT 'general',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, game_id, recommendation_type)
      )`
    ]

    const results = []
    
    for (let i = 0; i < tables.length; i++) {
      await client.query(tables[i])
      results.push(`Table ${i + 1} created successfully`)
    }

    return NextResponse.json({ 
      message: 'Database setup complete!',
      results
    })

  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json({ 
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await client.end()
  }
}

/**
 * @swagger
 * /api/create-tables:
 *   get:
 *     tags:
 *       - Database Setup
 *     summary: Get information about database table creation
 *     description: Returns information about the database tables that can be created and instructions for setup
 *     responses:
 *       200:
 *         description: Information about database tables
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Use POST method to create tables"
 *                 tables:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["users", "games", "user_preferences", "user_ratings", "recommendations"]
 *                 environment:
 *                   type: object
 *                   properties:
 *                     required_env:
 *                       type: string
 *                       example: "DATABASE_URL"
 */
export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST method to create tables',
    tables: [
      'users - User profiles and authentication',
      'games - Cached game data from IGDB',
      'user_preferences - User gaming preferences',
      'user_ratings - User game ratings and reviews',
      'recommendations - Generated recommendations'
    ],
    environment: {
      required_env: 'DATABASE_URL',
      note: 'Make sure to set DATABASE_URL in your .env.local file'
    }
  })
}