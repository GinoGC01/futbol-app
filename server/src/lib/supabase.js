import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url) throw new Error('SUPABASE_URL no definida en .env')
if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY no definida en .env')

export const supabaseAdmin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
})
