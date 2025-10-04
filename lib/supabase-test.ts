import { supabase } from './supabase'

export async function testSupabaseConnection() {
  try {
    // Test the connection by querying a simple table
    const { data, error } = await supabase
      .from('games')
      .select('id, name')
      .limit(1)

    if (error) {
      console.error('Supabase connection error:', error)
      return { success: false, error: error.message }
    }

    console.log('Supabase connection successful!')
    console.log('Sample data:', data)
    return { success: true, data }
  } catch (err) {
    console.error('Connection test failed:', err)
    return { success: false, error: 'Connection failed' }
  }
}

export async function getGameCount() {
  try {
    const { count, error } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true })

    if (error) {
      throw error
    }

    return count
  } catch (err) {
    console.error('Error getting game count:', err)
    return null
  }
}