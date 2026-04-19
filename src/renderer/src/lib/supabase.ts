import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://supa.dopomogai.com'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'MISSING_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
