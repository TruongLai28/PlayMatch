import { supabase } from './lib/supabase.ts'

// Simple test to see what columns exist in games table
export async function testGameColumns() {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Error:', error)
      return null
    }
    
    if (data && data.length > 0) {
      console.log('Available columns in games table:', Object.keys(data[0]))
      console.log('Sample game data:', JSON.stringify(data[0], null, 2))
      return data[0]
    }
    
    return null
  } catch (err) {
    console.error('Test failed:', err)
    return null
  }
}

// Test if the games table exists and what it contains
testGameColumns()