import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url) throw new Error('VITE_SUPABASE_URL no definida')
if (!key) throw new Error('VITE_SUPABASE_ANON_KEY no definida')

// Cliente de Supabase limitado a consultas de base de datos
// La autenticación ahora se maneja vía JWT propio contra el backend de Node.js
export const supabase = createClient(url, key)
