import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_URL = 'https://rqmgvwcqfbfnrixxvgza.supabase.co'
const DEFAULT_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxbWd2d2NxZmJmbnJpeHh2Z3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NTM1MTksImV4cCI6MjEwNDEyOTUxOX0.jzBp8hOf2BV6noenjBV3TO1HifJWZzDedzXd7GbV8OM'

export const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL
export const getSupabaseAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON

let _client: SupabaseClient | null = null

export const getSupabaseClient = (): SupabaseClient => {
  if (!_client) {
    _client = createClient(getSupabaseUrl(), getSupabaseAnonKey())
  }
  return _client
}

// Lazy proxy so importing `supabase` never crashes during Next.js build-time module evaluation
export const supabase = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => {
    const client = getSupabaseClient()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

/**
 * Server-only Supabase Admin client with service_role privileges
 */
export const getSupabaseAdmin = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return null
  return createClient(getSupabaseUrl(), serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
