/**
 * @purpose Singleton Supabase client initialized from env vars.
 * @why Supabase JS is not singleton by default; centralizing ensures one WebSocket connection across the app.
 * @role util
 * @exports supabase
 * @uses @supabase/supabase-js
 * @stability stable
 * @gotchas Falls back to 'MISSING_KEY' if VITE_SUPABASE_ANON_KEY is absent; client initializes silently but all auth calls will 401 without warning
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://supa.dopomogai.com'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'MISSING_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
