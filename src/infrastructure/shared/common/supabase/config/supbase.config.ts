import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl: string = process.env.SUPABASE_URL!
const supabaseServiceKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client with service role for server-side operations
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey)

// Regular client for client-side operations
const supabaseAnonKey: string = process.env.SUPABASE_ANON_KEY!
export const supabaseClient: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

