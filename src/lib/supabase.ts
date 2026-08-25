import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://karxvjwlbuhthixrktrb.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imthcnh2andsYnVodGhpeHJrdHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2MDcxNjYsImV4cCI6MjEwMzE4MzE2Nn0.MTr5GLc0YREkGbNbljp7DS9R83t4K3CEFKOEeleGuQ4'

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}
