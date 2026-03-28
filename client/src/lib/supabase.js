import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

import { cookieStorage } from './cookieStorage'

if (!url) throw new Error('VITE_SUPABASE_URL no definida')
if (!key) throw new Error('VITE_SUPABASE_ANON_KEY no definida')

export const supabase = createClient(url, key, {
  auth: {
    storage: cookieStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
