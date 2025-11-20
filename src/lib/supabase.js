import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const missingUrl = !supabaseUrl || supabaseUrl.includes('YOUR_SUPABASE')
const missingKey = !supabaseAnonKey || supabaseAnonKey.includes('YOUR_SUPABASE')

export const isSupabaseConfigured = !(missingUrl || missingKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      multiTab: true,
    },
  })
  : null

