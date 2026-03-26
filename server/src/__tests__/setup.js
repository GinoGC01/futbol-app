import { config } from 'dotenv'
config({ path: '../.env' })

// Forzar environment de test para evitar que morgan loguee
process.env.NODE_ENV = 'test'

// Valores dummy para que supabase.js no explote en tests con mock
if (!process.env.SUPABASE_URL) process.env.SUPABASE_URL = 'https://test.supabase.co'
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
